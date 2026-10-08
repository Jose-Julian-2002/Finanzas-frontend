export interface RolDto {
  id: number;
  nombre: string;
  cantidadUsuarios: number;
  cantidadPermisos: number;
  esBase: boolean;
  puedeGestionarUsuarios: boolean;
}

export interface PermisoDto {
  id: number;
  nombre: string;
  modulo: string;
  accion: string;
  descripcion: string;
}

export interface PermisoResumenDto {
  id: number;
  nombre: string;
}

export interface RolDetalleDto {
  id: number;
  nombre: string;
  esBase: boolean;
  puedeGestionarUsuarios: boolean;
  cantidadUsuarios: number;
  permisos: PermisoResumenDto[];
}

export interface GuardarRolCommand {
  nombre: string;
}

export interface AsignarPermisosCommand {
  permisos: number[];
}

export interface GrupoPermisos {
  modulo: string;
  permisos: PermisoDto[];
}