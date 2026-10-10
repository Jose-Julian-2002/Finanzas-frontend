import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ContratoService } from '../../core/services/contrato';
import { ClienteService } from '../../core/services/cliente';
import { PropiedadService } from '../../core/services/propiedad';
import { AuthService } from '../../core/services/auth';
import { ContratoDto } from '../../core/models/contrato.model';
import { ClienteDto } from '../../core/models/cliente.model';
import { PropiedadDto } from '../../core/models/propiedad.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { formatoMonto } from '../../core/utils/formato';
import { ContratoFormDialogComponent } from './dialogs/contrato-form-dialog';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    ToggleSwitch,
    Select,
    Tooltip,
    Dialog,
    ContratoFormDialogComponent
  ],
  templateUrl: './contratos.html',
  styleUrl: './contratos.css'
})
export class ContratosComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  readonly contratos = signal<ContratoDto[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly primer = signal(0);
  readonly tamano = signal(20);
  readonly soloActivos = signal(true);
  readonly filtroClienteId = signal<number | null>(null);
  readonly filtroPropiedadId = signal<number | null>(null);

  readonly clientes = signal<ClienteDto[]>([]);
  readonly propiedades = signal<PropiedadDto[]>([]);

  readonly formVisible = signal(false);
  readonly contratoEditando = signal<ContratoDto | null>(null);

  readonly detalleVisible = signal(false);
  readonly detalleCargando = signal(false);
  readonly contratoDetalle = signal<ContratoDto | null>(null);

  constructor(
    private contratoService: ContratoService,
    private clienteService: ClienteService,
    private propiedadService: PropiedadService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.controlBusqueda.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.recargar());

    this.cargarOpcionesFiltros();
    this.cargar();
  }

  get paginaActual(): number {
    return Math.floor(this.primer() / this.tamano()) + 1;
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('Contratos.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('Contratos.Editar');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('Contratos.Eliminar');
  }

  formatearMonto(valor: number | null): string {
    return formatoMonto(valor);
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

  onFiltroCliente(id: number | null): void {
    this.filtroClienteId.set(id);
    this.recargar();
  }

  onFiltroPropiedad(id: number | null): void {
    this.filtroPropiedadId.set(id);
    this.recargar();
  }

  abrirCrear(): void {
    this.contratoEditando.set(null);
    this.formVisible.set(true);
  }

  abrirEditar(contrato: ContratoDto): void {
    this.contratoEditando.set(contrato);
    this.formVisible.set(true);
  }

  onCambiarEstado(contrato: ContratoDto, activo: boolean): void {
    this.contratoService.cambiarEstado(contrato.id, activo).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Contrato ${contrato.id} quedó ${activo ? 'activo' : 'inactivo'}.`
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

  confirmarEliminar(contrato: ContratoDto): void {
    this.confirmationService.confirm({
      header: 'Desactivar contrato',
      message: `¿Desea desactivar el contrato de ${contrato.cliente} en ${contrato.propiedad}? El registro se conserva porque los pagos lo referencian.`,
      icon: 'pi pi-ban',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.contratoService.eliminar(contrato.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Contrato desactivado',
              detail: `El contrato ${contrato.id} ya no aparece en los listados activos.`
            });
            this.cargar();
          },
          error: (err: unknown) => {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo desactivar',
              detail: mensajeDeError(err)
            });
          }
        });
      }
    });
  }

  abrirDetalle(contrato: ContratoDto): void {
    this.contratoDetalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.contratoService.obtener(contrato.id).subscribe({
      next: (detalle) => {
        this.contratoDetalle.set(detalle);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar el contrato',
          detail: mensajeDeError(err)
        });
        this.detalleVisible.set(false);
      }
    });
  }

  alGuardar(): void {
    this.cargar();
  }

  private cargarOpcionesFiltros(): void {
    this.clienteService.listar({
      buscar: '',
      pagina: 1,
      tamano: 200,
      soloActivos: true
    }).subscribe({
      next: (res) => this.clientes.set(res.items ?? []),
      error: () => this.clientes.set([])
    });

    this.propiedadService.listar({
      buscar: '',
      pagina: 1,
      tamano: 200,
      soloActivos: true,
      tipoPropiedadId: null
    }).subscribe({
      next: (res) => this.propiedades.set(res.items ?? []),
      error: () => this.propiedades.set([])
    });
  }

  private recargar(): void {
    this.primer.set(0);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);

    this.contratoService.listar({
      buscar: this.controlBusqueda.value,
      pagina: this.paginaActual,
      tamano: this.tamano(),
      soloActivos: this.soloActivos(),
      clienteId: this.filtroClienteId(),
      propiedadId: this.filtroPropiedadId()
    }).subscribe({
      next: (res) => {
        this.contratos.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.contratos.set([]);
        this.total.set(0);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los contratos',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}