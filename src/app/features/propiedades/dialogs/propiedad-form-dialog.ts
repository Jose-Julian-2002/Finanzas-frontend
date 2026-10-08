import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { PropiedadService } from '../../../core/services/propiedad';
import { TipoPropiedadService } from '../../../core/services/tipo-propiedad';
import { PropiedadDto } from '../../../core/models/propiedad.model';
import { TipoPropiedadDto } from '../../../core/models/tipo-propiedad.model';
import { aNullable } from '../../../core/models/common.model';
import { mensajeDeError } from '../../../core/utils/api-error';

@Component({
  selector: 'app-propiedad-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, InputText, Select, Message],
  templateUrl: './propiedad-form-dialog.html',
  styleUrl: './propiedad-form-dialog.css'
})
export class PropiedadFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() propiedad: PropiedadDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly propiedadService = inject(PropiedadService);
  private readonly tipoPropiedadService = inject(TipoPropiedadService);
  private readonly messageService = inject(MessageService);

  readonly tipos = signal<TipoPropiedadDto[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      tipoPropiedadId: [null as number | null, [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      direccion: [''],
      codigoLuz: ['', [Validators.required]],
      codigoAgua: ['', [Validators.required]],
      codigoGas: ['']
    });
  }

  get esEdicion(): boolean {
    return this.propiedad !== null;
  }

  get titulo(): string {
    return this.esEdicion ? 'Editar propiedad' : 'Nueva propiedad';
  }

  get nombre() {
    return this.form.get('nombre');
  }

  get tipoPropiedadId() {
    return this.form.get('tipoPropiedadId');
  }

  get codigoLuz() {
    return this.form.get('codigoLuz');
  }

  get codigoAgua() {
    return this.form.get('codigoAgua');
  }

  ngOnChanges(): void {
    if (!this.visible) {
      return;
    }

    const p = this.propiedad;
    this.form.reset({
      tipoPropiedadId: p?.tipoPropiedadId ?? null,
      nombre: p?.nombre ?? '',
      direccion: p?.direccion ?? '',
      codigoLuz: p?.codigoLuz ?? '',
      codigoAgua: p?.codigoAgua ?? '',
      codigoGas: p?.codigoGas ?? ''
    });
    this.errorMessage.set('');

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

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue() as {
      tipoPropiedadId: number | null;
      nombre: string;
      direccion: string;
      codigoLuz: string;
      codigoAgua: string;
      codigoGas: string;
    };

    const payload = {
      tipoPropiedadId: valor.tipoPropiedadId as number,
      nombre: valor.nombre.trim(),
      direccion: aNullable(valor.direccion),
      codigoLuz: valor.codigoLuz.trim(),
      codigoAgua: valor.codigoAgua.trim(),
      codigoGas: aNullable(valor.codigoGas)
    };

    if (payload.nombre.length === 0 || payload.codigoLuz.length === 0 || payload.codigoAgua.length === 0) {
      this.errorMessage.set('Nombre, codigo de luz y codigo de agua son obligatorios.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = this.esEdicion && this.propiedad
      ? this.propiedadService.actualizar(this.propiedad.id, payload)
      : this.propiedadService.crear(payload);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion ? 'Propiedad actualizada' : 'Propiedad creada',
          detail: `${payload.nombre} se guardó correctamente.`
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