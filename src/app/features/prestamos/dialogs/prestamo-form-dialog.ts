import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Message } from 'primeng/message';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrestamoService } from '../../../core/services/prestamo';
import { ClienteService } from '../../../core/services/cliente';
import { CrearPrestamoCommand, PrestamoDto } from '../../../core/models/prestamo.model';
import { ClienteDto } from '../../../core/models/cliente.model';
import { mensajeDeError } from '../../../core/utils/api-error';
import { fechaDesdeApi, fechaParaApi } from '../../../core/utils/formato';

@Component({
  selector: 'app-prestamo-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    InputNumber,
    Select,
    DatePicker,
    Message
  ],
  templateUrl: './prestamo-form-dialog.html',
  styleUrl: './prestamo-form-dialog.css'
})
export class PrestamoFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() prestamo: PrestamoDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly prestamoService = inject(PrestamoService);
  private readonly clienteService = inject(ClienteService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly clientes = signal<ClienteDto[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly form: FormGroup;

  /** Valores originales del prestamo que se edita, para detectar recalculo. */
  private original: { montoCapital: number; interes: number; totalCuotas: number } | null = null;

  constructor() {
    this.form = this.fb.group({
      clienteId: [null as number | null, [Validators.required]],
      montoCapital: [null as number | null, [Validators.required, Validators.min(0.01)]],
      interes: [null as number | null, [Validators.required, Validators.min(0.01)]],
      totalCuotas: [null as number | null, [Validators.required, Validators.min(1)]],
      fechaInicio: [null as Date | null, [Validators.required]]
    });
  }

  get esEdicion(): boolean {
    return this.prestamo !== null;
  }

  get titulo(): string {
    return this.esEdicion ? 'Editar prestamo' : 'Nuevo prestamo';
  }

  get clienteId() {
    return this.form.get('clienteId')!;
  }

  get montoCapital() {
    return this.form.get('montoCapital')!;
  }

  get interes() {
    return this.form.get('interes')!;
  }

  get totalCuotas() {
    return this.form.get('totalCuotas')!;
  }

  get fechaInicio() {
    return this.form.get('fechaInicio')!;
  }

  ngOnChanges(): void {
    if (!this.visible) {
      return;
    }

    const p = this.prestamo;
    this.original = p
      ? { montoCapital: p.montoCapital, interes: p.interes, totalCuotas: p.totalCuotas }
      : null;

    this.form.reset({
      clienteId: p?.clienteId ?? null,
      montoCapital: p?.montoCapital ?? null,
      interes: p?.interes ?? null,
      totalCuotas: p?.totalCuotas ?? null,
      fechaInicio: fechaDesdeApi(p?.fechaInicio)
    });
    this.errorMessage.set('');

    this.clienteService.listar({
      buscar: '',
      pagina: 1,
      tamano: 200,
      soloActivos: true
    }).subscribe({
      next: (res) => this.clientes.set(res.items ?? []),
      error: (err) => {
        this.clientes.set([]);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los clientes',
          detail: mensajeDeError(err)
        });
      }
    });
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue() as {
      clienteId: number | null;
      montoCapital: number | null;
      interes: number | null;
      totalCuotas: number | null;
      fechaInicio: Date | null;
    };

    const totalCuotas = Number(valor.totalCuotas);
    if (!Number.isInteger(totalCuotas) || totalCuotas < 1) {
      this.errorMessage.set('La cantidad de cuotas debe ser un numero entero de meses.');
      return;
    }

    const payload: CrearPrestamoCommand = {
      clienteId: valor.clienteId as number,
      montoCapital: valor.montoCapital as number,
      interes: valor.interes as number,
      totalCuotas,
      fechaInicio: fechaParaApi(valor.fechaInicio)!
    };

    if (this.hayAbonosYCambianCondiciones(payload)) {
      this.confirmationService.confirm({
        header: 'Recalcular cuotas',
        message:
          'Este prestamo ya tiene abonos registrados. Al cambiar el capital, el interes o las cuotas, la cuota mensual se recalcula y puede dejar de cuadrar con los abonos existentes. ¿Desea continuar?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Recalcular',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => this.ejecutarGuardado(payload)
      });
      return;
    }

    this.ejecutarGuardado(payload);
  }

  private hayAbonosYCambianCondiciones(payload: CrearPrestamoCommand): boolean {
    if (!this.esEdicion || !this.prestamo || !this.original) {
      return false;
    }
    if ((this.prestamo.totalAbonado ?? 0) <= 0) {
      return false;
    }

    return (
      payload.montoCapital !== this.original.montoCapital ||
      payload.interes !== this.original.interes ||
      payload.totalCuotas !== this.original.totalCuotas
    );
  }

  private ejecutarGuardado(payload: CrearPrestamoCommand): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = this.esEdicion && this.prestamo
      ? this.prestamoService.actualizar(this.prestamo.id, payload)
      : this.prestamoService.crear(payload);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion ? 'Prestamo actualizado' : 'Prestamo creado',
          detail: 'El prestamo se guardó correctamente.'
        });
        this.guardado.emit();
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(mensajeDeError(err));
      }
    });
  }
}