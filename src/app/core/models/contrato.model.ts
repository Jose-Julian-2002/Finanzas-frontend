import { PaginatedResponse } from './common.model';
import { ResumenCobranza, CuotaCobranza, PagoAplicado, FiltroCobranza } from './cobranza.model';

export interface ContratoDto extends ResumenCobranza {
  id: number;
  montoAlquiler: number;
  montoGarantia: number;
  diaPago: string;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
  propiedadId: number;
  propiedad: string;
  clienteId: number;
  cliente: string;
  usuarioId: number;
  usuario: string;
  totalPagos: number;
  alquilerEsperado: number;
  totalMensualidades: number;
}

export interface DetalleContrato {
  contrato: ContratoDto;
  mensualidades: CuotaCobranza[];
  pagos: PagoAplicado[];
}

export interface ContratoFiltros {
  estadoCobranza?: FiltroCobranza;
  buscar: string;
  pagina: number;
  tamano: number;
  soloActivos: boolean;
  clienteId: number | null;
  propiedadId: number | null;
}

/** El usuarioId lo pone el servidor desde el token: nunca viaja en el cuerpo. */
export interface CrearContratoCommand {
  propiedadId: number;
  clienteId: number;
  montoAlquiler: number;
  montoGarantia: number;
  diaPago: string;
  fechaInicio: string;
  fechaFin: string;
}

export type ActualizarContratoCommand = CrearContratoCommand;

export type ContratoListado = PaginatedResponse<ContratoDto>;
