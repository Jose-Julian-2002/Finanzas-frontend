import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario';
import { UsuarioDto } from '../../../core/models/usuario.model';
import { RolDto } from '../../../core/models/rol.model';
import { mensajeDeError } from '../../../core/utils/api-error';

@Component({
  selector: 'app-usuario-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    InputText,
    Password,
    Select,
    Message
  ],
  templateUrl: './usuario-form-dialog.html'
})
export class UsuarioFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() usuario: UsuarioDto | null = null;
  @Input() roles: RolDto[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  form: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      gmail: ['', [Validators.required, Validators.email]],
      password: [''],
      rolId: [null as number | null]
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.preparar();
    }
  }

  get esEdicion(): boolean {
    return this.usuario !== null;
  }

  get titulo(): string {
    return this.esEdicion ? 'Editar usuario' : 'Nuevo usuario';
  }

  get nombre() {
    return this.form.get('nombre');
  }

  get gmail() {
    return this.form.get('gmail');
  }

  get password() {
    return this.form.get('password');
  }

  get rolId() {
    return this.form.get('rolId');
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuario = this.usuario;

    if (!usuario && this.rolId?.value === null) {
      this.errorMessage.set('Seleccione un rol.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const valores = this.form.getRawValue() as {
      nombre: string;
      gmail: string;
      password: string;
      rolId: number | null;
    };

    const request = usuario
      ? this.usuarioService.actualizar(usuario.id, {
        nombre: valores.nombre,
        gmail: valores.gmail
      })
      : this.usuarioService.crear({
        nombre: valores.nombre,
        gmail: valores.gmail,
        password: valores.password,
        rolId: valores.rolId as number
      });

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.visibleChange.emit(false);
        this.messageService.add({
          severity: 'success',
          summary: usuario ? 'Usuario actualizado' : 'Usuario creado',
          detail: usuario
            ? 'Los datos se guardaron correctamente.'
            : 'El usuario se registró correctamente.'
        });
        this.guardado.emit();
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(mensajeDeError(err));
      }
    });
  }

  private preparar(): void {
    this.errorMessage.set('');

    if (this.usuario) {
      this.form.reset({
        nombre: this.usuario.nombre,
        gmail: this.usuario.gmail,
        password: '',
        rolId: null
      });
      this.password?.clearValidators();
      this.rolId?.clearValidators();
    } else {
      this.form.reset({
        nombre: '',
        gmail: '',
        password: '',
        rolId: null
      });
      this.password?.setValidators([Validators.required, Validators.minLength(6)]);
      this.rolId?.setValidators([Validators.required]);
    }

    this.form.updateValueAndValidity();
  }
}