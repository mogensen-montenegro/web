import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { ModalPermisosProfesorComponent } from '../modal-permisos-profesor/modal-permisos-profesor.component';
import { ModalProfesorComponent } from '../modal-profesor/modal-profesor.component';
import { PersonalSubmitEvent, Profesores } from '../profesor.interface';
import { ProfesoresService } from '../profesores.service';

declare const bootstrap: any;

@Component({
  selector: 'app-panel-profesor',
  templateUrl: './panel-profesor.component.html',
  styleUrls: ['./panel-profesor.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ModalProfesorComponent, ModalPermisosProfesorComponent]
})
export class PanelProfesorComponent implements OnDestroy {
  public showLoader = true;
  public busqueda = '';
  public profesores: Profesores[] = [];
  public editProfesor = false;
  public selectedProfesor: Profesores | null = null;
  public showPermisosModal = false;
  private destroy$ = new Subject<void>();

  constructor(private profesoresService: ProfesoresService, private router: Router) {
    this.obtenerProfesores();
  }

  public obtenerProfesores(): void {
    this.showLoader = true;
    this.profesoresService
      .obtenerProfesores()
      .pipe(take(1))
      .subscribe({
        next: (rest) => {
          this.profesores = (rest || []).map((item) => ({
            ...item,
            fechaNacimiento: this.normalizarFecha(item.fechaNacimiento)
          }));
          this.showLoader = false;
        },
        error: () => {
          this.showLoader = false;
          void Swal.fire({
            icon: 'error',
            title: '¡Ups!',
            text: 'No se pudo cargar el personal',
            timer: 2500,
            showConfirmButton: false
          });
        }
      });
  }

  public filtrarUsuarios(): Profesores[] {
    const buscar = this.normalizar(this.busqueda);
    if (!buscar) return this.profesores;
    const words = buscar.split(/\s+/).filter(Boolean);
    return this.profesores.filter((usuario) => {
      const blob = this.normalizar(
        [
          usuario.nombre,
          usuario.apellido,
          usuario.documento,
          usuario.user,
          usuario.telefono,
          usuario.horario,
          usuario.especialidad,
          usuario.cargo,
          usuario.direccion
        ].join(' ')
      );
      return words.every((word) => blob.includes(word));
    });
  }

  public agregarUsuario(): void {
    this.editProfesor = false;
    this.selectedProfesor = null;
    this.profesoresService.updateUsuarioData(null);
    this.openModal();
  }

  public editarProfesorSeleccionado(profesor: Profesores): void {
    this.editProfesor = true;
    this.selectedProfesor = { ...profesor };
    this.profesoresService.updateUsuarioData(profesor);
    this.openModal();
  }

  public abrirModalPermisos(): void {
    this.showPermisosModal = true;
  }

  public cerrarModalPermisos(): void {
    this.showPermisosModal = false;
  }

  public permisosGuardados(): void {
    this.showPermisosModal = false;
    this.obtenerProfesores();
  }

  public navegarRegistro(): void {
    void this.router.navigateByUrl('/panel/agregar-profesor');
  }

  public onSubmit(evt: PersonalSubmitEvent): void {
    if (evt.mode === 'delete') {
      this.eliminarProfesor(evt);
      return;
    }

    if (evt.mode === 'create') {
      this.profesoresService
        .guardarProfesor(evt.payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            void Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: 'Se guardó satisfactoriamente',
              timer: 2000,
              showConfirmButton: false
            });
            this.obtenerProfesores();
            this.cerrarModal();
          },
          error: (err) => {
            void Swal.fire({
              icon: 'error',
              title: '¡Ups!',
              text: err?.error?.msj || 'No se pudo guardar el empleado'
            });
          }
        });
      return;
    }

    const id = evt.id;
    if (!id) return;
    this.profesoresService
      .editarProfesor(id, evt.payload, !!evt.updatePassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          void Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: 'El empleado fue modificado satisfactoriamente.',
            timer: 2000,
            showConfirmButton: false
          });
          this.obtenerProfesores();
          this.cerrarModal();
        },
        error: (err) => {
          void Swal.fire({
            icon: 'error',
            title: '¡Ups!',
            text: err?.error?.msj || 'No se pudo modificar el empleado'
          });
        }
      });
  }

  public cerrarModal(): void {
    const modalEl = document.getElementById('agregarEjercicio');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();
    this.selectedProfesor = null;
    this.profesoresService.updateUsuarioData(null);
  }

  public valorCelda(valor?: string | null): string {
    return valor ? valor : '-';
  }

  private eliminarProfesor(evt: PersonalSubmitEvent): void {
    const id = evt.id;
    if (!id) return;
    void Swal.fire({
      title: `¿Desea eliminar a ${evt.payload.nombre || 'este empleado'}?`,
      text: 'Una vez eliminado no podrás recuperarlo',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#b91828',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.profesoresService
        .eliminarProfesor(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            void Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: 'El empleado fue eliminado satisfactoriamente.',
              timer: 1500,
              showConfirmButton: false
            });
            this.obtenerProfesores();
            this.cerrarModal();
          },
          error: (err) => {
            void Swal.fire({
              icon: 'error',
              title: '¡Ups!',
              text: err?.error?.msj || 'No se pudo eliminar el empleado'
            });
          }
        });
    });
  }

  private openModal(): void {
    const modalEl = document.getElementById('agregarEjercicio');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  private normalizarFecha(value?: string | null): string {
    if (!value || /undefined|null/i.test(value)) return '';
    return value;
  }

  private normalizar(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
