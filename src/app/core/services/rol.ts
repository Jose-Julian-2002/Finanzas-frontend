import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AsignarPermisosCommand,
  GuardarRolCommand,
  RolDetalleDto,
  RolDto
} from '../models/rol.model';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private apiUrl = `${API_BASE_URL}/Roles`;

  constructor(private http: HttpClient) { }

  listar(buscar?: string): Observable<RolDto[]> {
    let params = new HttpParams();

    const texto = buscar?.trim() ?? '';
    if (texto.length > 0) {
      params = params.set('buscar', texto);
    }

    return this.http.get<RolDto[]>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<RolDetalleDto> {
    return this.http.get<RolDetalleDto>(`${this.apiUrl}/${id}`);
  }

  listarPermisosDeRol(id: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/${id}/permisos`);
  }

  crear(rol: GuardarRolCommand): Observable<unknown> {
    return this.http.post(this.apiUrl, rol);
  }

  actualizar(id: number, rol: GuardarRolCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, rol);
  }

  asignarPermisos(id: number, command: AsignarPermisosCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/permisos`, command);
  }

  quitarPermiso(id: number, permisoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/permisos/${permisoId}`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}