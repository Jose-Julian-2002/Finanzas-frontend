import { PaginatedResponse } from './common.model';

export interface ContratoDto {
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
}

export interface ContratoFiltros {
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
