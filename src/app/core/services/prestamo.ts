import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ActualizarPrestamoCommand,
  CrearPrestamoCommand,
  DetallePrestamo,
  PrestamoDto,
  PrestamoFiltros,
  PrestamoListado
} from '../models/prestamo.model';
import { CambiarEstadoCommand } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class PrestamoService {
  private apiUrl = `${API_BASE_URL}/Prestamos`;

  constructor(private http: HttpClient) { }

  listar(filtros: PrestamoFiltros): Observable<PrestamoListado> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('tamano', filtros.tamano);

    const buscar = filtros.buscar.trim();
    if (buscar.length > 0) {
      params = params.set('buscar', buscar);
    }
    if (filtros.soloActivos) {
      params = params.set('soloActivos', true);
    }
    if (filtros.clienteId !== null) {
      params = params.set('clienteId', filtros.clienteId);
    }

    return this.http.get<PrestamoListado>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<DetallePrestamo> {
    return this.http.get<DetallePrestamo>(`${this.apiUrl}/${id}`);
  }

  crear(prestamo: CrearPrestamoCommand): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, prestamo);
  }

  actualizar(id: number, prestamo: ActualizarPrestamoCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, prestamo);
  }

  cambiarEstado(id: number, estado: boolean): Observable<void> {
    const body: CambiarEstadoCommand = { estado };
    return this.http.put<void>(`${this.apiUrl}/${id}/estado`, body);
  }

  /** Borrado logico: el backend marca estado=false sin quitar la fila. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}