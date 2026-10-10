import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CrearPagoCommand,
  DetallePago,
  PagoDto,
  PagoFiltros,
  PagosListado
} from '../models/pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = `${API_BASE_URL}/Pagos`;

  constructor(private http: HttpClient) { }

  listar(filtros: PagoFiltros): Observable<PagosListado> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('tamano', filtros.tamano);

    if (filtros.metodoPagoId !== null) {
      params = params.set('metodoPagoId', filtros.metodoPagoId);
    }
    if (filtros.clienteId !== null) {
      params = params.set('clienteId', filtros.clienteId);
    }

    return this.http.get<PagosListado>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<DetallePago> {
    return this.http.get<DetallePago>(`${this.apiUrl}/${id}`);
  }

  crear(pago: CrearPagoCommand): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, pago);
  }

  /**
   * Borrado fisico del recibo y sus detalles (cascade). No existe edicion:
   * un recibo se anula y se rehace.
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}