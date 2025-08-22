import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';
import {Observable, tap} from 'rxjs';
import {Consorcio, ConsorcioResponse} from "./consorcio.interface";

@Injectable({providedIn: 'root'})
export class ConsorcioService {
  private base_url: string = environment.baseUrl;

  constructor(private http: HttpClient) {
  }

  crearConsorcio(idUser: string, formData: Consorcio): Observable<ConsorcioResponse> {
    return this.http.post<ConsorcioResponse>(`${this.base_url}/consorcio/create/${idUser}`, formData).pipe(tap((response) => response));
  }

  updateById(idAdmin: string, idUser: string, formData: Consorcio): Observable<ConsorcioResponse> {
    return this.http.put<ConsorcioResponse>(`${this.base_url}/consorcio/update/${idAdmin}/${idUser}`, formData).pipe(tap((response) => response));
  }

  getAllById(idAdmin: string): Observable<ConsorcioResponse> {
    return this.http.get<ConsorcioResponse>(`${this.base_url}/consorcio/all/${idAdmin}`);
  }

  deleteById(id: string) {
    return this.http.delete<{ ok: boolean; msj: string }>(`${this.base_url}/consorcio/delete/${id}`);
  }
}
