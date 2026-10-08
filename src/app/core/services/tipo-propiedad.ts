import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ActualizarTipoPropiedadCommand,
  CrearTipoPropiedadCommand,
  TipoPropiedadDto
} from '../models/tipo-propiedad.model';

@Injectable({
  providedIn: 'root'
})
export class TipoPropiedadService {
  private apiUrl = `${API_BASE_URL}/TiposPropiedad`;

  constructor(private http: HttpClient) { }

  listar(buscar = ''): Observable<TipoPropiedadDto[]> {
    let params = new HttpParams();
    const texto = buscar.trim();
    if (texto.length > 0) {
      params = params.set('buscar', texto);
    }
    return this.http.get<TipoPropiedadDto[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<TipoPropiedadDto> {
    return this.http.get<TipoPropiedadDto>(`${this.apiUrl}/${id}`);
  }

  crear(tipo: CrearTipoPropiedadCommand): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, tipo);
  }

  actualizar(id: number, tipo: ActualizarTipoPropiedadCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, tipo);
  }

  /** Borrado fisico. El backend responde 409 si el tipo tiene propiedades. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}