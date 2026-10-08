import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ClienteService } from '../../../core/services/cliente';
import { ClienteDto, CrearClienteCommand } from '../../../core/models/cliente.model';
import { aNullable } from '../../../core/models/common.model';
import { mensajeDeError } from '../../../core/utils/api-error';

@Component({
  selector: 'app-cliente-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, InputText, Message],
  templateUrl: './cliente-form-dialog.html'
})
export class ClienteFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() cliente: ClienteDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly messageService = inject(MessageService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      documentoIdentidad: [''],
      telefono: ['']
    });
  }

  get esEdicion(): boolean {
    return this.cliente !== null;
  }

  get titulo(): string {
    return this.esEdicion ? 'Editar cliente' : 'Nuevo cliente';
  }

  get nombre() {
    return this.form.get('nombre');
  }

  ngOnChanges(): void {
    if (!this.visible) {
      return;
    }

    const c = this.cliente;
    this.form.reset({
      nombre: c?.nombre ?? '',
      documentoIdentidad: c?.documentoIdentidad ?? '',
      telefono: c?.telefono ?? ''
    });
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

    const valor = this.form.getRawValue() as {
      nombre: string;
      documentoIdentidad: string;
      telefono: string;
    };

    const payload: CrearClienteCommand = {
      nombre: valor.nombre.trim(),
      documentoIdentidad: aNullable(valor.documentoIdentidad),
      telefono: aNullable(valor.telefono)
    };

    if (payload.nombre.length === 0) {
      this.errorMessage.set('El nombre es obligatorio.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request = this.esEdicion && this.cliente
      ? this.clienteService.actualizar(this.cliente.id, payload)
      : this.clienteService.crear(payload);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion ? 'Cliente actualizado' : 'Cliente creado',
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