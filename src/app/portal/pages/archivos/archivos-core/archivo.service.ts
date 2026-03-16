import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {environment} from 'src/environments/environment';
import {ApiResponse, Archivo, Carpeta} from "./archivo.models";
import {LoginService} from "../../login/login-core/login.service";

@Injectable({providedIn: 'root'})
export class ArchivosService {
  private base_url: string = environment.baseUrl;

  constructor(private http: HttpClient, private authService: LoginService) {
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const access = this.authService.getAccess();
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  getCarpetas(consorcioId: string): Observable<Carpeta[]> {
    const headers = this.buildAuthHeaders();
    return this.http.get<ApiResponse<Carpeta[]>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas`, {headers}).pipe(map(r => r['agg'] as Carpeta[]));
  }

 crearCarpeta(consorcioId: string, titulo: string, mensaje?: string): Observable<Carpeta> {
  const headers = this.buildAuthHeaders();
  const payload: any = { titulo, mensaje };
  if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    payload.mensaje = mensaje.trim();
  }
  return this.http.post<ApiResponse<Carpeta>>(
    `${this.base_url}/archivos/consorcios/${consorcioId}/carpetas`,
    payload,
    { headers }
  ).pipe(map(r => r['carpeta'] as Carpeta));
}

  eliminarCarpeta(consorcioId: string, carpetaId: string): Observable<void> {
    const headers = this.buildAuthHeaders();
    return this.http.delete<ApiResponse<unknown>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas/${carpetaId}`, {headers}).pipe(map(() => void 0));
  }

// archivos.service.ts
actualizarCarpeta(consorcioId: string, carpetaId: string, titulo: string, mensaje?: string) {
  const headers = this.buildAuthHeaders();

  const body: any = { titulo: titulo?.trim() };
  if (typeof mensaje === 'string') {
    const m = mensaje.trim();
    if (m) body.mensaje = m;
    else body.mensaje = ''; // si querés borrar mensaje, podés mandar '' y que el backend lo interprete como null
  }

  return this.http
    .put<ApiResponse<Carpeta>>(
      `${this.base_url}/archivos/consorcios/${consorcioId}/carpetas/${carpetaId}`,
      body,
      { headers }
    )
    .pipe(map(r => r['carpeta'] as Carpeta));
}


  getArchivos(carpetaId: string): Observable<Archivo[]> {
    const headers = this.buildAuthHeaders();
    return this.http.get<ApiResponse<Archivo[]>>(`${this.base_url}/archivos/carpetas/${carpetaId}/archivos`, {headers}).pipe(map(r => r['archivos'] as Archivo[]));
  }

  subirArchivos(consorcioId: string, carpetaId: string, files: File[]): Observable<Archivo[]> {
    const headers = this.buildAuthHeaders();
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return this.http.post<ApiResponse<Archivo[]>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas/${carpetaId}/archivos`, form, {headers}).pipe(map(r => (r['archivos'] ?? r['docs']) as Archivo[]));
  }

  eliminarArchivo(archivoId: string): Observable<void> {
    const headers = this.buildAuthHeaders();
    return this.http.delete<ApiResponse<unknown>>(`${this.base_url}/archivos/archivos/${archivoId}`, {headers}).pipe(map(() => void 0));
  }

  downloadArchivo(id: string) {
    const headers = this.buildAuthHeaders();
    const url = `${this.base_url}/archivos/archivos/${id}/download`;
    return this.http.get(url, {headers, responseType: 'blob', observe: 'response'});
  }

  /**
   * Obtiene desde la API los conteos de archivos nuevos (por carpeta/consorcio/total) para el usuario.
   */
  getNuevosCounts(consorcioIds: string[]): Observable<{
    total: number;
    byConsorcio: Record<string, number>;
    byCarpeta: Record<string, number>;
  }> {
    const headers = this.buildAuthHeaders();
    const ids = consorcioIds.filter(Boolean).join(',');
    const url = `${this.base_url}/archivos/nuevos${ids ? `?consorcioIds=${encodeURIComponent(ids)}` : ''}`;
    return this.http.get<{ ok: boolean; total?: number; byConsorcio?: Record<string, number>; byCarpeta?: Record<string, number> }>(url, {headers}).pipe(
      map((r) => ({
        total: r.total ?? 0,
        byConsorcio: r.byConsorcio ?? {},
        byCarpeta: r.byCarpeta ?? {},
      }))
    );
  }

  /**
   * Marca una carpeta como vista en el servidor (para que deje de contar como "archivos nuevos").
   */
  markCarpetaVista(carpetaId: string, count: number, consorcioId: string): Observable<{ ok: boolean }> {
    const headers = this.buildAuthHeaders();
    const url = `${this.base_url}/archivos/carpetas/${carpetaId}/visto`;
    return this.http.post<{ ok: boolean }>(url, {count, consorcioId}, {headers});
  }
}
