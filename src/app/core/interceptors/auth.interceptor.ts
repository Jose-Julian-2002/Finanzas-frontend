import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth';

const RUTAS_PUBLICAS = ['/Auth/login', '/Auth/registrar'];
const TIMEOUT_MS = 20000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const esPublica = RUTAS_PUBLICAS.some((ruta) => req.url.includes(ruta));
  const token = authService.getToken();

  const request = esPublica || !token
    ? req
    : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(request).pipe(
    timeout(TIMEOUT_MS),
    catchError((error: unknown) => {
      const status = (error as HttpErrorResponse)?.status;

      if (status === 401 && !esPublica) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};