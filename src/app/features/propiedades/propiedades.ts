import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PropiedadService } from '../../core/services/propiedad';
import { TipoPropiedadService } from '../../core/services/tipo-propiedad';
import { AuthService } from '../../core/services/auth';
import { PropiedadDto } from '../../core/models/propiedad.model';
import { TipoPropiedadDto } from '../../core/models/tipo-propiedad.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { PropiedadFormDialogComponent } from './dialogs/propiedad-form-dialog';

@Component({
  selector: 'app-propiedades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    Select,
    Tag,
    ToggleSwitch,
    Tooltip,
    Dialog,
    PropiedadFormDialogComponent
  ],
  templateUrl: './propiedades.html',
  styleUrl: './propiedades.css'
})
export class PropiedadesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  readonly tipos = signal<TipoPropiedadDto[]>([]);
  readonly propiedades = signal<PropiedadDto[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly primer = signal(0);
  readonly tamano = signal(20);
  readonly soloActivos = signal(true);
  readonly tipoFiltro = signal<number | null>(null);

  readonly formVisible = signal(false);
  readonly propiedadEditando = signal<PropiedadDto | null>(null);

  readonly detalleVisible = signal(false);
  readonly detalleCargando = signal(false);
  readonly propiedadDetalle = signal<PropiedadDto | null>(null);

  constructor(
    private propiedadService: PropiedadService,
    private tipoPropiedadService: TipoPropiedadService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.controlBusqueda.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargar());

    this.cargarTipos();
    this.cargar();
  }

  get paginaActual(): number {
    return Math.floor(this.primer() / this.tamano()) + 1;
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('Propiedades.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('Propiedades.Editar');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('Propiedades.Eliminar');
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.primer.set(event.first ?? 0);
    this.tamano.set(event.rows ?? 20);
    this.cargar();
  }

  onCambiarSoloActivos(valor: boolean): void {
    this.soloActivos.set(valor);
    this.recargar();
  }

  onCambiarTipo(valor: number | null): void {
    this.tipoFiltro.set(valor);
    this.recargar();
  }

  abrirCrear(): void {
    this.propiedadEditando.set(null);
    this.formVisible.set(true);
  }

  abrirEditar(propiedad: PropiedadDto): void {
    this.propiedadEditando.set(propiedad);
    this.formVisible.set(true);
  }

  abrirDetalle(propiedad: PropiedadDto): void {
    this.propiedadDetalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.propiedadService.obtener(propiedad.id).subscribe({
      next: (detalle) => {
        this.propiedadDetalle.set(detalle);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar la propiedad',
          detail: mensajeDeError(err)
        });
        this.detalleVisible.set(false);
      }
    });
  }

  alGuardar(): void {
    this.cargar();
  }

  onCambiarEstado(propiedad: PropiedadDto, activo: boolean): void {
    this.propiedadService.cambiarEstado(propiedad.id, activo).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `${propiedad.nombre} quedó ${activo ? 'activa' : 'inactiva'}.`
        });
        this.cargar();
      },
      error: (err: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo actualizar el estado',
          detail: mensajeDeError(err)
        });
        this.cargar();
      }
    });
  }

confirmarEliminar(propiedad: PropiedadDto): void {
    const conContratos = propiedad.totalContratos > 0;

    this.confirmationService.confirm({
      header: 'Desactivar propiedad',
      message: conContratos
        ? `${propiedad.nombre} tiene ${propiedad.totalContratos} contratos asociados, por lo que no se puede eliminar. Se desactivará para retirarla de los listados activos.`
        : `¿Desea desactivar ${propiedad.nombre}? El registro se conserva en la base de datos.`,
      icon: 'pi pi-ban',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Con contratos el DELETE responde 409, así que se usa el endpoint de estado.
        const request = conContratos
          ? this.propiedadService.cambiarEstado(propiedad.id, false)
          : this.propiedadService.eliminar(propiedad.id);

        request.subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Propiedad desactivada',
              detail: `${propiedad.nombre} ya no aparece en los listados activos.`
            });
            this.cargar();
          },
          error: (err: unknown) => {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo desactivar',
              detail: mensajeDeError(err)
            });
            this.cargar();
          }
        });
      }
    });
  }

  private cargarTipos(): void {
    this.tipoPropiedadService.listar().subscribe({
      next: (tipos) => this.tipos.set(tipos ?? []),
      error: (err: unknown) => {
        this.tipos.set([]);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los tipos de propiedad',
          detail: mensajeDeError(err)
        });
      }
    });
  }

  private recargar(): void {
    this.primer.set(0);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);

    this.propiedadService.listar({
      buscar: this.controlBusqueda.value,
      pagina: this.paginaActual,
      tamano: this.tamano(),
      soloActivos: this.soloActivos(),
      tipoPropiedadId: this.tipoFiltro()
    }).subscribe({
      next: (res) => {
        this.propiedades.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.propiedades.set([]);
        this.total.set(0);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar las propiedades',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}