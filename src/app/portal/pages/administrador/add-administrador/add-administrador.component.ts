import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {Subject} from 'rxjs';
import {Administrador} from '../core-administrador/administrador.interface';

type SubmitEvent = { mode: 'create' | 'edit', payload: Administrador, id?: string };

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

  constructor(private fb: FormBuilder) {
    this.createForm();
    this.applyModeValidators();
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
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.email]],
        telefono: [''],
        direccion: [''],
        cantConsorcios: [0],
        user: ['', [Validators.required]],
        password: [''],
        passwordConfirm: ['']
      },
      {
        validators: this.passwordsMatchValidator
      }
    );
  }

  private passwordsMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get('password')?.value ?? '';
    const confirm = group.get('passwordConfirm')?.value ?? '';
    if (!pass && !confirm) return null;
    return pass === confirm ? null : {passwordMismatch: true};
  };

  private applyModeValidators(): void {
    const passwordCtrl = this.administradorForm.get('password');
    const passwordConfirmCtrl = this.administradorForm.get('passwordConfirm');

    if (!passwordCtrl || !passwordConfirmCtrl) return;

    if (this.editUser) {
      passwordCtrl.clearValidators();
      passwordConfirmCtrl.clearValidators();
    } else {
      passwordCtrl.setValidators([Validators.required, Validators.minLength(6)]);
      passwordConfirmCtrl.setValidators([Validators.required]);
    }

    passwordCtrl.updateValueAndValidity({emitEvent: false});
    passwordConfirmCtrl.updateValueAndValidity({emitEvent: false});
    this.administradorForm.updateValueAndValidity({emitEvent: false});
  }

  private patchFormWithInitialData(): void {
    if (!this.initialData) {
      this.administradorForm.reset({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        cantConsorcios: 0,
        user: '',
        password: '',
        passwordConfirm: ''
      });
      return;
    }
    this.administradorForm.patchValue({
      nombre: this.initialData.nombre ?? '',
      email: this.initialData.email ?? '',
      telefono: this.initialData.telefono ?? '',
      direccion: this.initialData.direccion ?? '',
      cantConsorcios: this.initialData.cantConsorcios ?? 0,
      user: this.initialData.user ?? '',
      password: '',
      passwordConfirm: ''
    });
  }

  public agregarAdministrador(): void {
    if (this.administradorForm.invalid) {
      this.administradorForm.markAllAsTouched();
      return;
    }
    const value = this.administradorForm.getRawValue();

    const payload: Administrador = {
      nombre: value.nombre,
      email: value.email,
      telefono: value.telefono,
      direccion: value.direccion,
      cantConsorcios: Number(value.cantConsorcios) || 0,
      user: value.user,
      password: value.password
    };

    this.submit.emit({mode: 'create', payload});
  }

  public modificarAdministrador(): void {
    if (this.administradorForm.invalid) {
      this.administradorForm.markAllAsTouched();
      return;
    }

    const value = this.administradorForm.getRawValue();

    const payload: Administrador = {
      nombre: value.nombre,
      email: value.email,
      telefono: value.telefono,
      direccion: value.direccion,
      cantConsorcios: Number(value.cantConsorcios) || 0,
      user: value.user,
      password: value.password ? value.password : (this.initialData?.password ?? '')
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

  get hasPasswordMismatch(): boolean {
    return this.administradorForm.hasError('passwordMismatch');
  }
}
