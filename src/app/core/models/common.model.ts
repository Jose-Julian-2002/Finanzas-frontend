export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}

export interface ApiError {
  mensaje: string;
}

/** Cuerpo de PUT /{id}/estado, compartido por Cliente, Propiedad y Usuario. */
export interface CambiarEstadoCommand {
  estado: boolean;
}

/** El backend devuelve null, no string vacio, para los campos opcionales. */
export function aNullable(valor: string | null | undefined): string | null {
  const texto = (valor ?? '').trim();
  return texto.length === 0 ? null : texto;
}