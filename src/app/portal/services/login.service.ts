import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginDataRequest, LoginResponse } from '../interface';

@Injectable()
export class LoginService {

  /**
   * Subject que almacena el Rol del usuario logueado.
   */

  constructor(private http: HttpClient, private router: Router) { }

  public get refreshToken(): string {
    return sessionStorage.getItem('refresh-token') || '';
  }

  public login(formData: LoginDataRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`/api/b1s/v2/Login`, formData)
      .pipe(
        tap((resp: LoginResponse) => {
          if (resp?.SessionId) {
            localStorage.setItem('sessionId', resp.SessionId);
            localStorage.setItem('user', formData.UserName);
          }
        })
      );
  }

  public logout(): void {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');

    this.router.navigateByUrl('/login')
  }

  public isSessionValid(): boolean {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return false;
    else return true
  }
}
