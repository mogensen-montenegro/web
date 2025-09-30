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
  if (!this.consorcioSeleccionadoId) return;

  // El popup se adapta para que el contenido no desborde
  const popupWidth = Math.min(window.innerWidth - 48, 760);
  const formWidth  = Math.min(window.innerWidth - 88, 720);

  Swal.fire({
    title: 'Nueva Carpeta',
    width: popupWidth,
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,

    html: `
      <!-- Estilos puntuales para mejorar legibilidad del placeholder -->
      <style>
        #swal-input-titulo::placeholder,
        #swal-textarea-msg::placeholder {
          color: #7b7b7b;   /* más oscuro => mejor contraste */
          opacity: 1;
        }
      </style>

      <div id="swal-form"
           style="
             width:${formWidth}px; margin:0 auto;
             display:flex; flex-direction:column; align-items:center;
             box-sizing:border-box;
           ">

        <label for="swal-input-titulo"
               class="swal2-label"
               style="display:block; text-align:center; font-weight:600; margin-bottom:6px;">
          Título de la carpeta
        </label>

        <!-- Gris más clarito -->
        <input id="swal-input-titulo"
               class="swal2-input"
               placeholder="Escribe un título..."
               style="
                 width:100%; text-align:left; padding:10px;
                 border:0; outline:0; border-radius:6px;
                 background:#f3f4f6;       /* <-- más claro */
                 font-size:15px; font-weight:300; color:#454545;
                 box-sizing:border-box;
               " />

        <!-- Fila del switch SIN fondo gris -->
        <div id="swal-switch-row"
             style="
               width:100%; margin-top:10px; padding:10px 0;  /* mismo padding vertical que un input */
               background:transparent;                       /* <-- sin gris de fondo */
               display:flex; align-items:center; gap:12px; box-sizing:border-box;
             ">

          <!-- Toggle custom -->
          <div id="swal-toggle"
               role="switch" aria-checked="false" tabindex="0" data-checked="false"
               style="
                 position:relative; width:48px; height:28px; flex:0 0 auto;
                 border-radius:999px; background:#ffe0e3;
                 cursor:pointer; transition:background .2s ease;
               ">
            <div id="swal-knob"
                 style="
                   position:absolute; left:4px; top:4px;
                   width:20px; height:20px; border-radius:50%;
                   background:#fff; transition:transform .2s ease;
                   box-shadow:0 1px 2px rgba(0,0,0,.25);
                 ">
            </div>
          </div>

          <span style="font-size:15px; color:#2d2d2d; font-weight:500; user-select:none;">
            ¿Cargar Mensaje Automático?
          </span>
        </div>

        <!-- Gris más clarito y centrado -->
        <textarea id="swal-textarea-msg"
                  class="swal2-textarea"
                  placeholder="Escribe el mensaje..."
                  maxlength="2000"
                  style="
                    display:none; width:100%; margin:.5em auto 0;
                    min-height:110px; resize:vertical;
                    background:#f3f4f6;     /* <-- más claro */
                    color:#454545;
                    border:0; outline:0; border-radius:6px;
                    box-sizing:border-box;
                  "></textarea>
      </div>
    `,

    didOpen: () => {
      const popup = Swal.getPopup()!;
      const titulo = popup.querySelector('#swal-input-titulo') as HTMLInputElement;
      const toggle = popup.querySelector('#swal-toggle') as HTMLDivElement;
      const knob   = popup.querySelector('#swal-knob') as HTMLDivElement;
      const ta     = popup.querySelector('#swal-textarea-msg') as HTMLTextAreaElement;

      const setOn = (on: boolean) => {
        toggle.setAttribute('data-checked', on ? 'true' : 'false');
        toggle.setAttribute('aria-checked', on ? 'true' : 'false');
        toggle.style.background = on ? '#d70d0dff' : '#dfe3ff'; // ON morado, OFF lila claro (no gris)
        knob.style.transform = on ? 'translateX(20px)' : 'translateX(0)';
        ta.style.display = on ? 'block' : 'none';
        if (!on) ta.value = '';
      };

      toggle.addEventListener('click', () => setOn(toggle.getAttribute('data-checked') !== 'true'));
      toggle.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key.toLowerCase() === 'enter') {
          e.preventDefault();
          setOn(toggle.getAttribute('data-checked') !== 'true');
        }
      });

      setOn(false);   // estado inicial OFF
      titulo?.focus();
    },

    preConfirm: () => {
      const tituloEl = document.getElementById('swal-input-titulo') as HTMLInputElement | null;
      const toggleEl = document.getElementById('swal-toggle') as HTMLElement | null;
      const taEl     = document.getElementById('swal-textarea-msg') as HTMLTextAreaElement | null;

      const titulo = tituloEl?.value?.trim() || '';
      if (!titulo) {
        Swal.showValidationMessage('El título es obligatorio');
        return;
      }

      const usarMensaje = toggleEl?.getAttribute('data-checked') === 'true';
      const mensajeRaw  = taEl?.value?.trim();
      const mensaje     = usarMensaje && mensajeRaw ? mensajeRaw : undefined;

      return { titulo, mensaje };
    }
  }).then(res => {
    if (res.isConfirmed && res.value) {
      const { titulo, mensaje } = res.value as { titulo: string; mensaje?: string };
      this.archivosSrv.crearCarpeta(this.consorcioSeleccionadoId, titulo, mensaje).subscribe({
        next: () => {
          this.cargarCarpetas();
          Swal.fire({ icon: 'success', title: 'Carpeta creada exitosamente', showConfirmButton: false, timer: 1500 });
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear la carpeta' });
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
              title: 'Carpeta eliminada exitosamente',
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
  // ancho del popup para que no se recorte
  const popupWidth = Math.min(window.innerWidth - 48, 760);
  const formWidth  = Math.min(window.innerWidth - 88, 720);

  const tieneMensaje = !!(carpeta.mensaje && carpeta.mensaje.trim());

  Swal.fire({
    title: 'Editar Carpeta',
    width: popupWidth,
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    html: `
      <style>
        #swal-edit-titulo::placeholder,
        #swal-edit-msg::placeholder {
          color:#7b7b7b; opacity:1;
        }
      </style>

      <div style="width:${formWidth}px;margin:0 auto;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;">
        <label for="swal-edit-titulo" class="swal2-label" style="display:block;text-align:center;font-weight:600;margin-bottom:6px;">
          Título
        </label>

        <input id="swal-edit-titulo"
               class="swal2-input"
               placeholder="Escribe un título..."
               value="${this.escape(carpeta.titulo)}"
               style="
                 width:100%; text-align:left; padding:10px;
                 border:0; outline:0; border-radius:6px;
                 background:#f3f4f6; font-size:15px; font-weight:300; color:#454545;
                 box-sizing:border-box;
               " />

        <!-- Fila del switch -->
        <div id="swal-edit-switch-row"
             style="
               width:100%; margin-top:10px; padding:10px 0;
               background:transparent;
               display:flex; align-items:center; gap:12px; box-sizing:border-box;
             ">

          <div id="swal-edit-toggle"
               role="switch" aria-checked="${tieneMensaje ? 'true':'false'}" tabindex="0" data-checked="${tieneMensaje ? 'true':'false'}"
               style="
                 position:relative; width:48px; height:28px; flex:0 0 auto;
                 border-radius:999px; background:${tieneMensaje ? '#d00707ff' : '#dfe3ff'};
                 cursor:pointer; transition:background .2s ease;
               ">
            <div id="swal-edit-knob"
                 style="
                   position:absolute; left:4px; top:4px;
                   width:20px; height:20px; border-radius:50%;
                   background:#fff; transition:transform .2s ease;
                   box-shadow:0 1px 2px rgba(0,0,0,.25);
                   transform:${tieneMensaje ? 'translateX(20px)' : 'translateX(0)'};
                 ">
            </div>
          </div>

          <span style="font-size:15px;color:#2d2d2d;font-weight:500;user-select:none;">
            ¿Cargar Mensaje Automático?
          </span>
        </div>

        <textarea id="swal-edit-msg"
                  class="swal2-textarea"
                  placeholder="Escribe el mensaje..."
                  maxlength="2000"
                  style="
                    display:${tieneMensaje ? 'block':'none'};
                    width:100%; margin:.5em auto 0;
                    min-height:110px; resize:vertical;
                    background:#f3f4f6; color:#454545;
                    border:0; outline:0; border-radius:6px; box-sizing:border-box;
                  ">${tieneMensaje ? this.escape(carpeta.mensaje!) : ''}</textarea>
      </div>
    `,
    didOpen: () => {
      const popup = Swal.getPopup()!;
      const inputTitulo = popup.querySelector('#swal-edit-titulo') as HTMLInputElement;
      const toggle = popup.querySelector('#swal-edit-toggle') as HTMLDivElement;
      const knob   = popup.querySelector('#swal-edit-knob') as HTMLDivElement;
      const ta     = popup.querySelector('#swal-edit-msg') as HTMLTextAreaElement;

      const setOn = (on: boolean) => {
        toggle.setAttribute('data-checked', on ? 'true' : 'false');
        toggle.setAttribute('aria-checked', on ? 'true' : 'false');
        toggle.style.background = on ? '#6f64ff' : '#dfe3ff';
        knob.style.transform = on ? 'translateX(20px)' : 'translateX(0)';
        ta.style.display = on ? 'block' : 'none';
        if (!on) ta.value = '';
      };

      toggle.addEventListener('click', () => setOn(toggle.getAttribute('data-checked') !== 'true'));
      toggle.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key.toLowerCase() === 'enter') {
          e.preventDefault();
          setOn(toggle.getAttribute('data-checked') !== 'true');
        }
      });

      inputTitulo?.focus({ preventScroll: true });
    },
    preConfirm: () => {
      const tituloEl = document.getElementById('swal-edit-titulo') as HTMLInputElement | null;
      const toggleEl = document.getElementById('swal-edit-toggle') as HTMLElement | null;
      const taEl     = document.getElementById('swal-edit-msg') as HTMLTextAreaElement | null;

      const nuevoTitulo = tituloEl?.value?.trim() || '';
      if (!nuevoTitulo) {
        Swal.showValidationMessage('El título no puede estar vacío');
        return;
      }

      const usarMensaje = toggleEl?.getAttribute('data-checked') === 'true';
      const mensajeRaw  = taEl?.value?.trim();
      const nuevoMensaje = usarMensaje && mensajeRaw ? mensajeRaw : undefined;

      // Si no hay cambios ni en título ni en mensaje, avisamos
      const tituloIgual = nuevoTitulo === carpeta.titulo;
      const msgOriginal = (carpeta.mensaje ?? '').trim() || undefined;
      const msgIgual = (nuevoMensaje ?? undefined) === (msgOriginal ?? undefined);
      if (tituloIgual && msgIgual) {
        Swal.showValidationMessage('No hay cambios para guardar');
        return;
      }

      return { nuevoTitulo, nuevoMensaje };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const { nuevoTitulo, nuevoMensaje } = result.value as { nuevoTitulo: string; nuevoMensaje?: string };

      // ⬇⬇⬇ Service actualizado para aceptar mensaje opcional
      this.archivosSrv.actualizarCarpeta(carpeta.consorcioId, carpeta._id, nuevoTitulo, nuevoMensaje).subscribe({
        next: (carpAct) => {
          const idx = this.carpetas.findIndex(c => c._id === carpeta._id);
          if (idx > -1) this.carpetas[idx] = { ...carpeta, ...carpAct };

          if (this.carpetaSeleccionada?._id === carpeta._id) {
            this.carpetaSeleccionada = { ...carpeta, ...carpAct };
          }

          Swal.fire({
            icon: 'success',
            title: 'Carpeta actualizada',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la carpeta'
          });
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
  // Banner opcional (si hay mensaje)
  const msgHtml = (carpeta.mensaje && carpeta.mensaje.trim())
    ? `
    <div id="carpeta-msg"
         style="
           width:100%;
           background:#FFF6D6;
           border:1px solid #F6D48A;
           color:#5C4B00;
           padding:10px 12px;
           border-radius:8px;
           margin-bottom:12px;
           display:flex;
           align-items:flex-start;
           gap:10px;
           box-sizing:border-box;">
      <div style="font-weight:700; margin-top:1px;">&#9432;</div>
      <div id="carpeta-msg-text" style="flex:1; white-space:pre-wrap;"></div>
      <button id="carpeta-msg-close"
              aria-label="Cerrar"
              style="
                background:transparent; border:none;
                font-size:18px; line-height:1; cursor:pointer; color:#5C4B00;">
        &times;
      </button>
    </div>`
    : '';

  const html = `
    ${msgHtml}

    ${!this.isAdmin ? `
    <div class="mb-3 p-2 border rounded">
      <label for="filePicker" class="form-label mb-1">Agregar Archivo</label>
      <input id="filePicker" class="form-control" type="file" multiple />
      <div class="text-muted mt-1" style="font-size:.9rem">
        Seleccioná uno o más archivos para subirlos automáticamente.
      </div>
    </div>` : ``}

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
                  <button class="btn btn-outline-secondary btn-sm me-2 js-open" data-id="${a._id}">Descargar</button>
                  ${!this.isAdmin ? `<button class="btn btn-danger btn-sm js-del" data-id="${a._id}">Eliminar</button>` : ``}
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
    confirmButtonColor: '#d33',
    showConfirmButton: true,
    confirmButtonText: 'Cerrar',
    didOpen: () => {
      // Si hay mensaje, lo inyectamos de forma segura y habilitamos cerrar el banner
      const msgBox = document.getElementById('carpeta-msg') as HTMLDivElement | null;
      const msgText = document.getElementById('carpeta-msg-text') as HTMLDivElement | null;
      const msgClose = document.getElementById('carpeta-msg-close') as HTMLButtonElement | null;
      if (msgText && carpeta.mensaje) msgText.textContent = carpeta.mensaje;
      msgClose?.addEventListener('click', () => { if (msgBox) msgBox.style.display = 'none'; });

      const fileInput = document.getElementById('filePicker') as HTMLInputElement | null;

      const autoUpload = () => {
        if (!fileInput) return;
        const files = Array.from(fileInput.files ?? []);
        if (!files.length) return;

        const MAX_SIZE = 2 * 1024 * 1024;
        const invalid = files.filter(f => f.size > MAX_SIZE);
        if (invalid.length) {
          Swal.fire({
            icon: 'error',
            title: 'Archivo demasiado grande',
            text: `Cada archivo debe pesar como máximo 2 MB.`
          }).then();
          fileInput.value = '';
          return;
        }

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
                  title: 'Archivos subidos exitosamente',
                  timer: 1200,
                  showConfirmButton: false
                }).then();
                fileInput.value = '';
              },
              error: () => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Subió, pero no se pudo refrescar la lista'
                }).then();
                fileInput.value = '';
              }
            });
          },
          error: (err) => {
            const msj = err?.status === 413 ? 'Uno o más archivos superan 2 MB.' : 'No se pudieron subir los archivos';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: msj
            }).then();
            fileInput.value = '';
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

      const btnsOpen = Array.from(document.querySelectorAll<HTMLButtonElement>('.js-open'));
      btnsOpen.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id')!;
          const file = archivos.find(x => x._id === id);
          if (!file) return;

          this.archivosSrv.downloadArchivo(id).subscribe({
            next: (resp) => {
              const blob = resp.body!;
              const cd = resp.headers.get('content-disposition') || '';
              const match = /filename\*?=(?:UTF-8'')?"?([^"]+)"?/.exec(cd) || /filename="?([^"]+)"?/.exec(cd);
              const filenameHeader = match?.[1] ? decodeURIComponent(match[1]) : file.nombreOriginal || 'archivo';

              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filenameHeader;
              document.body.appendChild(a);

              const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
              if (isSafari) a.setAttribute('target', '_blank');

              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            },
            error: (err) => {
              const msj = err?.status === 413 ? 'El archivo supera el límite de 2 MB.' : 'No se pudo descargar el archivo';
              Swal.fire({ icon: 'error', title: 'Error', text: msj }).then();
            }
          });
        });
      });

      if (!this.isAdmin) {
        const btnsDel = Array.from(document.querySelectorAll<HTMLButtonElement>('.js-del'));
        btnsDel.forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id')!;
            this.confirmarYEliminarArchivo(carpeta, id);
          });
        });
      }
    }
  }).then();
}


  private confirmarYEliminarArchivo(carpeta: Carpeta, archivoId: string): void {
    Swal.fire({
      title: '¿Eliminar Archivo?',
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
              this.mostrarDialogArchivos(carpeta, archivos);
              if (this.carpetaSeleccionada?._id === carpeta._id) this.cargarArchivos(carpeta._id);
              this.cargarCarpetas();
              Swal.fire({
                icon: 'success',
                title: 'Archivo eliminado exitosamente',
                timer: 1200,
                showConfirmButton: false
              }).then();
            },
            error: () => Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo refrescar el listado'
            })
          });
        },
        error: () => Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el archivo'
        })
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
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los administradores'
          }).then();
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
