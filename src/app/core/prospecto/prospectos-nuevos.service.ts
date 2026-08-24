import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ProspectoService } from './prospecto.service';

const STORAGE_KEY = 'prospectos_vistos';
const POLL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class ProspectosNuevosService {
  private count$ = new BehaviorSubject<number>(0);
  private viewedIds = new Set<string>();
  private pollSub?: Subscription;

  constructor(private prospectoService: ProspectoService) {
    this.loadViewed();
  }

  getCount$(): BehaviorSubject<number> {
    return this.count$;
  }

  getCount(): number {
    return this.count$.value;
  }

  start(): void {
    if (this.pollSub) return;
    this.refresh().subscribe();
    this.pollSub = new Subscription();
    const timer = setInterval(() => this.refresh().subscribe(), POLL_MS);
    this.pollSub.add(() => clearInterval(timer));
  }

  stop(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  markVisto(id: string): void {
    if (!id || this.viewedIds.has(id)) return;
    this.viewedIds.add(id);
    this.saveViewed();
    this.refresh().subscribe();
  }

  refresh(): Observable<void> {
    return this.prospectoService.getAll().pipe(
      map((list) => list.filter((p) => this.esNuevo(p) && !!p.id && !this.viewedIds.has(p.id!)).length),
      tap((total) => this.count$.next(total)),
      catchError(() => {
        this.count$.next(0);
        return of(0);
      }),
      map(() => undefined)
    );
  }

  private esNuevo(p: { estado?: string }): boolean {
    return p.estado !== 'contactado';
  }

  private loadViewed(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      this.viewedIds = new Set(Array.isArray(ids) ? ids.filter(Boolean) : []);
    } catch {
      this.viewedIds = new Set();
    }
  }

  private saveViewed(): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...this.viewedIds]));
  }
}
