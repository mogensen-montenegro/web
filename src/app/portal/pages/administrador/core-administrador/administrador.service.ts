import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';
import {Observable, tap} from "rxjs";
import {Administrador, AdministradorResponse} from "./administrador.interface";

@Injectable({providedIn: 'root'})
export class AdministradorService {
  private base_url: string = environment.baseUrl;

  constructor(private http: HttpClient) {
  }

  crearAdministrador(idUser: number, formData: Administrador): Observable<AdministradorResponse> {
    return this.http.post<AdministradorResponse>(`${this.base_url}/administrador/crear/${idUser}`, formData)
      .pipe(
        tap((response: AdministradorResponse) => {
          return response;
        })
      );
  }

  getAll(userId: string): Observable<AdministradorResponse> {
    return this.http.get<AdministradorResponse>(`${this.base_url}/administrador/all/${userId}`);
  }

  deleteById(id: string) {
    return this.http.delete<{ ok: boolean; msj: string }>(`${this.base_url}/administrador/${id}`);
  }
}
