export interface TipoPropiedadDto {
  id: number;
  nombre: string;
  totalPropiedades: number;
}

export interface CrearTipoPropiedadCommand {
  nombre: string;
}

export type ActualizarTipoPropiedadCommand = CrearTipoPropiedadCommand;