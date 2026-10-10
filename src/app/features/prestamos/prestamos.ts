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
import { PrestamoService } from '../../core/services/prestamo';
import { ClienteService } from '../../core/services/cliente';
import { AuthService } from '../../core/services/auth';
import { DetallePrestamo, PrestamoDto } from '../../core/models/prestamo.model';
import { ClienteDto } from '../../core/models/cliente.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { formatoMonto } from '../../core/utils/formato';
import { PrestamoFormDialogComponent } from './dialogs/prestamo-form-dialog';

@Component({
  selector: 'app-prestamos',
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
    PrestamoFormDialogComponent
  ],
  templateUrl: './prestamos.html',
  styleUrl: './prestamos.css'
})
export class PrestamosComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  readonly controlBusqueda = new FormControl('', { nonNullable: true });

  readonly prestamos = signal<PrestamoDto[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly primer = signal(0);
  readonly tamano = signal(20);
  readonly soloActivos = signal(true);
  readonly filtroClienteId = signal<number | null>(null);

  readonly clientes = signal<ClienteDto[]>([]);

  readonly formVisible = signal(false);
  readonly prestamoEditando = signal<PrestamoDto | null>(null);

  readonly detalleVisible = signal(false);
  readonly detalleCargando = signal(false);
  readonly detalle = signal<DetallePrestamo | null>(null);

  constructor(
    private prestamoService: PrestamoService,
    private clienteService: ClienteService,
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
    return this.authService.hasPermission('Prestamos.Crear');
  }

  get puedeEditar(): boolean {
    return this.authService.hasPermission('Prestamos.Editar');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('Prestamos.Eliminar');
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

  abrirCrear(): void {
    this.prestamoEditando.set(null);
    this.formVisible.set(true);
  }

  abrirEditar(prestamo: PrestamoDto): void {
    this.prestamoEditando.set(prestamo);
    this.formVisible.set(true);
  }

  onCambiarEstado(prestamo: PrestamoDto, activo: boolean): void {
    this.prestamoService.cambiarEstado(prestamo.id, activo).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `Prestamo ${prestamo.id} quedó ${activo ? 'activo' : 'inactivo'}.`
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

  confirmarEliminar(prestamo: PrestamoDto): void {
    this.confirmationService.confirm({
      header: 'Desactivar prestamo',
      message: `¿Desea desactivar el prestamo de ${prestamo.cliente}? El registro se conserva porque los pagos lo referencian.`,
      icon: 'pi pi-ban',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.prestamoService.eliminar(prestamo.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Prestamo desactivado',
              detail: `El prestamo ${prestamo.id} ya no aparece en los listados activos.`
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

  abrirDetalle(prestamo: PrestamoDto): void {
    this.detalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.prestamoService.obtener(prestamo.id).subscribe({
      next: (res) => {
        this.detalle.set(res);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar el prestamo',
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
  }

  private recargar(): void {
    this.primer.set(0);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);

    this.prestamoService.listar({
      buscar: this.controlBusqueda.value,
      pagina: this.paginaActual,
      tamano: this.tamano(),
      soloActivos: this.soloActivos(),
      clienteId: this.filtroClienteId()
    }).subscribe({
      next: (res) => {
        this.prestamos.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.prestamos.set([]);
        this.total.set(0);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los prestamos',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}