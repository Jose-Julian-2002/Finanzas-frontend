import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme';
import { mensajeDeError } from '../../../core/utils/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Password,
    Button,
    Message,
    Tooltip
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  readonly themeService = inject(ThemeService);

  formLogin: FormGroup;
  isLoading = signal(false);
  mensajeError = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.formLogin = this.fb.group({
      gmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get gmail() {
    return this.formLogin.get('gmail');
  }

  get password() {
    return this.formLogin.get('password');
  }

  iniciarSesion() {
    if (this.formLogin.invalid) return;

    this.isLoading.set(true);
    this.mensajeError.set('');

    this.authService.login(this.formLogin.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.mensajeError.set('Credenciales incorrectas o usuario inactivo. Verifique el correo y la contrasena, o contacte al administrador.');
        } else {
          this.mensajeError.set(mensajeDeError(err));
        }
      }
    });
  }
}