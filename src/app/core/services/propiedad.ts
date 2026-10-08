import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ActualizarPropiedadCommand,
  CrearPropiedadCommand,
  PropiedadDto,
  PropiedadFiltros,
  PropiedadListado
} from '../models/propiedad.model';
import { CambiarEstadoCommand } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class PropiedadService {
  private apiUrl = `${API_BASE_URL}/Propiedades`;

  constructor(private http: HttpClient) { }

  listar(filtros: PropiedadFiltros): Observable<PropiedadListado> {
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
    if (filtros.tipoPropiedadId !== null) {
      params = params.set('tipoPropiedadId', filtros.tipoPropiedadId);
    }

    return this.http.get<PropiedadListado>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<PropiedadDto> {
    return this.http.get<PropiedadDto>(`${this.apiUrl}/${id}`);
  }

  crear(propiedad: CrearPropiedadCommand): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, propiedad);
  }

  actualizar(id: number, propiedad: ActualizarPropiedadCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, propiedad);
  }

  cambiarEstado(id: number, estado: boolean): Observable<void> {
    const body: CambiarEstadoCommand = { estado };
    return this.http.put<void>(`${this.apiUrl}/${id}/estado`, body);
  }

  /** Borrado logico. El backend responde 409 si la propiedad tiene contratos. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}