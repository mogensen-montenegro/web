import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Subject } from 'rxjs';
import { PersonalSubmitEvent, Profesores } from '../profesor.interface';

@Component({
  selector: 'app-modal-profesor',
  templateUrl: './modal-profesor.component.html',
  styleUrls: ['./modal-profesor.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ModalProfesorComponent implements OnChanges, OnDestroy {
  @Output() clicked = new EventEmitter<void>();
  @Output() submit = new EventEmitter<PersonalSubmitEvent>();
  @Input() editProfesor = false;
  @Input() initialData?: Profesores | null;

  private destroy$ = new Subject<void>();
  public isLoading = false;
  public agregarProfesorForm!: FormGroup;
  public arrayDia: number[] = [];
  public arrayMes: number[] = [];
  public arrayAnio: number[] = [];

  constructor(private fb: FormBuilder) {
    this.createForm();
    this.applyModeValidators();
    this.inicializacionDias();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editProfesor']) {
      this.applyModeValidators();
      if (!this.editProfesor) this.resetToEmpty();
    }
    if (changes['initialData']) {
      this.patchFormWithInitialData();
    }
  }

  private createForm(): void {
    this.agregarProfesorForm = this.fb.group(
      {
        nombre: ['', [Validators.required]],
        apellido: [''],
        dni: ['', [Validators.required]],
        telefono: [''],
        direccion: [''],
        dia: [''],
        mes: [''],
        anio: [''],
        horario: [''],
        cargo: [''],
        especialidad: [''],
        user: ['', [Validators.required, Validators.minLength(3)]],
        password: [''],
        password2: ['']
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  private passwordsMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get('password')?.value ?? '';
    const confirm = group.get('password2')?.value ?? '';
    if (this.editProfesor && !pass && !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  };

  private applyModeValidators(): void {
    const passwordCtrl = this.agregarProfesorForm.get('password');
    const password2Ctrl = this.agregarProfesorForm.get('password2');
    if (!passwordCtrl || !password2Ctrl) return;

    if (this.editProfesor) {
      passwordCtrl.setValidators([Validators.minLength(6)]);
      password2Ctrl.clearValidators();
    } else {
      passwordCtrl.setValidators([Validators.required, Validators.minLength(6)]);
      password2Ctrl.setValidators([Validators.required]);
    }

    passwordCtrl.updateValueAndValidity({ emitEvent: false });
    password2Ctrl.updateValueAndValidity({ emitEvent: false });
    this.agregarProfesorForm.updateValueAndValidity({ emitEvent: false });
  }

  private resetToEmpty(): void {
    this.agregarProfesorForm.reset({
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      direccion: '',
      dia: '',
      mes: '',
      anio: '',
      horario: '',
      cargo: '',
      especialidad: '',
      user: '',
      password: '',
      password2: ''
    });
  }

  private patchFormWithInitialData(): void {
    if (!this.initialData) {
      this.resetToEmpty();
      return;
    }
    const { dia, mes, anio } = this.parseFechaToParts(this.initialData.fechaNacimiento);
    this.agregarProfesorForm.patchValue({
      nombre: this.initialData.nombre ?? '',
      apellido: this.initialData.apellido ?? '',
      dni: this.initialData.documento ?? '',
      telefono: this.initialData.telefono ?? '',
      direccion: this.initialData.direccion ?? '',
      dia,
      mes,
      anio,
      horario: this.initialData.horario ?? '',
      cargo: this.initialData.cargo ?? '',
      especialidad: this.initialData.especialidad ?? '',
      user: this.initialData.user ?? '',
      password: '',
      password2: ''
    });
  }

  private inicializacionDias(): void {
    const currentYear = new Date().getFullYear();
    this.arrayDia = Array.from({ length: 31 }, (_, i) => i + 1);
    this.arrayMes = Array.from({ length: 12 }, (_, i) => i + 1);
    this.arrayAnio = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);
  }

  public agregarProfesor(): void {
    if (this.agregarProfesorForm.invalid) {
      this.agregarProfesorForm.markAllAsTouched();
      return;
    }
    this.submit.emit({ mode: 'create', payload: this.mappingProfesoresRequest() });
    this.resetToEmpty();
  }

  public modificarProfesorSeleccionado(): void {
    if (this.agregarProfesorForm.invalid) {
      this.agregarProfesorForm.markAllAsTouched();
      return;
    }
    const password = this.agregarProfesorForm.get('password')?.value;
    this.submit.emit({
      mode: 'edit',
      payload: this.mappingProfesoresRequest(),
      id: this.initialData?._id || this.initialData?.id,
      updatePassword: !!password
    });
  }

  public closeModal(): void {
    this.agregarProfesorForm.reset();
    this.clicked.emit();
  }

  public eliminarProfesorSeleccionado(): void {
    this.submit.emit({
      mode: 'delete',
      payload: this.mappingProfesoresRequest(),
      id: this.initialData?._id || this.initialData?.id
    });
  }

  private mappingProfesoresRequest(): Profesores {
    const v = this.agregarProfesorForm.getRawValue();
    return {
      nombre: (v.nombre || '').trim(),
      apellido: (v.apellido || '').trim(),
      documento: (v.dni || '').trim(),
      telefono: (v.telefono || '').trim(),
      password: v.password || '',
      direccion: (v.direccion || '').trim(),
      fechaNacimiento: this.buildFechaNacimiento(),
      horario: (v.horario || '').trim(),
      especialidad: (v.especialidad || '').trim(),
      cargo: (v.cargo || '').trim(),
      user: (v.user || '').trim()
    };
  }

  private buildFechaNacimiento(): string {
    const d = Number(this.agregarProfesorForm.get('dia')?.value);
    const m = Number(this.agregarProfesorForm.get('mes')?.value);
    const a = Number(this.agregarProfesorForm.get('anio')?.value);
    if (!d || !m || !a) return '';
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${a}`;
  }

  private parseFechaToParts(value?: string | Date | null): { dia: number | ''; mes: number | ''; anio: number | '' } {
    if (!value) return { dia: '', mes: '', anio: '' };
    if (value instanceof Date) {
      return { dia: value.getDate(), mes: value.getMonth() + 1, anio: value.getFullYear() };
    }
    const s = String(value).trim();
    const sep = s.includes('-') ? '-' : s.includes('/') ? '/' : null;
    if (!sep) return { dia: '', mes: '', anio: '' };
    const p = s.split(sep);
    if (p.length !== 3) return { dia: '', mes: '', anio: '' };
    if (p[0].length === 4) return { dia: +p[2] || '', mes: +p[1] || '', anio: +p[0] || '' };
    return { dia: +p[0] || '', mes: +p[1] || '', anio: +p[2] || '' };
  }

  get f() {
    return this.agregarProfesorForm.controls;
  }

  get showPwdMismatch(): boolean {
    const confirm = this.f['password2'];
    return !!(confirm.value && (confirm.dirty || confirm.touched) && this.agregarProfesorForm.hasError('passwordMismatch'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
