import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {

  @HostBinding('style.--themeColor')
  private set themeColor(value: string) {
    if (value) this._themeColor = value;
  }
  public get themeColor(): string {
    return this._themeColor;
  }

  public formSubmite = false;
  public loginForm = this.fb.group({
    nombre: [localStorage.getItem('nombre'), [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required]],
    role: ['']
  });

  private _themeColor: string = '';
  private destroy$: Subject<void> = new Subject();

  constructor(
    private fb: FormBuilder,
    //private loginService: LoginService,
   // private spinnerService: SpinnerService,
    private router: Router,
   ) {
    sessionStorage.removeItem('token');
  }


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
    //this.spinnerService.setSpinnerState(true);
    this.limpiarEspaciosForm();
    // this.loginService.login(this.loginForm.value)
    //   .subscribe({
    //     next: () => {
    //       localStorage.setItem('nombreGym', this.loginForm.value.nombre)
    //       this.loginService.validarToken(this.idioma).pipe(takeUntil(this.destroy$)).subscribe();
    //     },
    //     error: (err) => {
    //       Swal.fire('Error', err.error.msj, 'error');
    //       this.spinnerService.setSpinnerState(false);
    //     },
    //     complete: () => { this.spinnerService.setSpinnerState(false) }
    //   });
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
