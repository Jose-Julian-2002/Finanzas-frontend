import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../config/api.config';
import { DashboardReporte, CobrosReporte, ReporteFiltros, TipoReporte } from '../models/reporte.model';
import { PrestamoListado } from '../models/prestamo.model';
import { ContratoListado } from '../models/contrato.model';

export function parametrosReporte(tipo: TipoReporte, filtros: ReporteFiltros): HttpParams {
  const permitidos = tipo === 'Dashboard' ? ['desde', 'hasta']
    : tipo === 'Cobros' ? ['desde', 'hasta', 'clienteId', 'metodoPagoId', 'prestamoId', 'contratoId', 'pagina', 'tamano']
    : ['buscar', 'clienteId', 'soloActivos', 'estadoCobranza', 'pagina', 'tamano', ...(tipo === 'Contratos' ? ['propiedadId'] : [])];
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (!permitidos.includes(clave) || valor === null || valor === undefined || valor === '') continue;
    params = params.set(clave, clave === 'tamano' && tipo === 'Cobros' ? Math.min(Number(valor), 500) : valor);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  dashboard(filtros: ReporteFiltros) {
    return this.http.get<DashboardReporte>(`${API_BASE_URL}/Reportes/Dashboard`, { params: parametrosReporte('Dashboard', filtros) });
  }
  cobros(filtros: ReporteFiltros) {
    return this.http.get<CobrosReporte>(`${API_BASE_URL}/Reportes/Cobros`, { params: parametrosReporte('Cobros', filtros) });
  }
  prestamos(filtros: ReporteFiltros) {
    return this.http.get<PrestamoListado>(`${API_BASE_URL}/Reportes/Prestamos`, { params: parametrosReporte('Prestamos', filtros) });
  }
  contratos(filtros: ReporteFiltros) {
    return this.http.get<ContratoListado>(`${API_BASE_URL}/Reportes/Contratos`, { params: parametrosReporte('Contratos', filtros) });
  }
}
