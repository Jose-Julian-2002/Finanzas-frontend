import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Invalida las vistas financieras abiertas después de registrar o anular un pago. */
@Injectable({ providedIn: 'root' })
export class DatosFinancierosService {
  private readonly cambios = new Subject<void>();
  readonly cambios$ = this.cambios.asObservable();
  notificar(): void { this.cambios.next(); }
}
