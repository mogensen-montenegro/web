import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { LoginService } from 'src/app/portal/pages/login/login-core/login.service';
import { AdminEmailPayload, ApiResponse } from '../interface/email.interface';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private base_url = environment.baseUrl;

  constructor(private http: HttpClient, private auth: LoginService) {}

  private headers(): HttpHeaders {
    // mantengo el esquema que ya usan en ArchivosService
    const token = this.auth.getToken();
    const access = this.auth.getAccess(); // p. ej. 'Bearer'
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  sendToAdmin(payload: AdminEmailPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.base_url}/email/admin-email`,
      payload,
      { headers: this.headers() }
    );
  }
}
