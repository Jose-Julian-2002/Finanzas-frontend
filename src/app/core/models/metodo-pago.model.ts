export interface MetodoPagoDto {
  id: number;
  nombre: string;
  totalPagos: number;
}

export interface CrearMetodoPagoCommand {
  nombre: string;
}

export interface ActualizarMetodoPagoCommand {
  nombre: string;
}