import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, finalize, Observable, of, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {LoginDataRequest, LoginResponse} from "./auth.interface";

@Injectable({providedIn: 'root'})
export class LoginService {
  private base_url: string = environment.baseUrl;

  private readonly TOKEN = 'token';
  private readonly REFRESH_TOKEN = 'refreshToken';
  private readonly ACCESS_TOKEN = 'accessToken';
  private readonly SESSION_ID = 'sessionID';
  private readonly USER_ID = 'userId';
  private readonly OWNER_USER_ID = 'ownerUserId';
  private readonly SESSION_USER = 'sessionUser';
  private readonly PERSONAL_PERMISOS = 'personalPermisos';

  constructor(private http: HttpClient, private router: Router) {
  }

  public login(formData: LoginDataRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base_url}/login`, formData)
      .pipe(
        tap((response: LoginResponse) => {
          if (response?.auth?.token) {
            localStorage.setItem(this.TOKEN, response.auth.token);
          }
          if (response?.auth?.refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN, response.auth.refreshToken);
          }
          if (response?.auth?.accessToken) {
            localStorage.setItem(this.ACCESS_TOKEN, response.auth.accessToken);
          }
          if (response?.sessionId) {
            localStorage.setItem(this.SESSION_ID, response.sessionId);
          }
          if (response?.userId) {
            localStorage.setItem(this.USER_ID, response.userId);
          }
          const ownerUserId = response?.ownerUserId || (response?.role === 'personal' ? null : response?.userId);
          if (ownerUserId) {
            localStorage.setItem(this.OWNER_USER_ID, String(ownerUserId));
          } else {
            localStorage.removeItem(this.OWNER_USER_ID);
          }
          const sessionUser = response?.user || response?.nombre || formData?.user;
          if (sessionUser) {
            localStorage.setItem(this.SESSION_USER, String(sessionUser));
          }
          if (response?.permisosModulos) {
            localStorage.setItem(this.PERSONAL_PERMISOS, JSON.stringify(response.permisosModulos));
          } else {
            localStorage.removeItem(this.PERSONAL_PERMISOS);
          }
        })
      );
  }

  /** Borra solo los datos de sesión; no toca el resto del localStorage (ej. noticias). */
  public clearAuthData(): void {
    localStorage.removeItem(this.TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
    localStorage.removeItem(this.ACCESS_TOKEN);
    localStorage.removeItem(this.SESSION_ID);
    localStorage.removeItem(this.USER_ID);
    localStorage.removeItem(this.OWNER_USER_ID);
    localStorage.removeItem(this.SESSION_USER);
    localStorage.removeItem(this.PERSONAL_PERMISOS);
    localStorage.removeItem('lastActivityAt');
  }

  public logout(detalle = 'Fin de jornada'): void {
    const finish = () => {
      this.clearAuthData();
      void this.router.navigateByUrl('/login');
    };

    if (this.getRole() === 'personal' && this.getToken()) {
      this.registrarEvento({
        tipo: 'asistencia',
        accionRealizada: 'Salida del portal',
        detalle
      })
        .pipe(
          catchError(() => of(null)),
          finalize(finish)
        )
        .subscribe();
      return;
    }

    finish();
  }

  public registrarEvento(payload: {
    tipo: 'asistencia' | 'accion';
    detalle?: string;
    accionRealizada?: string;
    moduloModificacion?: string;
    resultadoModificacion?: string;
  }): Observable<unknown> {
    const token = this.getToken();
    const access = this.getAccess() || 'Bearer';
    return this.http.post(`${this.base_url}/personal/reportes/evento`, payload, {
      headers: {
        Authorization: `${access} ${token}`
      }
    });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN);
  }

  getAccess(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID);
  }

  /** ID de oficina dueña de los datos. Para personal usa ownerUserId. */
  getDataUserId(): string {
    if (this.getRole() === 'personal') {
      return localStorage.getItem(this.OWNER_USER_ID)
        || localStorage.getItem(this.USER_ID)
        || '000000000000000000000000';
    }
    return localStorage.getItem(this.USER_ID) || '000000000000000000000000';
  }

  getSessionUser(): string | null {
    const stored = localStorage.getItem(this.SESSION_USER);
    if (stored) return stored;
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload?.email || null;
    } catch {
      return null;
    }
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  get accessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN);
  }

  get sessionID(): string | null {
    return localStorage.getItem(this.SESSION_ID);
  }

  getRole(): 'admin' | 'superuser' | 'personal' | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload?.role ?? null;
    } catch {
      return null;
    }
  }

  hasRole(roles: string[]): boolean {
    const r = this.getRole();
    return !!r && roles.includes(r);
  }
}
