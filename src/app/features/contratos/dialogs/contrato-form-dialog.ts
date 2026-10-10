import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ContratoService } from '../../../core/services/contrato';
import { ClienteService } from '../../../core/services/cliente';
import { PropiedadService } from '../../../core/services/propiedad';
import { ContratoDto, CrearContratoCommand } from '../../../core/models/contrato.model';
import { ClienteDto } from '../../../core/models/cliente.model';
import { PropiedadDto } from '../../../core/models/propiedad.model';
import { mensajeDeError } from '../../../core/utils/api-error';
import { fechaDesdeApi, fechaParaApi } from '../../../core/utils/formato';

@Component({
  selector: 'app-contrato-form-dialog',
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
  templateUrl: './contrato-form-dialog.html',
  styleUrl: './contrato-form-dialog.css'
})
export class ContratoFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() contrato: ContratoDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly contratoService = inject(ContratoService);
  private readonly clienteService = inject(ClienteService);
  private readonly propiedadService = inject(PropiedadService);
  private readonly messageService = inject(MessageService);

  readonly clientes = signal<ClienteDto[]>([]);
  readonly propiedades = signal<PropiedadDto[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      clienteId: [null as number | null, [Validators.required]],
      propiedadId: [null as number | null, [Validators.required]],
      montoAlquiler: [null as number | null, [Validators.required, Validators.min(0.01)]],
      montoGarantia: [null as number | null, [Validators.required, Validators.min(0.01)]],
      diaPago: [null as Date | null, [Validators.required]],
      fechaInicio: [null as Date | null, [Validators.required]],
      fechaFin: [null as Date | null, [Validators.required]]
    }, { validators: this.vigenciaValida });
  }

  get esEdicion(): boolean {
    return this.contrato !== null;
  }

  get titulo(): string {
    return this.esEdicion ? 'Editar contrato' : 'Nuevo contrato';
  }

  get clienteId() {
    return this.form.get('clienteId')!;
  }

  get propiedadId() {
    return this.form.get('propiedadId')!;
  }

  get montoAlquiler() {
    return this.form.get('montoAlquiler')!;
  }

  get montoGarantia() {
    return this.form.get('montoGarantia')!;
  }

  get diaPago() {
    return this.form.get('diaPago')!;
  }

  get fechaInicio() {
    return this.form.get('fechaInicio')!;
  }

  get fechaFin() {
    return this.form.get('fechaFin')!;
  }

  ngOnChanges(): void {
    if (!this.visible) {
      return;
    }

    const c = this.contrato;
    this.form.reset({
      clienteId: c?.clienteId ?? null,
      propiedadId: c?.propiedadId ?? null,
      montoAlquiler: c?.montoAlquiler ?? null,
      montoGarantia: c?.montoGarantia ?? null,
      diaPago: fechaDesdeApi(c?.diaPago),
      fechaInicio: fechaDesdeApi(c?.fechaInicio),
      fechaFin: fechaDesdeApi(c?.fechaFin)
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
        this.avisarOpciones('clientes', err);
      }
    });

    this.propiedadService.listar({
      buscar: '',
      pagina: 1,
      tamano: 200,
      soloActivos: true,
      tipoPropiedadId: null
    }).subscribe({
      next: (res) => this.propiedades.set(res.items ?? []),
      error: (err) => {
        this.propiedades.set([]);
        this.avisarOpciones('propiedades', err);
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
      propiedadId: number | null;
      montoAlquiler: number | null;
      montoGarantia: number | null;
      diaPago: Date | null;
      fechaInicio: Date | null;
      fechaFin: Date | null;
    };

    const payload: CrearContratoCommand = {
      propiedadId: valor.propiedadId as number,
      clienteId: valor.clienteId as number,
      montoAlquiler: valor.montoAlquiler as number,
      montoGarantia: valor.montoGarantia as number,
      diaPago: fechaParaApi(valor.diaPago)!,
      fechaInicio: fechaParaApi(valor.fechaInicio)!,
      fechaFin: fechaParaApi(valor.fechaFin)!
    };

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = this.esEdicion && this.contrato
      ? this.contratoService.actualizar(this.contrato.id, payload)
      : this.contratoService.crear(payload);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion ? 'Contrato actualizado' : 'Contrato creado',
          detail: `Contrato en ${this.nombrePropiedad(payload.propiedadId)} guardado correctamente.`
        });
        this.guardado.emit();
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(mensajeDeError(err));
      }
    });
  }

  private vigenciaValida(group: AbstractControl): ValidationErrors | null {
    const inicio = group.get('fechaInicio')?.value as Date | null;
    const fin = group.get('fechaFin')?.value as Date | null;

    if (inicio && fin && inicio > fin) {
      return { vigenciaInvalida: true };
    }
    return null;
  }

  private nombrePropiedad(id: number): string {
    return this.propiedades().find((p) => p.id === id)?.nombre ?? `#${id}`;
  }

  private avisarOpciones(tipo: 'clientes' | 'propiedades', err: unknown): void {
    const etiqueta = tipo === 'clientes' ? 'los clientes' : 'las propiedades';
    this.messageService.add({
      severity: 'error',
      summary: `No se pudieron cargar ${etiqueta}`,
      detail: mensajeDeError(err)
    });
  }
}