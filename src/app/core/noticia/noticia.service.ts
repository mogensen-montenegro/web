import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Noticia } from './noticia.interface';

const MODAL_CERRADO_KEY = 'mogensen_noticia_modal_cerrado';
/** Por noticia: si ya la vio el usuario (al cerrar el modal), se guarda acá para no mostrarla de nuevo. */
const SHOWN_PREFIX = 'mogensen_noticia_shown_';
const AUTH_TOKEN_KEY = 'token';
const AUTH_ACCESS_KEY = 'accessToken';

interface ApiResponse<T> {
  ok: boolean;
  body?: T;
  msj?: string;
}

@Injectable({ providedIn: 'root' })
export class NoticiaService {
  private baseUrl = environment.baseUrl;
  private abrirModalSubject = new Subject<Noticia>();

  constructor(private http: HttpClient) {}

  private get authHeaders(): HttpHeaders {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const access = localStorage.getItem(AUTH_ACCESS_KEY);
    return new HttpHeaders().set('Authorization', `${access || 'Bearer'} ${token || ''}`);
  }

  abrirModalConNoticia(noticia: Noticia): void {
    this.abrirModalSubject.next(noticia);
  }

  getAbrirModal$(): Observable<Noticia> {
    return this.abrirModalSubject.asObservable();
  }

  getAll(): Observable<Noticia[]> {
    return this.http
      .get<ApiResponse<Noticia[]>>(`${this.baseUrl}/noticia/all`, { headers: this.authHeaders })
      .pipe(
        map((res) => (res?.ok && res?.body ? res.body : [])),
        catchError(() => of([]))
      );
  }

  getActive(): Observable<Noticia[]> {
    return this.http
      .get<ApiResponse<Noticia[]>>(`${this.baseUrl}/noticia/active`)
      .pipe(
        map((res) => (res?.ok && res?.body ? res.body : [])),
        catchError(() => of([]))
      );
  }

  add(noticia: Omit<Noticia, 'id' | 'createdAt'>): Observable<Noticia> {
    const body = {
      titulo: noticia.titulo,
      texto: noticia.texto ?? '',
      imagenesBase64: noticia.imagenesBase64?.length ? noticia.imagenesBase64 : [],
      activa: noticia.activa !== false
    };
    return this.http
      .post<ApiResponse<Noticia>>(`${this.baseUrl}/noticia/create`, body, { headers: this.authHeaders })
      .pipe(
        map((res) => {
          if (!res?.ok || !res?.body) throw new Error(res?.msj || 'Error al crear');
          return res.body;
        })
      );
  }

  update(id: string, data: Partial<Omit<Noticia, 'id' | 'createdAt'>>): Observable<Noticia> {
    return this.http
      .put<ApiResponse<Noticia>>(`${this.baseUrl}/noticia/update/${id}`, data, { headers: this.authHeaders })
      .pipe(
        map((res) => {
          if (!res?.ok || !res?.body) throw new Error(res?.msj || 'Error al actualizar');
          return res.body;
        })
      );
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/noticia/delete/${id}`, { headers: this.authHeaders })
      .pipe(
        map((res) => {
          if (!res?.ok) throw new Error(res?.msj || 'Error al eliminar');
          return undefined;
        })
      );
  }

  isModalCerrado(): boolean {
    return localStorage.getItem(MODAL_CERRADO_KEY) === '1';
  }

  marcarModalCerrado(): void {
    localStorage.setItem(MODAL_CERRADO_KEY, '1');
  }

  /** Indica si el usuario ya vio esta noticia (cerró el modal). Solo localStorage. */
  wasShownToUser(noticiaId: string): boolean {
    return localStorage.getItem(SHOWN_PREFIX + noticiaId) === '1';
  }

  /** Marca que el usuario ya vio esta noticia (para no mostrarla de nuevo en el popup). */
  markAsShownToUser(noticiaId: string): void {
    localStorage.setItem(SHOWN_PREFIX + noticiaId, '1');
  }

  /** Primera noticia activa que el usuario aún no vio (trae de API y filtra por localStorage). */
  getFirstActiveForModal(): Observable<Noticia | null> {
    return this.getActive().pipe(
      map((list) => list.find((n) => !this.wasShownToUser(n.id)) ?? null)
    );
  }
}
