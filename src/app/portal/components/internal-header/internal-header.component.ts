import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  standalone: true,
  selector: 'app-internal-header',
  templateUrl: './internal-header.component.html',
  styleUrls: ['./internal-header.component.scss'],
  imports: [CommonModule, RouterModule],
})
export class InternalHeaderComponent implements OnInit{
  @ViewChild('menuBtn') menuBtn: ElementRef | undefined;
  @ViewChild('menuDesplegado') menuDesplegado: ElementRef | undefined;

  public idMensaje: string = '';
  public abiertoMenu: boolean = true;
  public showButton: boolean = true;

  private _color: string = '';

  constructor(
    private router: Router, private render2: Renderer2, private loginService:LoginService) {
  }

  public ngOnInit(): void {
  }

  public goHome(): void {
    this.router.navigateByUrl('/home')
  }

  public logout() {
    this.loginService.logout();
  }

  public abrirMenu(): void {
    if (this.abiertoMenu == true) {
      this.abiertoMenu = false;
      this.render2.addClass(this.menuBtn!.nativeElement, 'open');
      this.render2.addClass(this.menuDesplegado!.nativeElement, 'open');
      this.render2.removeClass(this.menuDesplegado!.nativeElement, 'close');
      return;
    }
    if (this.abiertoMenu == false) {
      this.render2.removeClass(this.menuBtn!.nativeElement, 'open');
      this.render2.removeClass(this.menuDesplegado!.nativeElement, 'open');
      this.render2.addClass(this.menuDesplegado!.nativeElement, 'close');
      setTimeout(() => {
        this.abiertoMenu = true;
      }, 500)
      return
    }
  }
}
