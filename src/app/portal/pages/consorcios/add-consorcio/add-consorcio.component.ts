import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subject, takeUntil} from 'rxjs';
import {Consorcio, ConsorcioResponse, CrearConsorcioResponse} from '../core-consorcio/consorcio.interface';
import {ConsorcioService} from '../core-consorcio/consorcio.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-consorcio',
  templateUrl: './add-consorcio.component.html',
  styleUrls: ['./add-consorcio.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class AddConsorcioComponent implements OnChanges, OnDestroy {
  @Input() public adminId: string = '';
  @Output() saved = new EventEmitter<Consorcio>();
  @Output() closed = new EventEmitter<void>();
  public form!: FormGroup;
  public isLoading = false;
  public isEdit = false;
  private destroy$ = new Subject<void>();
  private _consorcio: Consorcio | null = null;

  constructor(private fb: FormBuilder, private consorcioService: ConsorcioService) {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      encargado: [''],
      telefono: [''],
      direccion: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consorcio']) {
      this.isEdit = !!this.consorcio?._id;
      if (this.consorcio) {
        this.form.patchValue({
          nombre: this.consorcio.nombre ?? '',
          encargado: this.consorcio.encargado ?? '',
          telefono: this.consorcio.telefono ?? '',
          direccion: this.consorcio.direccion ?? ''
        });
      } else {
        this.form.reset();
      }
    }
  }

  @Input()
  set consorcio(value: Consorcio | null) {
    this._consorcio = value;
    this.isEdit = !!value?._id;
    if (!this.form) return;
    if (value) {
      this.form.patchValue({
        nombre: value.nombre ?? '',
        encargado: value.encargado ?? '',
        telefono: value.telefono ?? '',
        direccion: value.direccion ?? ''
      });
    } else {
      this.form.reset();
    }
  }

  get consorcio() {
    return this._consorcio;
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: Consorcio = {
      nombre: this.form.value.nombre?.trim(),
      encargado: this.form.value.encargado?.trim(),
      telefono: this.form.value.telefono?.trim(),
      direccion: this.form.value.direccion?.trim(),
      idAdmin: this.adminId.trim()
    };

    this.isLoading = true;

    if (this.isEdit && this.consorcio?._id) {
      this.consorcioService.updateById(this.consorcio._id, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            Swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: 'Consorcio modificado correctamente',
              timer: 2000,
              showConfirmButton: false
            }).then();
            const actualizado: Consorcio = {
              ...(this.consorcio as Consorcio),
              ...payload,
              _id: this.consorcio!._id
            };
            this.saved.emit(actualizado);
          },
          error: (err) => {
            this.isLoading = false;
            Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo modificar el consorcio'}).then();
            console.error(err);
          }
        });
    } else {
      this.consorcioService.crearConsorcio(this.adminId, payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resp: CrearConsorcioResponse) => {
            this.isLoading = false;
            Swal.fire({
              icon: 'success',
              title: 'Creado',
              text: 'Consorcio agregado correctamente',
              timer: 2000,
              showConfirmButton: false
            }).then();
            const nuevoLocal: Consorcio = {
              _id: resp.body?._id ?? crypto.randomUUID(),
              nombre: payload.nombre,
              encargado: payload.encargado,
              telefono: payload.telefono,
              direccion: payload.direccion,
              idAdmin: this.adminId,
              cantidadCarpetas: 0,
              cantidadArchivos: 0
            };
            this.saved.emit(nuevoLocal);
            this.form.reset();
          },
          error: (err) => {
            this.isLoading = false;
            Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo agregar el consorcio'}).then();
            console.error(err);
          }
        });
    }
  }

  public closeModal(): void {
    this.form.reset();
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
