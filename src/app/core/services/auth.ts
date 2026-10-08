import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { LoginCommand, LoginResponse, RegistrarCommand } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const NOMBRE_KEY = 'auth_nombre';
const ROL_KEY = 'auth_rol';
const PERMISOS_KEY = 'auth_permisos';
const PASSWORD_INICIAL_KEY = 'auth_password_inicial';

function leerPermisos(): string[] {
  try {
    const raw = localStorage.getItem(PERMISOS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly nombre = signal<string>(localStorage.getItem(NOMBRE_KEY) ?? '');
  readonly rol = signal<string>(localStorage.getItem(ROL_KEY) ?? '');
  readonly permisos = signal<string[]>(leerPermisos());

  private apiUrl = `${API_BASE_URL}/Auth`;

  constructor(private http: HttpClient) { }

  login(credenciales: LoginCommand): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((res) => this.persistirSesion(res))
    );
  }

  registrar(datos: RegistrarCommand): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/registrar`, datos);
  }

  hasPermission(permiso: string): boolean {
    return this.permisos().includes(permiso);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NOMBRE_KEY);
    localStorage.removeItem(ROL_KEY);
    localStorage.removeItem(PERMISOS_KEY);
    this.nombre.set('');
    this.rol.set('');
    this.permisos.set([]);
  }

  debeCambiarPasswordInicial(): boolean {
    return localStorage.getItem(PASSWORD_INICIAL_KEY) !== 'false';
  }

  marcarPasswordInicialHecho(): void {
    localStorage.setItem(PASSWORD_INICIAL_KEY, 'false');
  }

  inicialUsuario(): string {
    return this.nombre().trim().charAt(0).toUpperCase() || '?';
  }

  private persistirSesion(res: LoginResponse): void {
    const permisos = Array.isArray(res.permisos) ? res.permisos : [];

    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(NOMBRE_KEY, res.nombre ?? '');
    localStorage.setItem(ROL_KEY, res.rol ?? '');
    localStorage.setItem(PERMISOS_KEY, JSON.stringify(permisos));

    this.nombre.set(res.nombre ?? '');
    this.rol.set(res.rol ?? '');
    this.permisos.set(permisos);
  }
}