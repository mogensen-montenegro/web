import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, map, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-consorcio',
  templateUrl: './add-consorcio.component.html',
  styleUrls: ['./add-consorcio.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class AddConsorcioComponent {
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
  public password2: string = '';
  public isLoading: boolean = false;

  public agregarUsuarioForm!: FormGroup;



  constructor(private fb: FormBuilder, private route: Router) {
    this.createForm();
  }

  private createForm(): void {
    this.agregarUsuarioForm = this.fb.group({
      nombre: [this.nombre, ''],
      direccion: [this.nombre, ''],
      dni: [this.dni, [Validators.required]],
      email: [this.email, [Validators.email]],
      telefono: [this.telefono, ''],
      nombreUsuario: [''],
      password: [''],
    });
  }

  public modificarAdministrador():void{}
  public eliminarAdministrador():void{}
  public agregarConsorcio():void{}

  public closeModal(): void {
    this.agregarUsuarioForm.reset();
    this.agregarUsuarioForm.updateValueAndValidity();
  }


  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
    this.agregarUsuarioForm.reset();
  }


}
