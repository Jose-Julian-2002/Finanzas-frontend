export type EstadoCuota = 'Pendiente' | 'Parcial' | 'Pagada' | 'PagadaAnticipada' | 'PagadaConAtraso' | 'Vencida' | 'VencidaParcial';
export type EstadoCobranza = 'AlDia' | 'Moroso' | 'Liquidado';
export type FiltroCobranza = 'Todos' | 'AlDia' | 'Morosos';

export const OPCIONES_COBRANZA = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Al día', value: 'AlDia' },
  { label: 'Morosos', value: 'Morosos' }
];

export interface ResumenCobranza {
  totalAbonado: number;
  saldoPendiente: number;
  estadoCobranza: EstadoCobranza;
  cuotasVencidas: number;
  saldoVencido: number;
  diasAtrasoMax: number;
  proximoVencimiento: string | null;
}

export interface CuotaCobranza {
  numero: number;
  vencimiento: string;
  monto: number;
  abonado: number;
  saldo: number;
  estado: EstadoCuota;
  fechaPagoCompletada: string | null;
  diasAtrasoPago: number | null;
  pagoDetalleIds: number[];
}

export interface PagoAplicado {
  pagoId: number;
  pagoDetalleId: number;
  fecha: string;
  monto: number;
  metodoPago: string;
  usuario: string;
}
