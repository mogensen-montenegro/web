import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Observable, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {LoginDataRequest, LoginResponse} from "./auth.interface";

@Injectable({providedIn: 'root'})
export class LoginService {
  private base_url: string = environment.baseUrl;

  private readonly TOKEN = 'token';
  private readonly REFRESH_TOKEN = 'refreshToken';
  private readonly ACCCESS_TOKEN = 'accessToken';
  private readonly SESSION_ID = 'sessionID';

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
            localStorage.setItem(this.SESSION_ID, response.sessionId);
          }
          if (response?.sessionId) {
            localStorage.setItem(this.SESSION_ID, response.sessionId);
          }
        })
      );
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
    localStorage.removeItem(this.SESSION_ID);
    this.router.navigateByUrl('/login').then();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN);
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  get accessToken(): string | null {
    return localStorage.getItem(this.ACCCESS_TOKEN);
  }

  get sessionID(): string | null {
    return localStorage.getItem(this.SESSION_ID);
  }
}
