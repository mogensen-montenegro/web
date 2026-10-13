import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, take } from 'rxjs';
import Swal from 'sweetalert2';
import { Profesores } from '../profesor.interface';
import { PERSONAL_MODULOS_CONFIG, ProfesorPermisosService } from '../profesor-permisos.service';
import { ProfesoresService } from '../profesores.service';

@Component({
  selector: 'app-modal-permisos-profesor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-permisos-profesor.component.html',
  styleUrls: ['./modal-permisos-profesor.component.scss']
})
export class ModalPermisosProfesorComponent implements OnChanges {
  @Input() profesores: Profesores[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  public readonly modulos = PERSONAL_MODULOS_CONFIG;
  public permisosPorProfesor: Record<string, Record<string, boolean>> = {};
  public saving = false;

  constructor(
    private profesoresService: ProfesoresService,
    private profesorPermisosService: ProfesorPermisosService
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['profesores']) {
      this.buildPermisos();
    }
  }

  public cerrar(): void {
    if (this.saving) return;
    this.closed.emit();
  }

  public guardar(): void {
    const requests = this.profesores
      .filter((profesor) => Boolean(profesor._id || profesor.id))
      .map((profesor) => {
        const id = (profesor._id || profesor.id) as string;
        const permisosModulos = this.profesorPermisosService.normalize(this.permisosPorProfesor[id]);
        return this.profesoresService.editarProfesor(id, { ...profesor, permisosModulos }, false);
      });

    if (!requests.length) {
      this.closed.emit();
      return;
    }

    this.saving = true;
    forkJoin(requests.length ? requests : [of(null)]).pipe(take(1)).subscribe({
      next: () => {
        this.saving = false;
        void Swal.fire({
          icon: 'success',
          title: 'Permisos actualizados',
          showConfirmButton: false,
          timer: 1800
        });
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
        void Swal.fire({
          icon: 'error',
          title: 'No se pudieron guardar los permisos',
          text: 'Intentá nuevamente en unos minutos.'
        });
      }
    });
  }

  public profesorId(profesor: Profesores): string {
    return (profesor._id || profesor.id || '') as string;
  }

  private buildPermisos(): void {
    this.permisosPorProfesor = this.profesores.reduce((acc, profesor) => {
      const id = this.profesorId(profesor);
      if (!id) return acc;
      acc[id] = this.profesorPermisosService.normalize(profesor.permisosModulos);
      return acc;
    }, {} as Record<string, Record<string, boolean>>);
  }
}
