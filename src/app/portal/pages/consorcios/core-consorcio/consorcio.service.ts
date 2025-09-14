import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';
import {Observable, tap} from 'rxjs';
import {Consorcio, ConsorcioResponse, CrearConsorcioResponse} from "./consorcio.interface";
import {LoginService} from "../../login/login-core/login.service";

@Injectable({providedIn: 'root'})
export class ConsorcioService {
  private base_url: string = environment.baseUrl;

  constructor(private http: HttpClient, private authService: LoginService) {
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const access = this.authService.getAccess();
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  crearConsorcio(idUser: string, formData: Consorcio): Observable<CrearConsorcioResponse> {
    const headers = this.buildAuthHeaders();
    return this.http.post<CrearConsorcioResponse>(`${this.base_url}/consorcio/create/${idUser}`, formData, {headers}).pipe(tap((response) => response));
  }

  updateById(id: string, formData: Consorcio): Observable<ConsorcioResponse> {
    const headers = this.buildAuthHeaders();
    return this.http.put<ConsorcioResponse>(`${this.base_url}/consorcio/update/${id}`, formData, {headers}).pipe(tap((response) => response));
  }

  getAllById(idAdmin: string): Observable<ConsorcioResponse> {
    const headers = this.buildAuthHeaders();
    return this.http.get<ConsorcioResponse>(`${this.base_url}/consorcio/all/${idAdmin}`, {headers});
  }

  deleteById(id: string) {
    const headers = this.buildAuthHeaders();
    return this.http.delete<{ ok: boolean; msj: string }>(`${this.base_url}/consorcio/delete/${id}`, {headers});
  }
}
