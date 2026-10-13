import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginService } from '../login/login-core/login.service';
import {
  ReportesFiltro,
  ReportesResponse,
  ReportesResumen,
  ReportesResumenResponse,
  ReporteRegistro
} from './reportes.interface';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient, private authService: LoginService) {}

  private headers(): HttpHeaders {
    const token = this.authService.getToken();
    const access = this.authService.getAccess();
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  private buildParams(filtro: ReportesFiltro): HttpParams {
    let params = new HttpParams().set('tipo', filtro.tipo).set('limit', '200');
    if (filtro.documento) params = params.set('documento', String(filtro.documento));
    if (filtro.dia) params = params.set('dia', String(filtro.dia));
    if (filtro.mes) params = params.set('mes', String(filtro.mes));
    if (filtro.anio) params = params.set('anio', String(filtro.anio));
    return params;
  }

  public obtenerReportes(filtro: ReportesFiltro): Observable<ReporteRegistro[]> {
    return this.http
      .get<ReportesResponse>(`${this.baseUrl}/personal/reportes`, {
        headers: this.headers(),
        params: this.buildParams(filtro)
      })
      .pipe(map((response) => response?.registros || []));
  }

  public obtenerResumen(filtro: ReportesFiltro): Observable<ReportesResumen> {
    return this.http
      .get<ReportesResumenResponse>(`${this.baseUrl}/personal/reportes/resumen`, {
        headers: this.headers(),
        params: this.buildParams(filtro)
      })
      .pipe(
        map(
          (response) =>
            response?.resumen || {
              registrosDelDia: 0,
              primerIngreso: null,
              ultimoMovimiento: null,
              diasConActividad: 0,
              diasDelMes: 0,
              timeline: []
            }
        )
      );
  }
}
