import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';
import {Observable, tap} from 'rxjs';
import {Administrador, AdministradorResponse} from "./administrador.interface";
import {LoginService} from "../../login/login-core/login.service";

@Injectable({providedIn: 'root'})
export class AdministradorService {
  private base_url: string = environment.baseUrl;

  constructor(private http: HttpClient, private authService: LoginService) {
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const access = this.authService.getAccess();
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  crearAdministrador(idUser: string, formData: Administrador): Observable<AdministradorResponse> {
    const headers = this.buildAuthHeaders();
    return this.http.post<AdministradorResponse>(`${this.base_url}/administrador/create/${idUser}`, formData, {headers}).pipe(tap((response) => response));
  }

  updateById(idAdmin: string, idUser: string, formData: Administrador): Observable<AdministradorResponse> {
    const headers = this.buildAuthHeaders();
    return this.http.put<AdministradorResponse>(`${this.base_url}/administrador/update/${idAdmin}/${idUser}`, formData, {headers}).pipe(tap((response) => response));
  }

  getAll(userId: string): Observable<AdministradorResponse> {
    const headers = this.buildAuthHeaders();
    return this.http.get<AdministradorResponse>(`${this.base_url}/administrador/all/${userId}`, {headers});
  }

  deleteById(id: string) {
    const headers = this.buildAuthHeaders();
    return this.http.delete<{ ok: boolean; msj: string }>(`${this.base_url}/administrador/delete/${id}`, {headers});
  }
}
