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
    params = params.set('incluirAnulados', filtros.incluirAnulados ?? false);

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

  crear(pago: CrearPagoCommand): Observable<number> {
    return this.http.post<number>(this.apiUrl, pago);
  }

  anular(id: number, motivo: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { body: { motivo: motivo.trim() } });
  }
}
