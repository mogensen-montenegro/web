import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LoginService } from '../login/login-core/login.service';
import { PlantillaEmail } from './plantilla-email.interface';

interface ApiResponse<T> {
  ok: boolean;
  body?: T;
  msj?: string;
}

@Injectable({ providedIn: 'root' })
export class PlantillaEmailService {
  private baseUrl = `${environment.baseUrl}/plantillas-email`;

  constructor(private http: HttpClient, private auth: LoginService) {}

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    const access = this.auth.getAccess();
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  getAll(): Observable<PlantillaEmail[]> {
    return this.http.get<ApiResponse<PlantillaEmail[]>>(`${this.baseUrl}/all`, { headers: this.authHeaders() }).pipe(
      map((res) => (res?.ok && Array.isArray(res.body) ? res.body : [])),
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<PlantillaEmail | null> {
    return this.http.get<ApiResponse<PlantillaEmail>>(`${this.baseUrl}/${id}`, { headers: this.authHeaders() }).pipe(
      map((res) => (res?.ok && res.body ? res.body : null)),
      catchError(() => of(null))
    );
  }

  create(data: Omit<PlantillaEmail, 'id'>): Observable<PlantillaEmail | null> {
    return this.http
      .post<ApiResponse<PlantillaEmail>>(`${this.baseUrl}/create`, data, { headers: this.authHeaders() })
      .pipe(
        map((res) => (res?.ok && res.body ? res.body : null)),
        catchError(() => of(null))
      );
  }

  update(id: string, data: Partial<Omit<PlantillaEmail, 'id'>>): Observable<PlantillaEmail | null> {
    return this.http
      .put<ApiResponse<PlantillaEmail>>(`${this.baseUrl}/update/${id}`, data, { headers: this.authHeaders() })
      .pipe(
        map((res) => (res?.ok && res.body ? res.body : null)),
        catchError(() => of(null))
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/delete/${id}`, { headers: this.authHeaders() }).pipe(
      map((res) => !!res?.ok),
      catchError(() => of(false))
    );
  }
}
