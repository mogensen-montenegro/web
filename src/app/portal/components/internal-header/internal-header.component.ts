import {CommonModule} from '@angular/common';
import {Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {LoginService} from '../../pages/login/login-core/login.service';

@Component({
  standalone: true,
  selector: 'app-internal-header',
  templateUrl: './internal-header.component.html',
  styleUrls: ['./internal-header.component.scss'],
  imports: [CommonModule, RouterModule]
})
export class InternalHeaderComponent implements OnInit, OnDestroy {
  @ViewChild('menuBtn') menuBtn: ElementRef | undefined;
  @ViewChild('menuDesplegado') menuDesplegado: ElementRef | undefined;
  public abiertoMenu = true;
  public sessionUser = '';
  public configAbierto = false;
  public configSaliendo = false;
  private configTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private router: Router,
    private render2: Renderer2,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.sessionUser = this.loginService.getSessionUser() || '';
  }

  public goHome(): void {
    this.router.navigateByUrl('/home').then();
  }

  public logout(): void {
    this.cerrarConfig();
    this.loginService.logout();
  }

  public irACuenta(): void {
    if (this.configTimer) {
      clearTimeout(this.configTimer);
      this.configTimer = null;
    }
    this.configAbierto = false;
    this.configSaliendo = false;
    void this.router.navigateByUrl('/panel/configuracion');
  }

  public toggleConfig(event?: Event): void {
    event?.stopPropagation();
    if (this.configAbierto) {
      this.cerrarConfig();
      return;
    }
    if (this.configTimer) {
      clearTimeout(this.configTimer);
      this.configTimer = null;
    }
    this.configSaliendo = false;
    this.configAbierto = true;
  }

  public cerrarConfig(): void {
    if (!this.configAbierto || this.configSaliendo) return;
    this.configSaliendo = true;
    this.configTimer = setTimeout(() => {
      this.configAbierto = false;
      this.configSaliendo = false;
      this.configTimer = null;
    }, 180);
  }

  @HostListener('document:click')
  public onDocumentClick(): void {
    this.cerrarConfig();
  }

  public abrirMenu(): void {
    if (this.abiertoMenu) {
      this.abiertoMenu = false;
      this.render2.addClass(this.menuBtn!.nativeElement, 'open');
      this.render2.addClass(this.menuDesplegado!.nativeElement, 'open');
      this.render2.removeClass(this.menuDesplegado!.nativeElement, 'close');
      return;
    }
    this.render2.removeClass(this.menuBtn!.nativeElement, 'open');
    this.render2.removeClass(this.menuDesplegado!.nativeElement, 'open');
    this.render2.addClass(this.menuDesplegado!.nativeElement, 'close');
    setTimeout(() => {
      this.abiertoMenu = true;
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.configTimer) clearTimeout(this.configTimer);
  }
}
