import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';
import {Observable, tap} from 'rxjs';
import {Administrador, AdministradorResponse} from "./administrador.interface";

@Injectable({providedIn: 'root'})
export class AdministradorService {
  private base_url: string = environment.baseUrl;

  constructor(private http: HttpClient) {
  }

  crearAdministrador(idUser: string, formData: Administrador): Observable<AdministradorResponse> {
    return this.http.post<AdministradorResponse>(`${this.base_url}/administrador/create/${idUser}`, formData).pipe(tap((response) => response));
  }

  updateById(idAdmin: string, idUser: string, formData: Administrador): Observable<AdministradorResponse> {
    return this.http.put<AdministradorResponse>(`${this.base_url}/administrador/update/${idUser}/${idAdmin}`, formData).pipe(tap((response) => response));
  }

  getAll(userId: string): Observable<AdministradorResponse> {
    return this.http.get<AdministradorResponse>(`${this.base_url}/administrador/all/${userId}`);
  }

  deleteById(id: string) {
    return this.http.delete<{ ok: boolean; msj: string }>(`${this.base_url}/administrador/delete/${id}`);
  }
}
