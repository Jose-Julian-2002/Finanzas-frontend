import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
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
import { formatoMonto } from '../../../core/utils/formato';

/** Una deuda posible dentro del recibo: un prestamo o un contrato activo del cliente elegido. */
interface DestinoOption {
  clave: string;
  etiqueta: string;
  tipo: 'prestamo' | 'contrato';
  id: number;
  valorDefecto: number;
  saldo: number | null;
}

@Component({
  selector: 'app-pago-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    Select,
    InputNumber,
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

  readonly cargandoDestinos = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly enviado = signal(false);

  /** Ultimo cliente cuya deuda ya se cargo o se esta cargando. */
  private clienteCargado: number | null = null;

  fechaRecibo = new Date();

  readonly form: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly pagoService = inject(PagoService);
  private readonly metodoPagoService = inject(MetodoPagoService);
  private readonly clienteService = inject(ClienteService);
  private readonly prestamoService = inject(PrestamoService);
  private readonly contratoService = inject(ContratoService);
  private readonly messageService = inject(MessageService);

  constructor() {
    this.form = this.fb.group({
      clienteId: [null as number | null, [Validators.required]],
      metodoPagoId: [null as number | null, [Validators.required]],
      detalles: this.fb.array<FormGroup>([])
    });
  }

  get clienteId() {
    return this.form.get('clienteId')!;
  }

  get metodoPagoId() {
    return this.form.get('metodoPagoId')!;
  }

  get detallesArray(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  /** Filas como FormGroup para poder usar formControlName en el template. */
  get filas(): FormGroup[] {
    return this.detallesArray.controls as FormGroup[];
  }

  get tienenCliente(): boolean {
    return this.clienteId.value !== null;
  }

  /** Total reactivo: suma automatica de todos los montoAplicado del FormArray. */
  get totalRecibo(): number {
    const filas = this.detallesArray.getRawValue() as { montoAplicado: number | null }[];
    return filas.reduce((suma, detalle) => suma + (detalle.montoAplicado ?? 0), 0);
  }

  get puedeGuardar(): boolean {
    if (this.form.invalid
      || this.filas.length === 0
      || this.cargandoDestinos()
      || this.isLoading()) {
      return false;
    }

    const filasValidas = this.filas.every((fila) => {
      const destino = fila.get('destino')!.value as string | null;
      const monto = fila.get('montoAplicado')!.value as number | null;
      return destino !== null && (monto ?? 0) > 0;
    });

    return filasValidas && this.errorDeSaldos() === null;
  }

  ngOnChanges(): void {
    if (!this.visible) {
      return;
    }

    this.fechaRecibo = new Date();
    this.clienteCargado = null;
    this.form.reset({ clienteId: null, metodoPagoId: null });
    this.detallesArray.clear();
    this.agregarFila();
    this.errorMessage.set('');
    this.enviado.set(false);
    this.destinos.set([]);
    this.cargandoDestinos.set(false);

    this.cargarMetodos();
    this.cargarClientes();
  }

  rastrearFila(indice: number): number {
    return indice;
  }

  /** La fecha del recibo siempre es hoy, bloqueada para el usuario. */
  formatearFechaRecibo(): string {
    const d = this.fechaRecibo;
    const dos = (n: number): string => n.toString().padStart(2, '0');
    return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  formatearMonto(valor: number): string {
    return formatoMonto(valor);
  }

  onClienteCambiado(clienteId: number | null): void {
    const id = clienteId ?? null;

    // Guarda anti-bucle: el p-select puede re-emitir ngModelChange con el mismo
    // id cuando restaura la opcion seleccionada tras un writeValue del control.
    // Si el cliente no cambio realmente, no se vuelve a cargar ni a hacer peticiones.
    if (id === this.clienteCargado) {
      return;
    }

    this.clienteCargado = id;

    // Sin emitEvent: se evita el ciclo valueChanges -> writeValue -> ngModelChange.
    this.clienteId.setValue(id, { emitEvent: false });
    this.errorMessage.set('');

    this.detallesArray.clear();
    this.agregarFila();
    this.cargarDestinos(id);
  }

  /** Al elegir una deuda, autocompleta el monto con la cuota o el alquiler. */
  onDestinoCambiado(indice: number, clave: string | null): void {
    const destino = this.buscarDestino(clave);
    const monto = this.filas[indice]?.get('montoAplicado');
    if (destino && monto) {
      monto.setValue(destino.valorDefecto);
    }
  }

  agregarFila(): void {
    this.detallesArray.push(this.fb.group({
      destino: [null as string | null, [Validators.required]],
      montoAplicado: [null as number | null, [Validators.required, Validators.min(0.01)]]
    }));
  }

  quitarFila(indice: number): void {
    if (this.detallesArray.length > 1) {
      this.detallesArray.removeAt(indice);
      this.errorMessage.set('');
    }
  }

  buscarDestino(clave: string | null): DestinoOption | null {
    if (!clave) {
      return null;
    }
    return this.destinos().find((d) => d.clave === clave) ?? null;
  }

  errorDestino(fila: FormGroup): boolean {
    const control = fila.get('destino')!;
    return control.invalid && (control.touched || this.enviado());
  }

  errorMonto(fila: FormGroup): boolean {
    const control = fila.get('montoAplicado')!;
    return control.invalid && (control.touched || this.enviado());
  }

  mostrarErrorFila(fila: FormGroup): boolean {
    return this.errorDestino(fila) || this.errorMonto(fila);
  }

  /**
   * Anticipo de la regla anti-sobrepago del backend: la suma aplicada a un
   * prestamo nunca puede exceder su saldo pendiente.
   */
  errorDeSaldos(): string | null {
    const acumulado = new Map<string, number>();
    const filas = this.detallesArray.getRawValue() as {
      destino: string | null;
      montoAplicado: number | null;
    }[];

    for (const fila of filas) {
      const destino = this.buscarDestino(fila.destino);
      if (!destino || destino.saldo === null) {
        continue;
      }
      acumulado.set(destino.clave, (acumulado.get(destino.clave) ?? 0) + (fila.montoAplicado ?? 0));
    }

    for (const [clave, monto] of acumulado) {
      const destino = this.buscarDestino(clave);
      if (destino && destino.saldo !== null && monto > destino.saldo) {
        return `El prestamo #${destino.id} solo tiene ${formatoMonto(destino.saldo)} por pagar y se aplicó ${formatoMonto(monto)}.`;
      }
    }

    return null;
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviado.set(true);
    this.errorMessage.set('');

    const filas = this.detallesArray.getRawValue() as {
      destino: string | null;
      montoAplicado: number | null;
    }[];

    if (filas.length === 0) {
      this.errorMessage.set('El recibo debe tener al menos una aplicacion.');
      return;
    }

    const detalles: DetallePagoRequest[] = [];
    for (const fila of filas) {
      if (fila.destino === null) {
        this.errorMessage.set('Cada aplicacion debe indicar a que prestamo o contrato se aplica.');
        return;
      }
      if ((fila.montoAplicado ?? 0) <= 0) {
        this.errorMessage.set('El monto de cada aplicacion debe ser mayor que cero.');
        return;
      }

      const destino = this.buscarDestino(fila.destino)!;
      detalles.push({
        montoAplicado: fila.montoAplicado as number,
        prestamoId: destino.tipo === 'prestamo' ? destino.id : null,
        contratoId: destino.tipo === 'contrato' ? destino.id : null
      });
    }

    const errorSaldos = this.errorDeSaldos();
    if (errorSaldos) {
      this.errorMessage.set(errorSaldos);
      return;
    }

    // El drop de cliente usa optionValue="id", asi que el control ya guarda el
    // numero. Se valida de todas formas para nunca enviar 0 ni un objeto al API.
    const clienteId = this.clienteId.value as number | null;
    if (!Number.isInteger(clienteId) || (clienteId ?? 0) <= 0) {
      this.errorMessage.set('Seleccione un cliente valido antes de registrar el recibo.');
      return;
    }

    const metodoPagoId = this.metodoPagoId.value as number;

    const payload: CrearPagoCommand = {
      clienteId: clienteId as number,
      metodoPagoId,
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

  /** Carga los contratos activos y prestamos vigentes SOLO del cliente elegido. */
  private cargarDestinos(clienteId: number | null): void {
    if (clienteId === null) {
      this.destinos.set([]);
      this.cargandoDestinos.set(false);
      return;
    }

    this.cargandoDestinos.set(true);
    this.destinos.set([]);

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
        // Si el cliente cambio mientras respondia la peticion, se descarta
        // esta respuesta para no pisar las deudas del cliente actual.
        if (this.clienteCargado !== clienteId) {
          return;
        }

        const destinos: DestinoOption[] = [
          ...(prestamos.items ?? []).map((p) => ({
            clave: `P:${p.id}`,
            etiqueta: `Prestamo #${p.id} - cuota ${formatoMonto(p.cuotaMensual)} · saldo ${formatoMonto(p.saldoPendiente)}`,
            tipo: 'prestamo' as const,
            id: p.id,
            valorDefecto: p.cuotaMensual,
            saldo: p.saldoPendiente
          })),
          ...(contratos.items ?? []).map((c) => ({
            clave: `C:${c.id}`,
            etiqueta: `Contrato #${c.id} - ${c.propiedad} (alquiler ${formatoMonto(c.montoAlquiler)})`,
            tipo: 'contrato' as const,
            id: c.id,
            valorDefecto: c.montoAlquiler,
            saldo: null
          }))
        ];

        this.destinos.set(destinos);
        this.cargandoDestinos.set(false);
      },
      error: () => {
        if (this.clienteCargado !== clienteId) {
          return;
        }
        this.destinos.set([]);
        this.cargandoDestinos.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar las deudas del cliente',
          detail: 'Verifique la conexion y seleccione el cliente nuevamente.'
        });
      }
    });
  }
}