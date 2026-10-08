import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
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
import { Password } from 'primeng/password';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario';
import { AuthService } from '../../../core/services/auth';
import { mensajeDeError } from '../../../core/utils/api-error';

@Component({
  selector: 'app-cambiar-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Dialog, Button, Password, Message],
  templateUrl: './cambiar-password-dialog.html'
})
export class CambiarPasswordDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() usuarioId = 1;
  @Input() titulo = 'Cambiar contraseña';
  @Input() bloqueante = false;
  @Output() cambiado = new EventEmitter<void>();

  form: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      passwordActual: ['', [Validators.required]],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', [Validators.required, this.coinciden.bind(this)]]
    });
  }

  get passwordActual() {
    return this.form.get('passwordActual');
  }

  get passwordNueva() {
    return this.form.get('passwordNueva');
  }

  get confirmar() {
    return this.form.get('confirmar');
  }

  cerrar(): void {
    if (this.bloqueante) {
      return;
    }
    this.visibleChange.emit(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { passwordActual, passwordNueva } = this.form.getRawValue() as {
      passwordActual: string;
      passwordNueva: string;
    };

    this.usuarioService.cambiarPassword(this.usuarioId, { passwordActual, passwordNueva }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.form.reset();
        this.visibleChange.emit(false);

        if (this.bloqueante) {
          this.authService.marcarPasswordInicialHecho();
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: 'La contraseña se cambió correctamente.'
        });

        this.cambiado.emit();
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(mensajeDeError(err));
      }
    });
  }

  private coinciden(control: AbstractControl): ValidationErrors | null {
    const nueva = this.form?.get('passwordNueva')?.value;
    return control.value === nueva ? null : { passwordsDistintas: true };
  }
}