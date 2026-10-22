import { PaginatedResponse } from './common.model';
import { FiltroCobranza } from './cobranza.model';

export type FilaReporte = Record<string, unknown>;
export type TipoReporte = 'Dashboard' | 'Cobros' | 'Prestamos' | 'Contratos';

export interface CobroReporte {
  pagoId: number;
  fecha: string;
  clienteId: number;
  cliente: string;
  metodoPagoId: number;
  metodoPago: string;
  usuarioId: number;
  usuario: string;
  montoTotal: number;
  detalles: {
    pagoDetalleId: number;
    monto: number;
    prestamoId: number | null;
    contratoId: number | null;
    referencia: string;
  }[];
}

export interface CobroPorMes { mes: string; monto: number; recibos: number; }
export interface CobroPorMetodo { metodoPagoId: number; metodo: string; monto: number; recibos: number; }
export interface OcupacionPropiedad { propiedadId: number; propiedad: string; estado: string; contratosActivos: number; alquilerMensual: number; }
export interface ClienteCobros { clienteId: number; cliente: string; monto: number; recibos: number; }
export interface ObligacionMorosa { tipo: string; id: number; cliente: string; saldoVencido: number; diasAtrasoMax: number; proximoVencimiento: string | null; }

export interface ReporteFiltros {
  desde?: string;
  hasta?: string;
  clienteId?: number | null;
  metodoPagoId?: number | null;
  prestamoId?: number | null;
  contratoId?: number | null;
  propiedadId?: number | null;
  buscar?: string;
  soloActivos?: boolean;
  estadoCobranza?: FiltroCobranza;
  pagina?: number;
  tamano?: number;
}

export interface DashboardReporte {
  desde: string;
  hasta: string;
  tarjetas: {
    totalCobrado: number;
    recibos: number;
    clientesActivos: number;
    prestamosActivos: number;
    contratosActivos: number;
    saldoPorCobrar: number;
    obligacionesMorosas: number;
  };
  series: {
    cobrosPorMes: CobroPorMes[];
    cobrosPorMetodo: CobroPorMetodo[];
    ocupacionPropiedades: OcupacionPropiedad[];
    topClientes: ClienteCobros[];
  };
  morosidad: {
    prestamosMorosos: number;
    saldoVencidoPrestamos: number;
    contratosMorosos: number;
    saldoVencidoContratos: number;
    saldoVencidoTotal: number;
    detalle: ObligacionMorosa[];
  };
}

export type CobrosReporte = PaginatedResponse<CobroReporte>;
