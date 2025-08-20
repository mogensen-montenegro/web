import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject} from 'rxjs';

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
  public encargado: string = '';
  public telefono: string = '';
  public direccion: string = '';
  public consorcio: string = '';
  public isLoading: boolean = false;

  public agregarUsuarioForm!: FormGroup;



  constructor(private fb: FormBuilder, private route: Router) {
    this.createForm();
  }

  private createForm(): void {
    this.agregarUsuarioForm = this.fb.group({
      nombre: [this.nombre, ''],
      encargado: [this.encargado, [Validators.email]],
      telefono: [this.telefono, ''],
      direccion: [this.nombre, ''],
    });
  }

  public modificarConsorcio():void{}
  public eliminarConsorcio():void{}
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
