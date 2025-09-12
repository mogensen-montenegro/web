import {CommonModule} from '@angular/common';
import {Component, ElementRef, OnInit, Renderer2, ViewChild,} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {LoginService} from '../../pages/login/login-core/login.service';
import Swal from "sweetalert2";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../../../../environments/environment";

@Component({
  standalone: true,
  selector: 'app-internal-header',
  templateUrl: './internal-header.component.html',
  styleUrls: ['./internal-header.component.scss'],
  imports: [CommonModule, RouterModule]
})
export class InternalHeaderComponent implements OnInit {
  @ViewChild('menuBtn') menuBtn: ElementRef | undefined;
  @ViewChild('menuDesplegado') menuDesplegado: ElementRef | undefined;
  public abiertoMenu: boolean = true;
  public isSuper = false;
  private base_url: string = environment.baseUrl;

  constructor(private router: Router, private render2: Renderer2, private loginService: LoginService, private http: HttpClient) {
  }

  public updatePassword(): void {
    let userId = this.loginService.getUserId();
    Swal.fire({
      title: 'Cambiar Contraseña',
      html: `
        <b style="display:block;text-align:left;font-size:18px;margin:5px 0 2px;">Actualizar la contraseña</b>
        <div style="padding-top: 20px"><input id="swal-pass1" type="password" class="swal2-input" placeholder="Nueva Contraseña" style="width:100%; margin: 0;"></div>
        <div style="padding-top: 20px"><input id="swal-pass2" type="password" class="swal2-input" placeholder="Confirmar Contraseña" style="width:100%; margin: 0;"></div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const pass1 = (document.getElementById('swal-pass1') as HTMLInputElement).value;
        const pass2 = (document.getElementById('swal-pass2') as HTMLInputElement).value;

        if (!pass1 || !pass2) {
          Swal.showValidationMessage('Ambos campos son obligatorios');
          return false;
        }

        if (pass1 !== pass2) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return false;
        }

        return pass1;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nuevaPass = result.value;
        const headers = new HttpHeaders()
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Bearer ' + localStorage.getItem('token'));

        this.http.put(`${this.base_url}/usuario/update/password/${userId}`, {password: nuevaPass}, {headers}).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Contraseña actualizada correctamente',
              timer: 2500,
              timerProgressBar: true,
              showConfirmButton: false
            }).then();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar la contraseña'
            }).then();
          }
        });
      }
    });
  }

  public ngOnInit(): void {
    this.isSuper = this.loginService.hasRole(['superuser']);
  }

  public goHome(): void {
    this.router.navigateByUrl('/home').then();
  }

  public logout() {
    this.loginService.logout();
  }

  public abrirMenu(): void {
    if (this.abiertoMenu) {
      this.abiertoMenu = false;
      this.render2.addClass(this.menuBtn!.nativeElement, 'open');
      this.render2.addClass(this.menuDesplegado!.nativeElement, 'open');
      this.render2.removeClass(this.menuDesplegado!.nativeElement, 'close');
      return;
    }
    if (!this.abiertoMenu) {
      this.render2.removeClass(this.menuBtn!.nativeElement, 'open');
      this.render2.removeClass(this.menuDesplegado!.nativeElement, 'open');
      this.render2.addClass(this.menuDesplegado!.nativeElement, 'close');
      setTimeout(() => {
        this.abiertoMenu = true;
      }, 500)
      return;
    }
  }
}
