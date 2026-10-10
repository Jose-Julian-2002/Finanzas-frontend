import { PaginatedResponse } from './common.model';

export interface PagoDto {
  id: number;
  fecha: string;
  montoTotal: number;
  metodoPagoId: number;
  metodoPago: string;
  usuarioId: number;
  usuario: string;
  totalDetalles: number;
}

export interface PagoDetalleDto {
  id: number;
  montoAplicado: number;
  fechaPago: string;
  prestamoId: number | null;
  contratoId: number | null;
  referencia: string | null;
}

export interface DetallePago {
  pago: PagoDto;
  detalles: PagoDetalleDto[];
}

export interface PagoFiltros {
  metodoPagoId: number | null;
  clienteId: number | null;
  pagina: number;
  tamano: number;
}

/**
 * Una aplicacion del recibo. El backend exige que aplique a UN solo destino:
 * prestamoId o contratoId, nunca ambos ni ninguno. La fecha de cada detalle
 * la asigna el servidor junto con la del recibo.
 */
export interface DetallePagoRequest {
  montoAplicado: number;
  prestamoId: number | null;
  contratoId: number | null;
}

/**
 * Cuerpo de POST /api/Pagos. La fecha la asigna el servidor y el usuarioId
 * (cajero) sale del token; el montoTotal se calcula como suma de los detalles.
 */
export interface CrearPagoCommand {
  clienteId: number;
  metodoPagoId: number;
  detalles: DetallePagoRequest[];
}

export type PagosListado = PaginatedResponse<PagoDto>;