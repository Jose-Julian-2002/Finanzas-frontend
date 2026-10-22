import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent, rangoDashboard } from './dashboard';
import { AuthService } from '../../core/services/auth';
import { DashboardReporte } from '../../core/models/reporte.model';

const ejemplo: DashboardReporte = {
  desde: '2026-10-01', hasta: '2026-10-21',
  tarjetas: { totalCobrado: 14000, recibos: 4, clientesActivos: 2, prestamosActivos: 1, contratosActivos: 1, saldoPorCobrar: 8500, obligacionesMorosas: 1 },
  series: { cobrosPorMes: [{ mes: '2026-10', monto: 14000, recibos: 4 }], cobrosPorMetodo: [], topClientes: [], ocupacionPropiedades: [] },
  morosidad: { prestamosMorosos: 0, saldoVencidoPrestamos: 0, contratosMorosos: 1, saldoVencidoContratos: 6500, saldoVencidoTotal: 6500, detalle: [] }
};

describe('Dashboard visual', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [DashboardComponent], providers: [provideRouter([]), { provide: AuthService, useValue: { hasPermission: () => false } }]
  }));
  it('calcula el rango inclusivo según el día de Bolivia', () => {
    expect(rangoDashboard('7', new Date('2026-10-22T02:00:00Z'))).toEqual({ desde: '2026-10-15', hasta: '2026-10-21' });
    expect(rangoDashboard('mes', new Date('2026-11-01T02:00:00Z'))).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
  });
  it('muestra un punto para un único mes y no inventa una tendencia', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('datos', ejemplo);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('circle').length).toBe(1);
    expect(fixture.nativeElement.querySelector('polyline')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Amplía el rango');
    expect(fixture.nativeElement.querySelector('.primary-action')).toBeNull();
  });
  it('mantiene cero como cero y el gráfico válido con todos los meses sin cobros', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    component.datos = { ...ejemplo, series: { ...ejemplo.series, cobrosPorMes: [{ mes: '2026-09', monto: 0, recibos: 0 }, { mes: '2026-10', monto: 0, recibos: 0 }] } };
    expect(component.linea).toBe('90,224 608,224');
    expect(component.porcentaje(0, 0)).toBe(0);
  });
  it('conserva los centavos en los importes del dashboard', () => {
    const component = TestBed.createComponent(DashboardComponent).componentInstance;
    expect(component.monto(3833.33)).toContain('3.833,33');
  });
  it('expone todos los estados vacíos sin datos de relleno', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentRef.setInput('datos', { ...ejemplo, series: { cobrosPorMes: [], cobrosPorMetodo: [], topClientes: [], ocupacionPropiedades: [] } });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No hay cobros en este período');
    expect(fixture.nativeElement.textContent).toContain('No hay obligaciones morosas');
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
  });
});
