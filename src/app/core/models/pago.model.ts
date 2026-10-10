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
 * prestamoId o contratoId, nunca ambos ni ninguno.
 */
export interface DetallePagoRequest {
  montoAplicado: number;
  fechaPago: string | null;
  prestamoId: number | null;
  contratoId: number | null;
}

/**
 * Cuerpo de POST /api/Pagos. El montoTotal NO se envia: el servidor lo calcula
 * como la suma de los detalles, y el usuarioId lo toma del token.
 */
export interface CrearPagoCommand {
  fecha: string;
  metodoPagoId: number;
  detalles: DetallePagoRequest[];
}

export type PagosListado = PaginatedResponse<PagoDto>;