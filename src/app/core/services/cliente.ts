import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ActualizarClienteCommand,
  ClienteDto,
  ClienteFiltros,
  ClienteListado,
  CrearClienteCommand
} from '../models/cliente.model';
import { CambiarEstadoCommand } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${API_BASE_URL}/Clientes`;

  constructor(private http: HttpClient) { }

  listar(filtros: ClienteFiltros): Observable<ClienteListado> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('tamano', filtros.tamano);

    const buscar = filtros.buscar.trim();
    if (buscar.length > 0) {
      params = params.set('buscar', buscar);
    }
    // Verificado contra la API: el filtro se llama `soloActivos`.
// `estado` se acepta pero se ignora, por lo que devolvería todos los registros.
if (filtros.soloActivos) {
      params = params.set('soloActivos', true);
    }

    return this.http.get<ClienteListado>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/${id}`);
  }

  crear(cliente: CrearClienteCommand): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, cliente);
  }

  actualizar(id: number, cliente: ActualizarClienteCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, cliente);
  }

  cambiarEstado(id: number, estado: boolean): Observable<void> {
    const body: CambiarEstadoCommand = { estado };
    return this.http.put<void>(`${this.apiUrl}/${id}/estado`, body);
  }

  /** Borrado logico: el backend marca estado=false en lugar de quitar la fila. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}