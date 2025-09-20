import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {Subject} from 'rxjs';
import {Administrador, SubmitEvent} from '../core-administrador/administrador.interface';

@Component({
  selector: 'app-add-administrador',
  templateUrl: './add-administrador.component.html',
  styleUrls: ['./add-administrador.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class AddAdministradorComponent implements OnDestroy, OnChanges {
  @Output() clicked = new EventEmitter<void>();
  @Output() submit = new EventEmitter<SubmitEvent>();
  @Input() editUser = false;
  @Input() initialData?: Administrador | null;

  private destroy$ = new Subject<void>();
  public isLoading = false;
  public administradorForm!: FormGroup;
  public arrayDia: Array<number> = [];
  public arrayMes: Array<number> = [];
  public arrayAnio: Array<number> = [];

  constructor(private fb: FormBuilder) {
    this.createForm();
    this.applyModeValidators();
    this.inicializacionDias();
  }

  private inicializacionDias(): void {
    const currentYear = new Date().getFullYear();
    this.arrayDia = Array.from({length: 31}, (_, i) => i + 1);
    this.arrayMes = Array.from({length: 12}, (_, i) => i + 1);
    this.arrayAnio = Array.from({length: currentYear - 1950 + 1}, (_, i) => currentYear - i);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editUser']) {
      this.applyModeValidators();
    }
    if (changes['initialData']) {
      this.patchFormWithInitialData();
    }
  }

  private createForm(): void {
    this.administradorForm = this.fb.group({
        nombre: ['', [Validators.required]],
        email: ['', [Validators.email]],
        telefono: [''],
        direccion: [''],
        cantConsorcios: [0],
        user: ['', [Validators.required]],
        password: [''],
        passwordConfirm: [''],
        cuit: [''],
        dia: [''],
        mes: [''],
        anio: [''],
        observacion: [''],
      },
      {
        validators: this.passwordsMatchValidator
      }
    );
  }

  private passwordsMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get('password')?.value ?? '';
    const confirm = group.get('passwordConfirm')?.value ?? '';
    if (this.editUser && !pass && !confirm) return null;
    return pass === confirm ? null : {passwordMismatch: true};
  };

  private applyModeValidators(): void {
    const passwordCtrl = this.administradorForm.get('password');
    const passwordConfirmCtrl = this.administradorForm.get('passwordConfirm');

    if (!passwordCtrl || !passwordConfirmCtrl) return;

    if (this.editUser) {
      passwordCtrl.setValidators([Validators.minLength(6)]);
      passwordConfirmCtrl.clearValidators();
      this.administradorForm.setValidators(this.passwordsMatchValidator);
    } else {
      passwordCtrl.setValidators([Validators.required, Validators.minLength(6)]);
      passwordConfirmCtrl.setValidators([Validators.required]);
      this.administradorForm.setValidators(this.passwordsMatchValidator);
    }

    passwordCtrl.updateValueAndValidity({emitEvent: false});
    passwordConfirmCtrl.updateValueAndValidity({emitEvent: false});
    this.administradorForm.updateValueAndValidity({emitEvent: false});
  }

  private patchFormWithInitialData(): void {
    if (!this.initialData) {
      this.administradorForm.reset({
        nombre: '', email: '', telefono: '', direccion: '',
        cantConsorcios: 0, user: '', password: '', passwordConfirm: '',
        cuit: '', dia: '', mes: '', anio: '', observacion: ''
      });
      return;
    }
    const {dia, mes, anio} = this.parseFechaToParts(this.initialData.fechaNacimiento);
    this.administradorForm.patchValue({
      nombre: this.initialData.nombre ?? '',
      email: this.initialData.email ?? '',
      telefono: this.initialData.telefono ?? '',
      direccion: this.initialData.direccion ?? '',
      cantConsorcios: this.initialData.consorciosCount ?? 0,
      user: this.initialData.user ?? '',
      password: '',
      passwordConfirm: '',
      cuit: this.initialData.cuit ?? '',
      dia, mes, anio,
      observacion: this.initialData.observacion ?? ''
    });
  }

  public agregarAdministrador(): void {
    if (this.administradorForm.invalid) {
      this.administradorForm.markAllAsTouched();
      return;
    }

    const v = this.administradorForm.getRawValue();
    const fechaDDMM = this.buildFechaNacimiento();

    const payload: Administrador = {
      nombre: v.nombre,
      email: v.email,
      telefono: v.telefono,
      direccion: v.direccion,
      cuit: v.cuit ?? '',
      fechaNacimiento: fechaDDMM || '',
      observacion: v.observacion ?? '',
      consorciosCount: Number(v.cantConsorcios) || 0,
      user: v.user,
      password: v.password
    };

    this.submit.emit({mode: 'create', payload});
  }

  public modificarAdministrador(): void {
    if (this.administradorForm.invalid) {
      this.administradorForm.markAllAsTouched();
      return;
    }

    const v = this.administradorForm.getRawValue();
    const fechaDDMM = this.buildFechaNacimiento();

    const payload: Administrador = {
      nombre: v.nombre,
      email: v.email,
      telefono: v.telefono,
      direccion: v.direccion,
      cuit: v.cuit ?? '',
      fechaNacimiento: fechaDDMM,
      observacion: v.observacion ?? '',
      consorciosCount: Number(v.cantConsorcios) || 0,
      user: v.user,
      password: v.password ? v.password : (this.initialData?.password ?? '')
    };

    this.submit.emit({mode: 'edit', payload, id: this.initialData?._id});
  }

  public closeModal(): void {
    this.administradorForm.reset();
    this.administradorForm.updateValueAndValidity();
    this.clicked.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
    this.administradorForm.reset();
  }

  get f() {
    return this.administradorForm.controls;
  }

  get showPwdMismatch(): boolean {
    const confirm = this.f['passwordConfirm'];
    return (
      confirm.value && (confirm.dirty || confirm.touched) && this.hasPasswordMismatch
    );
  }

  get hasPasswordMismatch(): boolean {
    return this.administradorForm.hasError('passwordMismatch');
  }

  private buildFechaNacimiento(): string {
    const d = Number(this.administradorForm.get('dia')?.value);
    const m = Number(this.administradorForm.get('mes')?.value);
    const a = Number(this.administradorForm.get('anio')?.value);
    if (!d || !m || !a) return '';
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${dd}-${mm}-${a}`;
  }

  private parseFechaToParts(value?: string | Date | null): { dia: number | '', mes: number | '', anio: number | '' } {
    if (!value) return {dia: '', mes: '', anio: ''};
    if (value instanceof Date) return {dia: value.getDate(), mes: value.getMonth() + 1, anio: value.getFullYear()};

    const s = String(value).trim();
    const sep = s.includes('-') ? '-' : (s.includes('/') ? '/' : null);
    if (!sep) return {dia: '', mes: '', anio: ''};
    const p = s.split(sep);
    if (p.length !== 3) return {dia: '', mes: '', anio: ''};

    let d = 0, m = 0, a = 0;
    if (p[0].length === 4) {
      a = +p[0];
      m = +p[1];
      d = +p[2];
    } else {
      d = +p[0];
      m = +p[1];
      a = +p[2];
    }
    if (!d || !m || !a) return {dia: '', mes: '', anio: ''};
    return {dia: d, mes: m, anio: a};
  }
}
