import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { MetodoPagoService } from '../../../core/services/metodo-pago';
import { MetodoPagoDto } from '../../../core/models/metodo-pago.model';
import { mensajeDeError } from '../../../core/utils/api-error';

@Component({
  selector: 'app-metodo-pago-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, InputText, Message],
  templateUrl: './metodo-pago-form-dialog.html'
})
export class MetodoPagoFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() metodo: MetodoPagoDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  readonly form: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly metodoPagoService = inject(MetodoPagoService);
  private readonly messageService = inject(MessageService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  get esEdicion(): boolean {
    return this.metodo !== null;
  }

  get titulo(): string {
    return this.esEdicion ? 'Editar metodo de pago' : 'Nuevo metodo de pago';
  }

  get nombre() {
    return this.form.get('nombre');
  }

  ngOnChanges(): void {
    if (!this.visible) {
      return;
    }

    this.form.reset({ nombre: this.metodo?.nombre ?? '' });
    this.errorMessage.set('');
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nombre = (this.form.getRawValue() as { nombre: string }).nombre.trim();
    if (nombre.length === 0) {
      this.errorMessage.set('El nombre es obligatorio.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = this.esEdicion && this.metodo
      ? this.metodoPagoService.actualizar(this.metodo.id, { nombre })
      : this.metodoPagoService.crear({ nombre });

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion ? 'Metodo actualizado' : 'Metodo creado',
          detail: `${nombre} se guardó correctamente.`
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