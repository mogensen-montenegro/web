import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Consorcio, ConsorcioResponse} from "../consorcios/core-consorcio/consorcio.interface";
import {Archivo, Carpeta} from "./archivos-core/archivo.models";
import {ArchivosService} from "./archivos-core/archivo.service";
import {ConsorcioService} from "../consorcios/core-consorcio/consorcio.service";
import {Subject, takeUntil} from "rxjs";
import Swal from "sweetalert2";
import {Administrador, AdministradorResponse} from "../administrador/core-administrador/administrador.interface";
import {AdministradorService} from "../administrador/core-administrador/administrador.service";
import {LoginService} from "../login/login-core/login.service";

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
  public carpetas: Carpeta[] = [];
  public carpetaSeleccionada: Carpeta | null = null;
  public archivos: Archivo[] = [];
  public loading = false;
  private destroy$ = new Subject<void>();
  public administradores: Administrador[] = [];
  public adminSeleccionadoId = '';
  public administradorSeleccionado: Administrador | null = null;

  public isSuper = false;
  public isAdmin = false;

  constructor(private administradorService: AdministradorService, private archivosSrv: ArchivosService, private consorcioService: ConsorcioService, public loginService: LoginService) {
  }

  ngOnInit(): void {
    this.isSuper = this.loginService.hasRole(['superuser']);
    this.isAdmin = this.loginService.hasRole(['admin']);

    if (this.isSuper) {
      this.cargarAdministradores();
    } else if (this.isAdmin) {
      this.adminSeleccionadoId = this.getCurrentUserId();
      this.administradorSeleccionado = {_id: this.adminSeleccionadoId} as Administrador;
      this.cargarConsorcios(this.adminSeleccionadoId);
    } else {
      this.consorcios = [];
    }
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') ?? '000000000000000000000000';
  }

  protected getConsorcioId(): string {
    return this.consorcioSeleccionadoId ?? '000000000000000000000000';
  }

  public cargarConsorcios(adminId: string) {
    this.consorcioSeleccionadoId = '';
    this.carpetaSeleccionada = null;
    this.carpetas = [];
    this.archivos = [];

    if (!adminId) {
      this.consorcios = [];
      this.showEmpty = true;
      return;
    }

    this.loading = true;
    this.consorcioService
      .getAllById(adminId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ConsorcioResponse) => {
          this.consorcios = resp.body ?? [];
          this.showEmpty = this.consorcios.length === 0;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.consorcios = [];
          this.showEmpty = true;
          Swal.fire({icon: 'error', title: 'Error', text: 'No se pudieron cargar los consorcios'}).then();
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
              this.carpetas[idx] = {...carpeta, ...carpAct};
            }

            if (this.carpetaSeleccionada?._id === carpeta._id) {
              this.carpetaSeleccionada = {...carpeta, ...carpAct};
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

  public verArchivosDeCarpeta(carpeta: Carpeta): void {
    Swal.fire({
      title: `${carpeta.titulo}`,
      html: 'Cargando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    }).then();

    this.archivosSrv.getArchivos(carpeta._id).subscribe({
      next: (archivos) => this.mostrarDialogArchivos(carpeta, archivos),
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener los archivos'
        }).then();
      }
    });
  }

  private truncateText(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.substring(0, max) + '...';
  }

  private mostrarDialogArchivos(carpeta: Carpeta, archivos: Archivo[]): void {
    const html = `
    <div class="mb-3 p-2 border rounded">
      <label for="filePicker" class="form-label mb-1">Agregar Archivo</label>
      <input id="filePicker" class="form-control" type="file" multiple />
      <div class="text-muted mt-1" style="font-size:.9rem">
        Seleccioná uno o más archivos para subirlos automáticamente.
      </div>
    </div>

    ${archivos.length ? `
      <div style="max-height: 60vh; overflow:auto;">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Formato</th>
              <th>Tamaño</th>
              <th>Creado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${archivos.map(a => `
              <tr>
                <td class="text-left">
                  <span title="${this.escape(a.nombreOriginal)}">
                    ${this.escape(this.truncateText(a.nombreOriginal, 25))}
                  </span>
                </td>
                <td class="text-left">${this.escape(a.mimetype)}</td>
                <td class="text-left">${this.escape(this.prettySize(a.size))}</td>
                <td class="text-left">${new Date(a.createdAt).toLocaleString()}</td>
                <td class="text-end">
                  <button class="btn btn-outline-secondary btn-sm me-2 js-open" data-id="${a._id}" data-path="${this.escape(a.path)}">Abrir</button>
                  <button class="btn btn-danger btn-sm js-del" data-id="${a._id}">Eliminar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>` : `
      <div class="d-flex flex-column align-items-center p-4">
        <img src="../../../assets/img/default.png" class="mb-2" style="width:72px;height:72px;">
        <div>Esta carpeta no tiene archivos.</div>
      </div>
      `
    }`;

    Swal.fire({
      title: `${carpeta.titulo}`,
      html,
      width: 900,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      didOpen: () => {
        const fileInput = document.getElementById('filePicker') as HTMLInputElement | null;
        const autoUpload = () => {
          if (!fileInput) return;
          const files = Array.from(fileInput.files ?? []);
          if (!files.length) return;

          Swal.fire({
            title: 'Subiendo...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          }).then();

          this.archivosSrv.subirArchivos(carpeta.consorcioId, carpeta._id, files).subscribe({
            next: () => {
              this.archivosSrv.getArchivos(carpeta._id).subscribe({
                next: (archs) => {
                  Swal.close();
                  this.mostrarDialogArchivos(carpeta, archs);
                  if (this.carpetaSeleccionada?._id === carpeta._id) {
                    this.cargarArchivos(carpeta._id);
                  }
                  this.cargarCarpetas();

                  Swal.fire({
                    icon: 'success',
                    title: 'Archivos subidos',
                    timer: 1200,
                    showConfirmButton: false
                  }).then();

                  if (fileInput) fileInput.value = '';
                },
                error: () => {
                  Swal.fire({icon: 'error', title: 'Error', text: 'Subió, pero no se pudo refrescar la lista'}).then();
                  if (fileInput) fileInput.value = '';
                }
              });
            },
            error: () => {
              Swal.fire({icon: 'error', title: 'Error', text: 'No se pudieron subir los archivos'}).then();
              if (fileInput) fileInput.value = '';
            }
          });
        };

        fileInput?.addEventListener('change', autoUpload);

        document.addEventListener('paste', (evt: ClipboardEvent) => {
          const items = evt.clipboardData?.files;
          if (!items || !items.length) return;
          const dt = new DataTransfer();
          Array.from(items).forEach(f => dt.items.add(f));
          if (fileInput) {
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change'));
          }
        }, {once: true});

        const btnsDel = Array.from(document.querySelectorAll<HTMLButtonElement>('.js-del'));
        btnsDel.forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')!;
            this.confirmarYEliminarArchivo(carpeta, id);
          });
        });

        const btnsOpen = Array.from(document.querySelectorAll<HTMLButtonElement>('.js-open'));
        btnsOpen.forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')!;
            const file = archivos.find(x => x._id === id);
            if (!file) return;
            const url = this.archivosSrv.archivoUrl(file.path);
            window.open(url, '_blank', 'noopener');
          });
        });
      }
    }).then();
  }

  private confirmarYEliminarArchivo(carpeta: Carpeta, archivoId: string): void {
    Swal.fire({
      title: '¿Eliminar archivo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(res => {
      if (!res.isConfirmed) {
        return;
      }

      Swal.fire({
        title: 'Eliminando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      }).then();

      this.archivosSrv.eliminarArchivo(archivoId).subscribe({
        next: () => {
          this.archivosSrv.getArchivos(carpeta._id).subscribe({
            next: (archivos) => {
              Swal.close();
              this.mostrarDialogArchivos(carpeta, archivos); // re-render modal
              if (this.carpetaSeleccionada?._id === carpeta._id) this.cargarArchivos(carpeta._id);
              this.cargarCarpetas();
              Swal.fire({
                icon: 'success',
                title: 'Archivo eliminado',
                timer: 1200,
                showConfirmButton: false
              }).then();
            },
            error: () => Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo refrescar el listado'})
          });
        },
        error: () => Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo eliminar el archivo'})
      });
    });
  }

  private escape(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  private cargarAdministradores(): void {
    this.loading = true;
    this.showEmpty = false;
    this.administradorService
      .getAll(this.getCurrentUserId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: AdministradorResponse) => {
          this.administradores = resp.body ?? [];
          this.showEmpty = this.administradores.length === 0;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          Swal.fire({icon: 'error', title: 'Error', text: 'No se pudieron cargar los administradores'}).then();
          console.error(err);
        },
      });
  }

  public onAdministradorSeleccionado(): void {
    this.consorcioSeleccionadoId = '';
    this.administradorSeleccionado = this.administradores.find((a) => a._id === this.adminSeleccionadoId) || null;
    this.cargarConsorcios(this.adminSeleccionadoId);
  }
}
