import { CambiarEstadoCommand, PaginatedResponse } from './common.model';

export type { CambiarEstadoCommand, PaginatedResponse };

export interface UsuarioDto {
  id: number;
  nombre: string;
  gmail: string;
  estado: boolean;
  rolId: number;
  rol: string;
}

export interface UsuarioFiltros {
  buscar: string;
  pagina: number;
  tamano: number;
  soloActivos: boolean;
  rolId: number | null;
}

export interface CrearUsuarioCommand {
  nombre: string;
  gmail: string;
  password: string;
  rolId: number;
}

export interface ActualizarUsuarioCommand {
  nombre: string;
  gmail: string;
}

export interface CambiarPasswordCommand {
  passwordActual: string;
  passwordNueva: string;
}