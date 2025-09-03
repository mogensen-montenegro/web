import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Consorcio, ConsorcioResponse} from "../consorcios/core-consorcio/consorcio.interface";
import {Archivo, Carpeta} from "./archivos-core/archivo.models";
import {ArchivosService} from "./archivos-core/archivo.service";
import {ConsorcioService} from "../consorcios/core-consorcio/consorcio.service";
import {Subject, takeUntil} from "rxjs";
import Swal from "sweetalert2";

@Component({
  selector: 'app-archivos',
  templateUrl: './archivos.component.html',
  styleUrls: ['./archivos.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ArchivosComponent implements OnInit {
  public showEmpty = false;
  public consorcios: Consorcio[] = [];
  public consorcioSeleccionadoId = '';
  public consorcioSeleccionado: Consorcio | null = null;
  public carpetas: Carpeta[] = [];
  public carpetaSeleccionada: Carpeta | null = null;
  public archivos: Archivo[] = [];
  public isUploading = false;
  private destroy$ = new Subject<void>();

  constructor(private archivosSrv: ArchivosService, private consorcioService: ConsorcioService) {
  }

  ngOnInit(): void {
    this.cargarConsorcios();
  }

  protected getConsorcioId(): string {
    return this.consorcioSeleccionadoId ?? '000000000000000000000000';
  }

  public cargarConsorcios() {
    this.isUploading = true;
    this.consorcioService
      .getAllById('68a74ed3e478fe3e62023ced')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ConsorcioResponse) => {
          this.consorcios = resp.body ?? [];
          this.showEmpty = this.consorcios.length === 0;
          this.isUploading = false;
        },
        error: (err) => {
          this.isUploading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los consorcios'
          }).then();
          console.error(err);
        },
      });
  }

  public onConsorvioSeleccionado(): void {
    this.carpetaSeleccionada = null;
    this.archivos = [];
    if (!this.consorcioSeleccionadoId) {
      this.carpetas = [];
      this.showEmpty = true;
      return;
    }
    this.cargarCarpetas();
  }

  private cargarCarpetas(): void {
    this.archivosSrv.getCarpetas(this.getConsorcioId()).subscribe({
      next: (carpetas) => {
        this.carpetas = carpetas;
        this.showEmpty = carpetas.length === 0;
      },
      error: () => {
        this.carpetas = [];
        this.showEmpty = true;
      }
    });
  }

  public crearNuevaCarpeta(): void {
    if (!this.consorcioSeleccionadoId) {
      return;
    }

    Swal.fire({
      title: 'Nueva Carpeta',
      input: 'text',
      inputLabel: 'Título de la carpeta',
      inputPlaceholder: 'Escribe un título...',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'El título es obligatorio';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const titulo = result.value.trim();
        this.archivosSrv.crearCarpeta(this.consorcioSeleccionadoId, titulo).subscribe({
          next: () => {
            this.cargarCarpetas();
            Swal.fire({
              icon: 'success',
              title: 'Carpeta creada',
              showConfirmButton: false,
              timer: 1500
            }).then();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo crear la carpeta'
            }).then();
          }
        });
      }
    });
  }

  public seleccionarCarpeta(carpeta: Carpeta): void {
    this.carpetaSeleccionada = carpeta;
    this.cargarArchivos(carpeta._id);
  }

  private cargarArchivos(carpetaId: string): void {
    this.archivosSrv.getArchivos(carpetaId).subscribe({
      next: (archivos) => (this.archivos = archivos),
      error: () => (this.archivos = [])
    });
  }

  public eliminarCarpeta(carpeta: Carpeta): void {
    Swal.fire({
      title: `¿Eliminar la carpeta "${carpeta.titulo}"?`,
      text: 'Se eliminarán también todos los archivos que contiene',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.archivosSrv.eliminarCarpeta(carpeta.consorcioId, carpeta._id).subscribe({
          next: () => {
            if (this.carpetaSeleccionada?._id === carpeta._id) {
              this.carpetaSeleccionada = null;
              this.archivos = [];
            }
            this.cargarCarpetas();

            Swal.fire({
              icon: 'success',
              title: 'Carpeta eliminada',
              showConfirmButton: false,
              timer: 1500
            }).then();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la carpeta'
            }).then();
          }
        });
      }
    });
  }

  public renombrarCarpeta(carpeta: Carpeta): void {
    Swal.fire({
      title: 'Renombrar Carpeta',
      input: 'text',
      inputValue: carpeta.titulo,
      inputLabel: 'Nuevo título',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'El título no puede estar vacío';
        }
        if (value.trim() === carpeta.titulo) {
          return 'El título es el mismo que el actual';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nuevo = result.value.trim();

        this.archivosSrv.actualizarCarpeta(carpeta.consorcioId, carpeta._id, nuevo).subscribe({
          next: (carpAct) => {
            const idx = this.carpetas.findIndex(c => c._id === carpeta._id);
            if (idx > -1) {
              this.carpetas[idx] = { ...carpeta, ...carpAct };
            }

            if (this.carpetaSeleccionada?._id === carpeta._id) {
              this.carpetaSeleccionada = { ...carpeta, ...carpAct };
            }

            Swal.fire({
              icon: 'success',
              title: 'Carpeta renombrada',
              showConfirmButton: false,
              timer: 1500
            }).then();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo renombrar (falta endpoint en backend)'
            }).then();
          }
        });
      }
    });
  }

  public onFileInputChange(ev: Event): void {
    if (!this.carpetaSeleccionada || !this.consorcioSeleccionado) return;
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    this.isUploading = true;
    this.archivosSrv
      .subirArchivos(this.getConsorcioId(), this.carpetaSeleccionada._id, files)
      .subscribe({
        next: () => {
          this.isUploading = false;
          this.cargarArchivos(this.carpetaSeleccionada!._id);
          input.value = '';
          this.cargarCarpetas();
        },
        error: () => {
          this.isUploading = false;
          alert('No se pudieron subir los archivos');
        }
      });
  }

  public eliminarArchivo(archivo: Archivo): void {
    if (!confirm(`¿Eliminar el archivo "${archivo.nombreOriginal}"?`)) return;
    this.archivosSrv.eliminarArchivo(archivo._id).subscribe({
      next: () => {
        if (this.carpetaSeleccionada) this.cargarArchivos(this.carpetaSeleccionada._id);
        this.cargarCarpetas();
      },
      error: () => alert('No se pudo eliminar el archivo')
    });
  }

  public renombrarArchivo(archivo: Archivo): void {
    const nuevo = prompt('Nuevo nombre (visual)', archivo.nombreOriginal);
    if (!nuevo || nuevo.trim() === archivo.nombreOriginal) return;
    this.archivosSrv.actualizarArchivo(archivo._id, {nombreOriginal: nuevo.trim()}).subscribe({
      next: (archAct) => {
        const i = this.archivos.findIndex(a => a._id === archivo._id);
        if (i > -1) this.archivos[i] = {...archivo, ...archAct};
      },
      error: () => alert('No se pudo renombrar (falta endpoint en backend)')
    });
  }

  public archivoUrl(a: Archivo): string {
    return this.archivosSrv.archivoUrl(a.path);
  }

  public prettySize(bytes: number | undefined): string {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }
}
