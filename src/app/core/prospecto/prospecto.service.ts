import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LoginService } from '../../portal/pages/login/login-core/login.service';
import { Prospecto, ProspectoEstado, ProspectoResponse } from './prospecto.interface';

@Injectable({ providedIn: 'root' })
export class ProspectoService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient, private authService: LoginService) {}

  private get authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const access = this.authService.getAccess();
    return new HttpHeaders().set('Authorization', `${access || 'Bearer'} ${token || ''}`);
  }

  crear(formData: Prospecto): Observable<Prospecto> {
    return this.http.post<ProspectoResponse>(`${this.baseUrl}/prospecto/create`, formData).pipe(
      map((res) => {
        if (!res?.ok || !res.body || Array.isArray(res.body)) {
          throw new Error(res?.msj || 'Error al enviar la consulta');
        }
        return res.body;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  getAll(): Observable<Prospecto[]> {
    return this.http
      .get<ProspectoResponse>(`${this.baseUrl}/prospecto/all`, { headers: this.authHeaders })
      .pipe(
        map((res) => {
          if (!res?.ok) throw new Error(res?.msj || 'Error al cargar prospectos');
          return Array.isArray(res.body) ? res.body : [];
        })
      );
  }

  actualizarEstado(id: string, estado: ProspectoEstado): Observable<Prospecto> {
    return this.http
      .put<ProspectoResponse>(`${this.baseUrl}/prospecto/update/${id}`, { estado }, { headers: this.authHeaders })
      .pipe(
        map((res) => {
          if (!res?.ok || !res.body || Array.isArray(res.body)) {
            throw new Error(res?.msj || 'Error al actualizar');
          }
          return res.body;
        })
      );
  }

  eliminar(id: string): Observable<void> {
    return this.http
      .delete<ProspectoResponse>(`${this.baseUrl}/prospecto/delete/${id}`, { headers: this.authHeaders })
      .pipe(
        map((res) => {
          if (!res?.ok) throw new Error(res?.msj || 'Error al eliminar');
        })
      );
  }
}
