import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginService } from '../login/login-core/login.service';
import { PersonalResponse, Profesores, ResponseDatoPersonal } from './profesor.interface';

@Injectable({ providedIn: 'root' })
export class ProfesoresService {
  private baseUrl = environment.baseUrl;
  private profesorSubject = new BehaviorSubject<Profesores | null>(null);
  public profesorData$ = this.profesorSubject.asObservable();

  constructor(private http: HttpClient, private authService: LoginService) {}

  public updateUsuarioData(data: Profesores | null): void {
    this.profesorSubject.next(data);
  }

  private headers(): HttpHeaders {
    const token = this.authService.getToken();
    const access = this.authService.getAccess();
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  public obtenerProfesores(): Observable<Profesores[]> {
    return this.http.get<PersonalResponse>(`${this.baseUrl}/personal/all`, { headers: this.headers() }).pipe(
      map((response) => (Array.isArray(response.body) ? response.body : []))
    );
  }

  public guardarProfesor(profesor: Profesores): Observable<PersonalResponse> {
    return this.http.post<PersonalResponse>(`${this.baseUrl}/personal/create`, profesor, { headers: this.headers() });
  }

  public editarProfesor(id: string, profesor: Profesores, update: boolean): Observable<PersonalResponse> {
    return this.http.put<PersonalResponse>(
      `${this.baseUrl}/personal/update/${id}`,
      { ...profesor, update },
      { headers: this.headers() }
    );
  }

  public eliminarProfesor(id: string): Observable<PersonalResponse> {
    return this.http.delete<PersonalResponse>(`${this.baseUrl}/personal/delete/${id}`, { headers: this.headers() });
  }

  public obtenerDatosProfesor(documento: string, page: number, limit: number): Observable<ResponseDatoPersonal> {
    return this.http
      .get<ResponseDatoPersonal>(`${this.baseUrl}/personal/registros/${documento}?page=${page}&limit=${limit}`, {
        headers: this.headers()
      })
      .pipe(
        map((response) => ({
          registros: response?.registros || [],
          total: Number(response?.total) || 0,
          totalPages: Number(response?.totalPages) || 0,
          currentPage: Number(response?.currentPage) || page
        }))
      );
  }
}
