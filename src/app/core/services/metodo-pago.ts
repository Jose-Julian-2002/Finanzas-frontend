import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ActualizarMetodoPagoCommand,
  CrearMetodoPagoCommand,
  MetodoPagoDto
} from '../models/metodo-pago.model';

@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {
  private apiUrl = `${API_BASE_URL}/MetodosPago`;

  constructor(private http: HttpClient) { }

  /** Listado simple (no paginado) para catalogo y desplegables. */
  listar(soloUsados = false): Observable<MetodoPagoDto[]> {
    const params = new HttpParams().set('soloUsados', soloUsados);
    return this.http.get<MetodoPagoDto[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<MetodoPagoDto> {
    return this.http.get<MetodoPagoDto>(`${this.apiUrl}/${id}`);
  }

  crear(metodo: CrearMetodoPagoCommand): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, metodo);
  }

  actualizar(id: number, metodo: ActualizarMetodoPagoCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, metodo);
  }

  /**
   * Borrado fisico. El backend rechaza (400) si el metodo ya tiene pagos,
   * porque Pago.MetodoPagoId lo referencia.
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}