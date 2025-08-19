import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-add-administrador',
  templateUrl: './add-administrador.component.html',
  styleUrls: ['./add-administrador.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class AddAdministradorComponent {
  @Output() private clicked: EventEmitter<void> = new EventEmitter();
  @Input() public editUser!: boolean;
  private destroy$: Subject<void> = new Subject();
  public _id: string = '';
  public nombre: string = '';
  public dni: string = '';
  public email: string = '';
  public telefono: string = '';
  public direccion: string = '';
  public consorcio: string = '';
  public nombreUsuario: string = '';
  public password: string = '';
  public passwordConfirm: string = '';
  public isLoading: boolean = false;
  public administradorForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.createForm();
  }

  private createForm(): void {
    this.administradorForm = this.fb.group({
      nombre: [this.nombre, ''],
      direccion: [this.nombre, ''],
      dni: [this.dni, [Validators.required]],
      email: [this.email, [Validators.email]],
      telefono: [this.telefono, ''],
      cantConsorcios: [''],
      user: [''],
      password: [''],
    });
  }

  public modificarAdministrador(): void {
  }

  public eliminarAdministrador(): void {
  }

  public agregarAdministrador(): void {
  }

  public closeModal(): void {
    this.administradorForm.reset();
    this.administradorForm.updateValueAndValidity();
    this.clicked.emit();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
    this.administradorForm.reset();
  }
}
