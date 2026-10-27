import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginService } from '../login/login-core/login.service';

export interface DriveFolder {
  id: string;
  name: string;
}

export interface DriveConfig {
  configurado: boolean;
  clientEmail: string;
  folderId: string;
  folders: DriveFolder[];
  projectId?: string;
  actualizadoEn?: string | null;
}

export interface ConfiguracionResponse {
  ok: boolean;
  drive: DriveConfig;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size: number;
  modifiedTime: string | null;
  webViewLink: string | null;
}

export type DriveEditorKind = 'sheet' | 'document' | 'presentation' | 'preview' | 'text' | 'download' | 'folder';

export interface DriveOpenResponse {
  ok: boolean;
  item: DriveItem;
  kind: DriveEditorKind;
  embedUrl: string | null;
  editUrl: string | null;
  converted?: boolean;
  openedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private baseUrl = environment.baseUrl;
  private driveHabilitadoSubject = new BehaviorSubject<boolean>(false);
  public readonly driveHabilitado$ = this.driveHabilitadoSubject.asObservable();

  constructor(private http: HttpClient, private auth: LoginService) {}

  public get driveHabilitado(): boolean {
    return this.driveHabilitadoSubject.value;
  }

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    const access = this.auth.getAccess() || 'Bearer';
    return new HttpHeaders().set('Authorization', `${access} ${token}`);
  }

  public setDriveHabilitado(value: boolean): void {
    this.driveHabilitadoSubject.next(!!value);
  }

  public refrescarDrive(): void {
    this.obtener().subscribe({
      next: (response) => this.setDriveHabilitado(!!response?.drive?.configurado),
      error: () => this.setDriveHabilitado(false)
    });
  }

  public obtener(): Observable<ConfiguracionResponse> {
    return this.http.get<ConfiguracionResponse>(`${this.baseUrl}/configuracion`, {
      headers: this.headers()
    }).pipe(tap((response) => this.setDriveHabilitado(!!response?.drive?.configurado)));
  }

  public guardarDrive(payload: { jsonCredencial: string; folderIds: string[] }): Observable<ConfiguracionResponse> {
    return this.http.put<ConfiguracionResponse>(`${this.baseUrl}/configuracion/drive`, payload, {
      headers: this.headers()
    }).pipe(tap((response) => this.setDriveHabilitado(!!response?.drive?.configurado)));
  }

  public desvincularDrive(): Observable<{ ok: boolean; msj: string }> {
    return this.http.delete<{ ok: boolean; msj: string }>(`${this.baseUrl}/configuracion/drive`, {
      headers: this.headers()
    }).pipe(tap(() => this.setDriveHabilitado(false)));
  }

  public cambiarPassword(password: string): Observable<{ ok: boolean; msj: string }> {
    return this.http.put<{ ok: boolean; msj: string }>(
      `${this.baseUrl}/configuracion/password`,
      { password },
      { headers: this.headers() }
    );
  }

  public listarRaices(): Observable<{ ok: boolean; carpetas: DriveFolder[]; clientEmail?: string }> {
    return this.http.get<{ ok: boolean; carpetas: DriveFolder[]; clientEmail?: string }>(
      `${this.baseUrl}/drive/raices`,
      { headers: this.headers() }
    );
  }

  public listarItems(folderId?: string): Observable<{ ok: boolean; items: DriveItem[] }> {
    return this.http.get<{ ok: boolean; items: DriveItem[] }>(`${this.baseUrl}/drive/items`, {
      headers: this.headers(),
      params: folderId ? { folderId } : {}
    });
  }

  public crearCarpeta(parentId: string, name: string): Observable<{ ok: boolean; item: DriveItem }> {
    return this.http.post<{ ok: boolean; item: DriveItem }>(
      `${this.baseUrl}/drive/carpetas`,
      { parentId, name },
      { headers: this.headers() }
    );
  }

  public subirArchivo(parentId: string, file: File): Observable<{ ok: boolean; item: DriveItem }> {
    const form = new FormData();
    form.append('parentId', parentId);
    form.append('file', file, file.name);
    return this.http.post<{ ok: boolean; item: DriveItem }>(`${this.baseUrl}/drive/archivos`, form, {
      headers: this.headers()
    });
  }

  public renombrar(id: string, name: string): Observable<{ ok: boolean; item: DriveItem }> {
    return this.http.patch<{ ok: boolean; item: DriveItem }>(
      `${this.baseUrl}/drive/items/${id}`,
      { name },
      { headers: this.headers() }
    );
  }

  public eliminar(id: string): Observable<{ ok: boolean; msj: string }> {
    return this.http.delete<{ ok: boolean; msj: string }>(`${this.baseUrl}/drive/items/${id}`, {
      headers: this.headers()
    });
  }

  public descargar(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/drive/items/${id}/download`, {
      headers: this.headers(),
      responseType: 'blob'
    });
  }

  public abrirArchivo(id: string): Observable<DriveOpenResponse> {
    return this.http.post<DriveOpenResponse>(`${this.baseUrl}/drive/items/${id}/abrir`, {}, {
      headers: this.headers()
    });
  }

  public cerrarArchivo(id: string, openedAt?: string | null): Observable<{ ok: boolean; edito?: boolean }> {
    return this.http.post<{ ok: boolean; edito?: boolean }>(
      `${this.baseUrl}/drive/items/${id}/cerrar`,
      { openedAt: openedAt || null },
      { headers: this.headers() }
    );
  }

  public cerrarArchivoSync(id: string, openedAt?: string | null): void {
    const token = this.auth.getToken();
    const access = this.auth.getAccess() || 'Bearer';
    void fetch(`${this.baseUrl}/drive/items/${id}/cerrar`, {
      method: 'POST',
      headers: {
        Authorization: `${access} ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ openedAt: openedAt || null }),
      keepalive: true
    });
  }

  public crearDocumento(parentId: string, name: string): Observable<{ ok: boolean; item: DriveItem }> {
    return this.http.post<{ ok: boolean; item: DriveItem }>(
      `${this.baseUrl}/drive/documentos`,
      { parentId, name },
      { headers: this.headers() }
    );
  }

  public crearPlanilla(parentId: string, name: string): Observable<{ ok: boolean; item: DriveItem }> {
    return this.http.post<{ ok: boolean; item: DriveItem }>(
      `${this.baseUrl}/drive/planillas`,
      { parentId, name },
      { headers: this.headers() }
    );
  }

  public crearPresentacion(parentId: string, name: string): Observable<{ ok: boolean; item: DriveItem }> {
    return this.http.post<{ ok: boolean; item: DriveItem }>(
      `${this.baseUrl}/drive/presentaciones`,
      { parentId, name },
      { headers: this.headers() }
    );
  }

  public guardarContenido(id: string, file: File): Observable<{ ok: boolean; item: DriveItem }> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.put<{ ok: boolean; item: DriveItem }>(`${this.baseUrl}/drive/items/${id}/contenido`, form, {
      headers: this.headers()
    });
  }
}
