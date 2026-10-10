import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PagoService } from '../../core/services/pago';
import { MetodoPagoService } from '../../core/services/metodo-pago';
import { ClienteService } from '../../core/services/cliente';
import { AuthService } from '../../core/services/auth';
import { DetallePago, PagoDto } from '../../core/models/pago.model';
import { MetodoPagoDto } from '../../core/models/metodo-pago.model';
import { ClienteDto } from '../../core/models/cliente.model';
import { mensajeDeError } from '../../core/utils/api-error';
import { formatoMonto } from '../../core/utils/formato';
import { PagoFormDialogComponent } from './dialogs/pago-form-dialog';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    TableModule,
    Button,
    Select,
    Tooltip,
    Dialog,
    PagoFormDialogComponent
  ],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css'
})
export class PagosComponent implements OnInit {
  readonly pagos = signal<PagoDto[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly primer = signal(0);
  readonly tamano = signal(20);
  readonly filtroMetodoId = signal<number | null>(null);
  readonly filtroClienteId = signal<number | null>(null);

  readonly metodos = signal<MetodoPagoDto[]>([]);
  readonly clientes = signal<ClienteDto[]>([]);

  readonly formVisible = signal(false);

  readonly detalleVisible = signal(false);
  readonly detalleCargando = signal(false);
  readonly detalle = signal<DetallePago | null>(null);

  constructor(
    private pagoService: PagoService,
    private metodoPagoService: MetodoPagoService,
    private clienteService: ClienteService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.cargarOpcionesFiltros();
    this.cargar();
  }

  get paginaActual(): number {
    return Math.floor(this.primer() / this.tamano()) + 1;
  }

  get puedeCrear(): boolean {
    return this.authService.hasPermission('Pagos.Crear');
  }

  get puedeEliminar(): boolean {
    return this.authService.hasPermission('Pagos.Eliminar');
  }

  formatearMonto(valor: number | null): string {
    return formatoMonto(valor);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.primer.set(event.first ?? 0);
    this.tamano.set(event.rows ?? 20);
    this.cargar();
  }

  onFiltroMetodo(id: number | null): void {
    this.filtroMetodoId.set(id);
    this.recargar();
  }

  onFiltroCliente(id: number | null): void {
    this.filtroClienteId.set(id);
    this.recargar();
  }

  abrirCrear(): void {
    this.formVisible.set(true);
  }

  abrirDetalle(pago: PagoDto): void {
    this.detalle.set(null);
    this.detalleCargando.set(true);
    this.detalleVisible.set(true);

    this.pagoService.obtener(pago.id).subscribe({
      next: (res) => {
        this.detalle.set(res);
        this.detalleCargando.set(false);
      },
      error: (err: unknown) => {
        this.detalleCargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar el recibo',
          detail: mensajeDeError(err)
        });
        this.detalleVisible.set(false);
      }
    });
  }

  alGuardar(): void {
    this.recargar();
  }

  confirmarEliminar(pago: PagoDto): void {
    this.confirmationService.confirm({
      header: 'Anular recibo',
      message: `¿Desea anular el recibo #${pago.id} de ${this.formatearMonto(pago.montoTotal)}? El registro y sus detalles se eliminan, y los saldos de los prestamos se recalculan.`,
      icon: 'pi pi-ban',
      acceptLabel: 'Anular recibo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.pagoService.eliminar(pago.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Recibo anulado',
              detail: `El recibo #${pago.id} se eliminó y los saldos se recalculan.`
            });
            this.recargar();
          },
          error: (err: unknown) => {
            this.messageService.add({
              severity: 'error',
              summary: 'No se pudo anular el recibo',
              detail: mensajeDeError(err)
            });
          }
        });
      }
    });
  }

  private cargarOpcionesFiltros(): void {
    this.metodoPagoService.listar(true).subscribe({
      next: (res) => this.metodos.set(res ?? []),
      error: () => this.metodos.set([])
    });

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

    this.pagoService.listar({
      metodoPagoId: this.filtroMetodoId(),
      clienteId: this.filtroClienteId(),
      pagina: this.paginaActual,
      tamano: this.tamano()
    }).subscribe({
      next: (res) => {
        this.pagos.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.pagos.set([]);
        this.total.set(0);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los pagos',
          detail: mensajeDeError(err)
        });
      }
    });
  }
}