import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {environment} from 'src/environments/environment';
import {ApiResponse, Archivo, Carpeta} from "./archivo.models";

@Injectable({providedIn: 'root'})
export class ArchivosService {
  private base_url: string = environment.baseUrl;

  constructor(private http: HttpClient) {
  }

  getCarpetas(consorcioId: string): Observable<Carpeta[]> {
    return this.http.get<ApiResponse<Carpeta[]>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas`).pipe(map(r => r['agg'] as Carpeta[]));
  }

  crearCarpeta(consorcioId: string, titulo: string): Observable<Carpeta> {
    return this.http.post<ApiResponse<Carpeta>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas`, {titulo}).pipe(map(r => r['carpeta'] as Carpeta));
  }

  eliminarCarpeta(consorcioId: string, carpetaId: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas/${carpetaId}`).pipe(map(() => void 0));
  }

  actualizarCarpeta(consorcioId: string, carpetaId: string, titulo: string): Observable<Carpeta> {
    return this.http.put<ApiResponse<Carpeta>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas/${carpetaId}`, {titulo}).pipe(map(r => (r['carpeta'] ?? r['data']) as Carpeta));
  }

  getArchivos(carpetaId: string): Observable<Archivo[]> {
    return this.http.get<ApiResponse<Archivo[]>>(`${this.base_url}/archivos/carpetas/${carpetaId}/archivos`).pipe(map(r => r['archivos'] as Archivo[]));
  }

  subirArchivos(consorcioId: string, carpetaId: string, files: File[]): Observable<Archivo[]> {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return this.http.post<ApiResponse<Archivo[]>>(`${this.base_url}/archivos/consorcios/${consorcioId}/carpetas/${carpetaId}/archivos`, form).pipe(map(r => r['docs'] as Archivo[]));
  }

  eliminarArchivo(archivoId: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base_url}/archivos/archivos/${archivoId}`).pipe(map(() => void 0));
  }

  actualizarArchivo(archivoId: string, payload: Partial<Pick<Archivo, 'nombreOriginal'>>): Observable<Archivo> {
    return this.http.put<ApiResponse<Archivo>>(`${this.base_url}/archivos/archivos/${archivoId}`, payload).pipe(map(r => (r['archivo'] ?? r['data']) as Archivo));
  }

  archivoUrl(path: string): string {
    const base = (environment.filesBaseUrl ?? 'http://localhost:3000').replace(/\/$/, '');
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${base}${clean}`;
  }
}
