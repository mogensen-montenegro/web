import {Component, HostBinding, OnDestroy} from '@angular/core';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {LoginService} from "./login-core/login.service";
import Swal from "sweetalert2";
import {LoginDataRequest} from "./login-core/auth.interface";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  public items = Array(10).fill(0);
  private _themeColor: string = '';
  private destroy$: Subject<void> = new Subject();

  constructor(private fb: FormBuilder, private loginService: LoginService, private router: Router) {
    sessionStorage.removeItem('token');
  }

  @HostBinding('style.--themeColor')
  private set themeColor(value: string) {
    if (value) this._themeColor = value;
  }

  public get themeColor(): string {
    return this._themeColor;
  }

  public loginForm = this.fb.group({
    nombre: [localStorage.getItem('nombre'), [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required]],
    role: ['']
  });

  public recordarUsuario(remember: boolean): void {
    if (remember) {
      localStorage.setItem('nombre', this.loginForm.value.nombre || '');
    } else {
      localStorage.removeItem('nombre');
    }
  }

  public login(): void {
    localStorage.clear();
    sessionStorage.removeItem("token");
    this.limpiarEspaciosForm();
    const {nombre, password} = this.loginForm.getRawValue();
    const loginDataRequest: LoginDataRequest = {
      user: nombre,
      password: password,
    };
    this.loginService.login(loginDataRequest).subscribe({
      next: () => {
        this.router.navigate(['/panel']).then();
      },
      error: (err) => {
        Swal.fire('Error', err.error.msj, 'error').then();
      },
      complete: () => {
      }
    });
  }

  private limpiarEspaciosForm(): void {
    const nombre = this.loginForm.value.nombre!.trim();
    const password = this.loginForm.value.password!.trim();
    this.loginForm.patchValue({
      nombre,
      password
    })
  }

  private get roleControl(): AbstractControl {
    return this.loginForm.controls['role'];
  }

  public get isValid(): boolean {
    return this.loginForm.valid;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
