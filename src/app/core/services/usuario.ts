import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ActualizarUsuarioCommand,
  CambiarEstadoCommand,
  CambiarPasswordCommand,
  CrearUsuarioCommand,
  PaginatedResponse,
  UsuarioDto,
  UsuarioFiltros
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${API_BASE_URL}/Usuarios`;

  constructor(private http: HttpClient) { }

  listar(filtros: UsuarioFiltros): Observable<PaginatedResponse<UsuarioDto>> {
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
    if (filtros.rolId !== null) {
      params = params.set('rolId', filtros.rolId);
    }

    return this.http.get<PaginatedResponse<UsuarioDto>>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(`${this.apiUrl}/${id}`);
  }

  crear(usuario: CrearUsuarioCommand): Observable<unknown> {
    return this.http.post(this.apiUrl, usuario);
  }

  actualizar(id: number, usuario: ActualizarUsuarioCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, usuario);
  }

  cambiarRol(id: number, rolId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/rol`, { rolId });
  }

  cambiarEstado(id: number, estado: boolean): Observable<void> {
    const body: CambiarEstadoCommand = { estado };
    return this.http.put<void>(`${this.apiUrl}/${id}/estado`, body);
  }

  cambiarPassword(id: number, body: CambiarPasswordCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/password`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}