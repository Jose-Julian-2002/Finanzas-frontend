import { PagoDto } from '../models/pago.model';

const diaBolivia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit'
});

export function puedeAnularPago(pago: PagoDto, permiso: boolean, rol: string,
  usuarioId: number | null, ahora = new Date()): boolean {
  if (pago.anulado || !permiso) return false;
  if (rol === 'Administrador') return true;
  if (rol !== 'Cobrador' || usuarioId === null || pago.usuarioId !== usuarioId) return false;
  // Las fechas sin offset del API representan la hora local del negocio.
  const fecha = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(pago.fecha) ? pago.fecha : `${pago.fecha}-04:00`);
  return !Number.isNaN(fecha.getTime()) && diaBolivia.format(fecha) === diaBolivia.format(ahora);
}
