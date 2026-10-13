import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { LoginService } from './login.service';
import Swal from 'sweetalert2';

const STORAGE_KEY = 'lastActivityAt';
const TIMEOUT_MS = 10 * 60 * 1000;
const RESET_THROTTLE_MS = 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'click',
  'keydown',
  'mousemove',
  'scroll',
  'touchstart',
  'wheel'
];

@Injectable({ providedIn: 'root' })
export class InactividadService implements OnDestroy {
  private started = false;
  private expiring = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastReset = 0;
  private readonly onActivity = () => this.reset();
  private readonly onVisibility = () => {
    if (document.visibilityState === 'visible') this.enforce();
  };

  constructor(private loginService: LoginService, private ngZone: NgZone) {}

  public start(): void {
    if (this.started || this.loginService.getRole() !== 'personal') return;
    this.started = true;
    this.expiring = false;
    if (this.isExpired()) {
      this.expire();
      return;
    }
    if (!localStorage.getItem(STORAGE_KEY)) this.touch();
    this.bind();
    this.schedule();
  }

  public stop(): void {
    this.unbind();
    this.clearTimer();
    this.started = false;
    localStorage.removeItem(STORAGE_KEY);
  }

  public shouldExpire(): boolean {
    return this.loginService.getRole() === 'personal' && this.isExpired();
  }

  public enforce(): boolean {
    if (!this.shouldExpire()) {
      if (this.started) this.schedule();
      return false;
    }
    this.expire();
    return true;
  }

  public expire(): void {
    if (this.expiring) return;
    this.expiring = true;
    this.stop();
    this.ngZone.run(() => {
      void Swal.fire({
        icon: 'info',
        title: 'Sesión cerrada',
        text: 'Tu sesión se cerró por inactividad.',
        timer: 2800,
        showConfirmButton: false
      });
      this.loginService.logout('Salida por inactividad');
    });
  }

  private reset(): void {
    if (!this.started || this.expiring) return;
    const now = Date.now();
    if (now - this.lastReset < RESET_THROTTLE_MS) return;
    this.lastReset = now;
    this.touch();
    this.schedule();
  }

  private touch(): void {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  private isExpired(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last >= TIMEOUT_MS;
  }

  private remainingMs(): number {
    const raw = Number(localStorage.getItem(STORAGE_KEY) || Date.now());
    return Math.max(0, TIMEOUT_MS - (Date.now() - raw));
  }

  private schedule(): void {
    this.clearTimer();
    this.ngZone.runOutsideAngular(() => {
      this.timer = setTimeout(() => this.enforce(), this.remainingMs());
    });
  }

  private bind(): void {
    this.ngZone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, this.onActivity, { passive: true, capture: true });
      });
      document.addEventListener('visibilitychange', this.onVisibility);
    });
  }

  private unbind(): void {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, this.onActivity, true);
    });
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.unbind();
    this.clearTimer();
  }
}
