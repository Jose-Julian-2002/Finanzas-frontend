import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PermisoDto } from '../models/rol.model';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {
  private apiUrl = `${API_BASE_URL}/Permisos`;

  constructor(private http: HttpClient) { }

  listar(buscar?: string): Observable<PermisoDto[]> {
    let params = new HttpParams();

    const texto = buscar?.trim() ?? '';
    if (texto.length > 0) {
      params = params.set('buscar', texto);
    }

    return this.http.get<PermisoDto[]>(this.apiUrl, { params });
  }
}