import { PaginatedResponse } from './common.model';

export interface ClienteDto {
  id: number;
  nombre: string;
  documentoIdentidad: string | null;
  telefono: string | null;
  fechaRegistro: string | null;
  estado: boolean;
  totalPrestamos: number;
  totalContratos: number;
}

export interface ClienteFiltros {
  buscar: string;
  pagina: number;
  tamano: number;
  soloActivos: boolean;
}

export interface CrearClienteCommand {
  nombre: string;
  documentoIdentidad: string | null;
  telefono: string | null;
}

export type ActualizarClienteCommand = CrearClienteCommand;

export type ClienteListado = PaginatedResponse<ClienteDto>;