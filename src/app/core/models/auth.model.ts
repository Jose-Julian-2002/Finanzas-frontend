export interface LoginCommand {
  gmail: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  rol: string;
  permisos: string[];
}

export interface RegistrarCommand {
  nombre: string;
  gmail: string;
  password: string;
}