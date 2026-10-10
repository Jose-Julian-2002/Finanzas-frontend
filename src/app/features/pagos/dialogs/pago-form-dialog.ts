import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { PagoService } from '../../../core/services/pago';
import { MetodoPagoService } from '../../../core/services/metodo-pago';
import { ClienteService } from '../../../core/services/cliente';
import { PrestamoService } from '../../../core/services/prestamo';
import { ContratoService } from '../../../core/services/contrato';
import { CrearPagoCommand, DetallePagoRequest } from '../../../core/models/pago.model';
import { MetodoPagoDto } from '../../../core/models/metodo-pago.model';
import { ClienteDto } from '../../../core/models/cliente.model';
import { mensajeDeError } from '../../../core/utils/api-error';
import { fechaParaApi, formatoMonto } from '../../../core/utils/formato';

interface DestinoOption {
  clave: string;
  etiqueta: string;
  tipo: 'prestamo' | 'contrato';
  id: number;
  saldo: number | null;
}

interface FilaPago {
  id: number;
  destino: string | null;
  monto: number | null;
  fechaPago: Date | null;
}

@Component({
  selector: 'app-pago-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    Select,
    InputNumber,
    DatePicker,
    Message
  ],
  templateUrl: './pago-form-dialog.html',
  styleUrl: './pago-form-dialog.css'
})
export class PagoFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  readonly metodos = signal<MetodoPagoDto[]>([]);
  readonly clientes = signal<ClienteDto[]>([]);
  readonly destinos = signal<DestinoOption[]>([]);
  readonly filas = signal<FilaPago[]>([]);

  readonly cargandoDestinos = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly intentado = signal(false);

  readonly form: FormGroup;

  private instanciaFila = 0;

  private readonly fb = inject(FormBuilder);
  private readonly pagoService = inject(PagoService);
  private readonly metodoPagoService = inject(MetodoPagoService);
  private readonly clienteService = inject(ClienteService);
  private readonly prestamoService = inject(PrestamoService);
  private readonly contratoService = inject(ContratoService);
  private readonly messageService = inject(MessageService);

  constructor() {
    this.form = this.fb.group({
      fecha: [new Date(), [Validators.required]],
      metodoPagoId: [null as number | null, [Validators.required]],
      clienteFiltro: [null as number | null]
    });
  }

  get fecha() {
    return this.form.get('fecha')!;
  }

  get metodoPagoId() {
    return this.form.get('metodoPagoId')!;
  }

  get clienteFiltro() {
    return this.form.get('clienteFiltro')!;
  }

  get totalRecibo(): number {
    return this.filas().reduce((suma, fila) => suma + (fila.monto ?? 0), 0);
  }

  formatearMonto(valor: number): string {
    return formatoMonto(valor);
  }

  get puedeGuardar(): boolean {
    return this.form.valid
      && this.filas().length > 0
      && this.filas().every((f) => f.destino !== null && (f.monto ?? 0) > 0)
      && this.errorDeSaldos() === null
      && !this.cargandoDestinos()
      && !this.isLoading();
  }

  ngOnChanges(): void {
    if (!this.visible) {
      return;
    }

    this.form.reset({ fecha: new Date(), metodoPagoId: null, clienteFiltro: null });
    this.errorMessage.set('');
    this.intentado.set(false);
    this.instanciaFila = 0;
    this.filas.set([]);
    this.agregarFila();

    this.cargarMetodos();
    this.cargarClientes();
    this.cargarDestinos();
  }

  onFiltroClienteCambio(clienteId: number | null): void {
    this.clienteFiltro.setValue(clienteId);
    this.cargarDestinos();
  }

  onDestinoCambiado(fila: FilaPago): void {
    const destino = this.buscarDestino(fila.destino);
    if (!destino || destino.tipo !== 'prestamo' || destino.saldo === null) {
      return;
    }

    if (!fila.monto || fila.monto <= 0) {
      this.reemplazarFila(fila.id, { ...fila, monto: destino.saldo });
    }
  }

  agregarFila(): void {
    this.filas.set([...this.filas(), {
      id: ++this.instanciaFila,
      destino: null,
      monto: null,
      fechaPago: null
    }]);
  }

  quitarFila(fila: FilaPago): void {
    this.filas.set(this.filas().filter((f) => f.id !== fila.id));
  }

  buscarDestino(clave: string | null): DestinoOption | null {
    if (!clave) {
      return null;
    }
    return this.destinos().find((d) => d.clave === clave) ?? null;
  }

  /** Queda claro en el dialogo a que prestamo o contrato apunta cada fila. */
  etiquetaDestino(clave: string | null): string {
    const destino = this.buscarDestino(clave);
    return destino ? destino.etiqueta : 'Verificar destino';
  }

  errorDeSaldos(): string | null {
    const acumulado = new Map<string, number>();

    for (const fila of this.filas()) {
      const destino = this.buscarDestino(fila.destino);
      if (!destino || destino.saldo === null) {
        continue;
      }
      acumulado.set(destino.clave, (acumulado.get(destino.clave) ?? 0) + (fila.monto ?? 0));
    }

    for (const [clave, monto] of acumulado) {
      const destino = this.buscarDestino(clave);
      if (destino && destino.saldo !== null && monto > destino.saldo) {
        return `El prestamo #${destino.id} solo tiene ${formatoMonto(destino.saldo)} por pagar y se aplicó ${formatoMonto(monto)}.`;
      }
    }

    return null;
  }

  tieneErrorFila(fila: FilaPago): boolean {
    return this.intentado() && (fila.destino === null || (fila.monto ?? 0) <= 0);
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.intentado.set(true);
    this.errorMessage.set('');

    const filas = this.filas();
    if (filas.length === 0) {
      this.errorMessage.set('El recibo debe tener al menos una aplicacion (prestamo o contrato).');
      return;
    }

    const detalles: DetallePagoRequest[] = [];
    for (const fila of filas) {
      if (fila.destino === null) {
        this.errorMessage.set('Cada aplicacion debe indicar a que prestamo o contrato se aplica.');
        return;
      }
      if ((fila.monto ?? 0) <= 0) {
        this.errorMessage.set('El monto de cada aplicacion debe ser mayor que cero.');
        return;
      }

      const destino = this.buscarDestino(fila.destino)!;
      detalles.push({
        montoAplicado: fila.monto as number,
        fechaPago: fila.fechaPago ? fechaParaApi(fila.fechaPago) : null,
        prestamoId: destino.tipo === 'prestamo' ? destino.id : null,
        contratoId: destino.tipo === 'contrato' ? destino.id : null
      });
    }

    const errorSaldos = this.errorDeSaldos();
    if (errorSaldos) {
      this.errorMessage.set(errorSaldos);
      return;
    }

    const valor = this.form.getRawValue() as { fecha: Date; metodoPagoId: number };

    const payload: CrearPagoCommand = {
      fecha: fechaParaApi(valor.fecha)!,
      metodoPagoId: valor.metodoPagoId,
      detalles
    };

    this.isLoading.set(true);

    this.pagoService.crear(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Recibo registrado',
          detail: `Se registró un recibo por ${formatoMonto(this.totalRecibo)}.`
        });
        this.guardado.emit();
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(mensajeDeError(err));
      }
    });
  }

  private reemplazarFila(id: number, nueva: FilaPago): void {
    this.filas.set(this.filas().map((f) => (f.id === id ? nueva : f)));
  }

  private cargarMetodos(): void {
    this.metodoPagoService.listar(false).subscribe({
      next: (res) => this.metodos.set(res ?? []),
      error: (err: unknown) => {
        this.metodos.set([]);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los metodos de pago',
          detail: mensajeDeError(err)
        });
      }
    });
  }

  private cargarClientes(): void {
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

  private cargarDestinos(): void {
    this.cargandoDestinos.set(true);
    this.destinos.set([]);

    const clienteId = this.clienteFiltro.value as number | null;

    forkJoin({
      prestamos: this.prestamoService.listar({
        buscar: '',
        clienteId,
        soloActivos: true,
        pagina: 1,
        tamano: 200
      }),
      contratos: this.contratoService.listar({
        buscar: '',
        clienteId,
        propiedadId: null,
        soloActivos: true,
        pagina: 1,
        tamano: 200
      })
    }).subscribe({
      next: ({ prestamos, contratos }) => {
        const destinos: DestinoOption[] = [
          ...(prestamos.items ?? []).map((p) => ({
            clave: `P:${p.id}`,
            etiqueta: `Prestamo #${p.id} - ${p.cliente} (saldo ${formatoMonto(p.saldoPendiente)})`,
            tipo: 'prestamo' as const,
            id: p.id,
            saldo: p.saldoPendiente
          })),
          ...(contratos.items ?? []).map((c) => ({
            clave: `C:${c.id}`,
            etiqueta: `Contrato #${c.id} - ${c.propiedad}`,
            tipo: 'contrato' as const,
            id: c.id,
            saldo: null
          }))
        ];

        this.destinos.set(destinos);
        this.cargandoDestinos.set(false);
      },
      error: () => {
        this.destinos.set([]);
        this.cargandoDestinos.set(false);
      }
    });
  }
}