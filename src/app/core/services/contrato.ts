import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ActualizarContratoCommand,
  ContratoDto,
  ContratoFiltros,
  ContratoListado,
  CrearContratoCommand
} from '../models/contrato.model';
import { CambiarEstadoCommand } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class ContratoService {
  private apiUrl = `${API_BASE_URL}/Contratos`;

  constructor(private http: HttpClient) { }

  listar(filtros: ContratoFiltros): Observable<ContratoListado> {
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
    if (filtros.propiedadId !== null) {
      params = params.set('propiedadId', filtros.propiedadId);
    }

    return this.http.get<ContratoListado>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<ContratoDto> {
    return this.http.get<ContratoDto>(`${this.apiUrl}/${id}`);
  }

  crear(contrato: CrearContratoCommand): Observable<unknown> {
    return this.http.post<unknown>(this.apiUrl, contrato);
  }

  actualizar(id: number, contrato: ActualizarContratoCommand): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, contrato);
  }

  cambiarEstado(id: number, estado: boolean): Observable<void> {
    const body: CambiarEstadoCommand = { estado };
    return this.http.put<void>(`${this.apiUrl}/${id}/estado`, body);
  }

  /**
   * Borrado logico e idempotente: el backend marca estado=false porque
   * PagoDetalle referencia la fila y no se puede eliminar de verdad.
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
