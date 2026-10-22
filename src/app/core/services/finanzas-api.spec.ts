import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { PagoService } from './pago';
import { PrestamoService } from './prestamo';
import { ContratoService } from './contrato';
import { ReporteService } from './reporte';
import { API_BASE_URL } from '../config/api.config';
import { mensajeDeError } from '../utils/api-error';

describe('Contrato HTTP financiero', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('envía el motivo en DELETE y admite 204', () => {
    let completado = false;
    TestBed.inject(PagoService).anular(1, ' Recibo duplicado ').subscribe(() => completado = true);
    const req = http.expectOne(`${API_BASE_URL}/Pagos/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ motivo: 'Recibo duplicado' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completado).toBe(true);
  });
  it('no agrega fecha ni usuario al crear, conserva el ID y el mensaje 409', () => {
    const payload = { clienteId: 1, metodoPagoId: 1, detalles: [{ montoAplicado: 500, prestamoId: 1, contratoId: null }] };
    TestBed.inject(PagoService).crear(payload).subscribe(id => expect(id).toBe(5));
    const req = http.expectOne(`${API_BASE_URL}/Pagos`);
    expect(req.request.body).toEqual(payload);
    req.flush(5, { status: 201, statusText: 'Created' });
    TestBed.inject(PagoService).crear(payload).subscribe({ error: err => expect(mensajeDeError(err)).toBe('Máximo puedes aplicar 100') });
    http.expectOne(`${API_BASE_URL}/Pagos`).flush({ mensaje: 'Máximo puedes aplicar 100' }, { status: 409, statusText: 'Conflict' });
  });
  it('excluye anulados por defecto y permite consultarlos explícitamente', () => {
    const service = TestBed.inject(PagoService);
    const filtro = { metodoPagoId: null, clienteId: null, pagina: 1, tamano: 20 };
    service.listar(filtro).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/Pagos'));
    expect(req.request.params.get('incluirAnulados')).toBe('false');
    req.flush({ items: [], total: 0 });
    service.listar({ ...filtro, incluirAnulados: true }).subscribe();
    const anulados = http.expectOne(r => r.url.endsWith('/Pagos'));
    expect(anulados.request.params.get('incluirAnulados')).toBe('true');
    anulados.flush({ items: [], total: 0 });
  });
  it('envía Morosos en plural y soloActivos=false en ambas carteras', () => {
    const filtros = { buscar: '', pagina: 1, tamano: 20, soloActivos: false, clienteId: null, estadoCobranza: 'Morosos' as const };
    TestBed.inject(PrestamoService).listar(filtros).subscribe();
    TestBed.inject(ContratoService).listar({ ...filtros, propiedadId: null }).subscribe();
    for (const req of http.match(r => /\/(Prestamos|Contratos)$/.test(r.url))) {
      expect(req.request.params.get('estadoCobranza')).toBe('Morosos');
      expect(req.request.params.get('soloActivos')).toBe('false');
      req.flush({ items: [], total: 0 });
    }
  });
  it('limita cobros a 500 sin enviar filtros de cartera ni usuario', () => {
    TestBed.inject(ReporteService).cobros({ tamano: 700, pagina: 2, desde: '2026-10-01', clienteId: 1, estadoCobranza: 'Morosos' }).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/Reportes/Cobros'));
    expect(req.request.params.get('tamano')).toBe('500');
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.has('estadoCobranza')).toBe(false);
    expect(req.request.params.has('usuarioId')).toBe(false);
    req.flush({ items: [], total: 4, pagina: 2, tamano: 500 });
  });
});
