import { DatosFinancierosService } from '../../core/services/datos-financieros';
import { puedeAnularPago } from '../../core/utils/anulacion-pago';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
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
  readonly incluirAnulados = signal(false);
  readonly pagoAnulando = signal<PagoDto | null>(null);
  readonly anulando = signal(false);
  readonly errorAnulacion = signal('');
  motivoAnulacion = '';
  private readonly datosFinancieros = inject(DatosFinancierosService);
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
    private messageService: MessageService
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
    this.datosFinancieros.notificar();
    this.recargar();
  }

  puedeAnular(pago: PagoDto): boolean {
    return puedeAnularPago(pago, this.puedeEliminar, this.authService.rol(), this.authService.usuarioId());
  }

  onIncluirAnulados(valor: boolean): void {
    this.incluirAnulados.set(valor);
    this.recargar();
  }

  confirmarEliminar(pago: PagoDto): void {
    if (!this.puedeAnular(pago)) return;
    this.motivoAnulacion = '';
    this.errorAnulacion.set('');
    this.pagoAnulando.set(pago);
  }

  anular(): void {
    const pago = this.pagoAnulando();
    const motivo = this.motivoAnulacion.trim();
    if (!pago || this.anulando()) return;
    if (!motivo) {
      this.errorAnulacion.set('Ingrese el motivo de anulación.');
      return;
    }
    if (!this.puedeAnular(pago)) {
      this.errorAnulacion.set('Ya no puede anular este pago. Actualice la lista.');
      return;
    }
    this.anulando.set(true);
    this.errorAnulacion.set('');
    this.pagoService.anular(pago.id, motivo).subscribe({
      next: () => {
        this.anulando.set(false);
        this.pagoAnulando.set(null);
        this.messageService.add({ severity: 'success', summary: 'Pago anulado', detail: 'El recibo se conserva y los saldos se han recalculado.' });
        this.recargar();
        if (this.detalleVisible() && this.detalle()?.pago.id === pago.id) this.abrirDetalle(pago);
        this.datosFinancieros.notificar();
      },
      error: (err: unknown) => {
        this.anulando.set(false);
        this.errorAnulacion.set(mensajeDeError(err));
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
      incluirAnulados: this.incluirAnulados(),
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
