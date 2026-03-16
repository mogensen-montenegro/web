import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import Swal from 'sweetalert2';
import { PlantillaEmail } from './plantilla-email.interface';
import { PlantillaEmailService } from './plantilla-email.service';

type PlantillaForm = FormGroup<{
  nombre: FormControl<string>;
  asunto: FormControl<string>;
  body: FormControl<string>;
}>;

@Component({
  selector: 'app-plantillas-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './plantillas-email.component.html',
  styleUrls: ['./plantillas-email.component.scss']
})
export class PlantillasEmailComponent implements OnInit {
  plantillas: PlantillaEmail[] = [];
  loading = true;
  editingId: string | null = null;

  form: PlantillaForm = this.fb.nonNullable.group({
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    asunto: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    body: this.fb.nonNullable.control(
      'Hola {{NOMBRE}},\n\nTe escribimos para avisarte que ...\n\nSaludos,\nMogensen Montenegro',
      [Validators.required, Validators.minLength(5)]
    )
  });

  placeholders = [
    '{{NOMBRE}}',
    '{{EMAIL}}',
    '{{CUIT}}',
    '{{FECHA_NACIMIENTO}}',
    '{{DIRECCION}}',
    '{{TELEFONO}}',
    '{{CONSORCIOS}}'
  ];

  constructor(
    private fb: FormBuilder,
    private plantillaSvc: PlantillaEmailService
  ) {}

  ngOnInit(): void {
    this.cargarLista();
  }

  cargarLista(): void {
    this.loading = true;
    this.plantillas = this.plantillaSvc.getAll();
    this.loading = false;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, asunto, body } = this.form.getRawValue();
    if (this.editingId) {
      this.plantillaSvc.update(this.editingId, { nombre, asunto, body });
      Swal.fire({
        icon: 'success',
        title: 'Plantilla actualizada',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      this.plantillaSvc.create({ nombre, asunto, body });
      Swal.fire({
        icon: 'success',
        title: 'Plantilla creada',
        timer: 2000,
        showConfirmButton: false
      });
    }
    this.cargarLista();
    this.cancelar();
  }

  editar(p: PlantillaEmail): void {
    this.editingId = p.id;
    this.form.patchValue({
      nombre: p.nombre,
      asunto: p.asunto,
      body: p.body
    });
  }

  cancelar(): void {
    this.editingId = null;
    this.form.reset({
      nombre: '',
      asunto: '',
      body: 'Hola {{NOMBRE}},\n\nTe escribimos para avisarte que ...\n\nSaludos,\nMogensen Montenegro'
    });
  }

  eliminar(p: PlantillaEmail): void {
    Swal.fire({
      title: 'Eliminar plantilla',
      text: `¿Eliminar la plantilla "${p.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.plantillaSvc.delete(p.id);
      this.cargarLista();
      if (this.editingId === p.id) this.cancelar();
      Swal.fire({ icon: 'success', title: 'Plantilla eliminada', timer: 2000, showConfirmButton: false });
    });
  }
}
