import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ArchivosService } from './archivo.service';

@Injectable({ providedIn: 'root' })
export class ArchivosNuevosService {
  private totalNewCount$ = new BehaviorSubject<number>(0);
  private newByConsorcio$ = new BehaviorSubject<Record<string, number>>({});
  /** Conteo de archivos nuevos por carpeta (actualizado al cargar desde API). */
  private byCarpeta: Record<string, number> = {};

  constructor(private archivosService: ArchivosService) {}

  /**
   * Carga desde la API los conteos de archivos nuevos para los consorcios indicados.
   * Actualiza total, por consorcio y por carpeta. Retorna un Observable que emite al terminar.
   */
  loadNuevosCounts(consorcioIds: string[]): Observable<void> {
    const ids = (consorcioIds || []).filter(Boolean);
    if (ids.length === 0) {
      this.setCounts(0, {});
      this.byCarpeta = {};
      return of(undefined);
    }
    return this.archivosService.getNuevosCounts(ids).pipe(
      tap({
        next: (res) => {
          this.byCarpeta = res.byCarpeta ?? {};
          this.setCounts(res.total, res.byConsorcio ?? {});
        },
        error: () => {
          this.setCounts(0, {});
          this.byCarpeta = {};
        },
      }),
      map(() => undefined)
    );
  }

  /** Cantidad de archivos nuevos en una carpeta (según última respuesta de la API). */
  getNewForFolder(carpetaId: string, _currentTotal?: number): number {
    return this.byCarpeta[carpetaId] ?? 0;
  }

  /**
   * Marca la carpeta como vista en el servidor y actualiza el estado local
   * (resta el conteo de esa carpeta del total y del consorcio).
   */
  markFolderSeen(carpetaId: string, currentCount: number, consorcioId: string): void {
    const previousNew = this.byCarpeta[carpetaId] ?? 0;
    this.archivosService.markCarpetaVista(carpetaId, currentCount, consorcioId).subscribe({
      next: () => {
        this.byCarpeta[carpetaId] = 0;
        const byConsorcio = { ...this.newByConsorcio$.value };
        const prevConsorcio = byConsorcio[consorcioId] ?? 0;
        byConsorcio[consorcioId] = Math.max(0, prevConsorcio - previousNew);
        this.newByConsorcio$.next(byConsorcio);
        const newTotal = Math.max(0, this.totalNewCount$.value - previousNew);
        this.totalNewCount$.next(newTotal);
      },
      error: () => {},
    });
  }

  /** Actualiza total y por consorcio (usado internamente tras cargar desde API). */
  setCounts(total: number, byConsorcio: Record<string, number>): void {
    this.totalNewCount$.next(total);
    this.newByConsorcio$.next(byConsorcio ?? {});
  }

  getTotalNew(): number {
    return this.totalNewCount$.value;
  }

  getTotalNew$(): BehaviorSubject<number> {
    return this.totalNewCount$;
  }

  getNewForConsorcio(consorcioId: string): number {
    return this.newByConsorcio$.value[consorcioId] ?? 0;
  }

  getNewByConsorcio$(): BehaviorSubject<Record<string, number>> {
    return this.newByConsorcio$;
  }
}
