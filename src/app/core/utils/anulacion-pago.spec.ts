import { describe, it, expect } from 'vitest';
import { puedeAnularPago } from './anulacion-pago';
import { PagoDto } from '../models/pago.model';

const pago: PagoDto = {
  id: 1, fecha: '2026-10-21T13:05:00', usuarioId: 2, usuario: 'Cobrador',
  metodoPagoId: 1, metodoPago: 'Efectivo', montoTotal: 500, totalDetalles: 1,
  anulado: false, anuladoPor: null, anuladoPorId: null, fechaAnulacion: null, motivoAnulacion: null
};
const ahora = new Date('2026-10-21T20:00:00Z');

describe('Anulación de pagos', () => {
  it('permite al administrador anular recibos de otros usuarios y días', () => {
    expect(puedeAnularPago({ ...pago, fecha: '2020-01-01T10:00:00' }, true, 'Administrador', 7, ahora)).toBe(true);
  });
  it('exige permiso incluso al administrador y rechaza pagos ya anulados', () => {
    expect(puedeAnularPago(pago, false, 'Administrador', 2, ahora)).toBe(false);
    expect(puedeAnularPago({ ...pago, anulado: true }, true, 'Administrador', 2, ahora)).toBe(false);
  });
  it('el cobrador solo puede anular los propios de hoy', () => {
    expect(puedeAnularPago(pago, true, 'Cobrador', 2, ahora)).toBe(true);
    expect(puedeAnularPago(pago, true, 'Cobrador', 3, ahora)).toBe(false);
    expect(puedeAnularPago({ ...pago, fecha: '2026-10-20T13:05:00' }, true, 'Cobrador', 2, ahora)).toBe(false);
    expect(puedeAnularPago(pago, true, 'Cobrador', null, ahora)).toBe(false);
  });
  it('compara el día del negocio en el límite de medianoche UTC', () => {
    const noche = { ...pago, fecha: '2026-10-21T23:59:00' };
    expect(puedeAnularPago(noche, true, 'Cobrador', 2, new Date('2026-10-22T03:59:30Z'))).toBe(true);
    expect(puedeAnularPago(noche, true, 'Cobrador', 2, new Date('2026-10-22T04:00:00Z'))).toBe(false);
  });
  it('acepta fechas UTC y rechaza fechas inválidas o roles no autorizados', () => {
    expect(puedeAnularPago({ ...pago, fecha: '2026-10-21T17:05:00Z' }, true, 'Cobrador', 2, ahora)).toBe(true);
    expect(puedeAnularPago({ ...pago, fecha: 'inválida' }, true, 'Cobrador', 2, ahora)).toBe(false);
    expect(puedeAnularPago(pago, true, 'Consulta', 2, ahora)).toBe(false);
  });
});
