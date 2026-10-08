import { HttpErrorResponse } from '@angular/common/http';

const MENSAJE_POR_DEFECTO = 'Ocurrió un error inesperado. Intente nuevamente.';

function esTimeout(error: unknown): boolean {
  return typeof error === 'object' && error !== null &&
    (error as { name?: string }).name === 'TimeoutError';
}

export function mensajeDeError(error: unknown): string {
  if (esTimeout(error)) {
    return 'El servidor tardó demasiado en responder. Intente nuevamente.';
  }

  const httpError = error as HttpErrorResponse;
  const mensaje = httpError?.error?.mensaje;

  if (typeof mensaje === 'string' && mensaje.trim().length > 0) {
    return mensaje;
  }

  if (httpError?.status === 0) {
    return 'No se pudo conectar con el servidor. Verifique que la API esté ejecutándose.';
  }

  return MENSAJE_POR_DEFECTO;
}