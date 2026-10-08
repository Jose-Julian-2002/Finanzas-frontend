import { PaginatedResponse } from './common.model';

export interface PropiedadDto {
  id: number;
  nombre: string;
  direccion: string | null;
  codigoLuz: string;
  codigoAgua: string;
  codigoGas: string | null;
  estado: boolean;
  tipoPropiedadId: number;
  tipoPropiedad: string;
  totalContratos: number;
}

export interface PropiedadFiltros {
  buscar: string;
  pagina: number;
  tamano: number;
  soloActivos: boolean;
  tipoPropiedadId: number | null;
}

export interface CrearPropiedadCommand {
  tipoPropiedadId: number;
  nombre: string;
  direccion: string | null;
  codigoLuz: string;
  codigoAgua: string;
  codigoGas: string | null;
}

export type ActualizarPropiedadCommand = CrearPropiedadCommand;

export type PropiedadListado = PaginatedResponse<PropiedadDto>;