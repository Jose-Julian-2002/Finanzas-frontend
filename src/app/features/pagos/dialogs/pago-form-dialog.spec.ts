import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { PagoFormDialogComponent } from './pago-form-dialog';
import { API_BASE_URL } from '../../../core/config/api.config';

describe('Formulario de pagos', () => {
  let form: PagoFormDialogComponent;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), MessageService] });
    form = TestBed.runInInjectionContext(() => new PagoFormDialogComponent());
    http = TestBed.inject(HttpTestingController);
    form.destinos.set([{ clave: 'C:1', etiqueta: 'Contrato', tipo: 'contrato', id: 1, valorDefecto: 500, saldo: 800 }]);
    form.agregarFila();
    form.form.patchValue({ clienteId: 1, metodoPagoId: 1, detalles: [{ destino: 'C:1', montoAplicado: 500 }] });
  });
  afterEach(() => http.verify());
  it('suma todas las aplicaciones al mismo contrato para evitar sobrepago', () => {
    form.agregarFila();
    form.filas[1].patchValue({ destino: 'C:1', montoAplicado: 400 });
    expect(form.errorDeSaldos()).toContain('800');
    expect(form.puedeGuardar).toBe(false);
    form.guardar();
    http.expectNone(`${API_BASE_URL}/Pagos`);
  });
  it('mantiene el formulario abierto y los datos al responder 409', () => {
    const cerrado = vi.spyOn(form.visibleChange, 'emit');
    const guardado = vi.spyOn(form.guardado, 'emit');
    form.guardar();
    http.expectOne(`${API_BASE_URL}/Pagos`).flush({ mensaje: 'Máximo puedes aplicar 100' }, { status: 409, statusText: 'Conflict' });
    expect(form.errorMessage()).toBe('Máximo puedes aplicar 100');
    expect(form.filas[0].value.montoAplicado).toBe(500);
    expect(form.isLoading()).toBe(false);
    expect(cerrado).not.toHaveBeenCalled();
    expect(guardado).not.toHaveBeenCalled();
  });
  it('evita solicitudes duplicadas y avisa al guardar con 201', () => {
    const guardado = vi.spyOn(form.guardado, 'emit');
    form.guardar();
    form.guardar();
    const req = http.expectOne(`${API_BASE_URL}/Pagos`);
    expect(req.request.body).toEqual({ clienteId: 1, metodoPagoId: 1, detalles: [{ montoAplicado: 500, prestamoId: null, contratoId: 1 }] });
    req.flush(3, { status: 201, statusText: 'Created' });
    expect(guardado).toHaveBeenCalledOnce();
  });
});
