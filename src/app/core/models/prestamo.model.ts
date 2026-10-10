import { PaginatedResponse } from './common.model';

export interface PrestamoDto {
  id: number;
  montoCapital: number;
  interes: number;
  totalCuotas: number;
  fechaInicio: string;
  estado: boolean;
  clienteId: number;
  cliente: string;
  abonoCapitalMensual: number;
  interesMensual: number;
  cuotaMensual: number;
  totalIntereses: number;
  totalPagar: number;
  totalAbonado: number;
  saldoPendiente: number;
}

export interface CuotaPrestamo {
  numero: number;
  abonoCapital: number;
  interes: number;
  total: number;
}

/** El detalle trae el prestamo mas su tabla de cuotas generadas. */
export interface DetallePrestamo {
  prestamo: PrestamoDto;
  cuotas: CuotaPrestamo[];
}

export interface PrestamoFiltros {
  buscar: string;
  pagina: number;
  tamano: number;
  soloActivos: boolean;
  clienteId: number | null;
}

export interface CrearPrestamoCommand {
  clienteId: number;
  montoCapital: number;
  interes: number;
  totalCuotas: number;
  fechaInicio: string;
}

export type ActualizarPrestamoCommand = CrearPrestamoCommand;

export type PrestamoListado = PaginatedResponse<PrestamoDto>;