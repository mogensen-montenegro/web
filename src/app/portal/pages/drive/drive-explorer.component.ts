import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx-js-style';
import {
  ConfiguracionService,
  DriveEditorKind,
  DriveFolder,
  DriveItem
} from '../configuracion/configuracion.service';
import { InactividadService } from '../login/login-core/inactividad.service';
import { LoginService } from '../login/login-core/login.service';
import { ModalPermisosProfesorComponent } from '../tu-personal/modal-permisos-profesor/modal-permisos-profesor.component';
import { Profesores } from '../tu-personal/profesor.interface';
import { ProfesorPermisosService } from '../tu-personal/profesor-permisos.service';
import { ProfesoresService } from '../tu-personal/profesores.service';
import { DriveBrowserComponent } from './drive-browser.component';
import { DriveSheetEditorComponent } from './drive-sheet-editor.component';
import { DriveWordEditorComponent } from './drive-word-editor.component';
import { CeldaHoja, HojaDrive, celdaVacia } from './drive.models';

const AUTOSAVE_MS = 5 * 60 * 1000;

interface DriveEditor {
  item: DriveItem;
  kind: DriveEditorKind;
  embedUrl: SafeResourceUrl | null;
  editUrl: string | null;
}

@Component({
  selector: 'app-drive-explorer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalPermisosProfesorComponent,
    DriveBrowserComponent,
    DriveSheetEditorComponent,
    DriveWordEditorComponent
  ],
  templateUrl: './drive-explorer.component.html',
  styleUrls: ['./drive-explorer.component.scss']
})
export class DriveExplorerComponent implements OnInit, OnDestroy {
  @ViewChild(DriveWordEditorComponent) wordEditor?: DriveWordEditorComponent;

  public loading = false;
  public guardando = false;
  public modificado = false;
  public puedeEditar = false;
  public puedeBorrar = false;
  public puedeAsignar = false;
  public esSuperuser = false;
  public showPermisos = false;
  public profesores: Profesores[] = [];
  public clientEmail = '';
  public raices: DriveFolder[] = [];
  public items: DriveItem[] = [];
  public ruta: DriveFolder[] = [];
  public carpetaActual: string | null = null;
  public editor: DriveEditor | null = null;
  public hojas: HojaDrive[] = [];
  public hojaActiva = 0;
  public texto = '';
  public vista: 'grid' | 'list' = 'list';
  public busqueda = '';
  public extrasBusqueda: DriveItem[] = [];
  public previews: Record<string, string> = {};
  public avisoPlanilla = '';
  public avisoAutoguardado = '';
  private libro: XLSX.WorkBook | null = null;
  private openedAt: string | null = null;
  private heartbeat?: ReturnType<typeof setInterval>;
  private autosaveTimer?: ReturnType<typeof setInterval>;
  private avisoAutoguardadoTimer?: ReturnType<typeof setTimeout>;
  private listadoPedido = 0;
  private buscarPedido = 0;
  private buscarTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private drive: ConfiguracionService,
    private loginService: LoginService,
    private inactividad: InactividadService,
    private permisos: ProfesorPermisosService,
    private profesoresService: ProfesoresService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.puedeEditar = this.loginService.hasRole(['superuser', 'personal']);
    this.puedeBorrar = this.permisos.canDeleteDrive();
    this.puedeAsignar = this.loginService.hasRole(['superuser', 'admin']);
    this.esSuperuser = this.loginService.hasRole(['superuser']);
    const vistaGuardada = localStorage.getItem('driveVista');
    if (vistaGuardada === 'list' || vistaGuardada === 'grid') this.vista = vistaGuardada;
    this.inactividad.setBeforeExpireHook(() => this.guardarEmergenciaPorInactividad());
    this.cargarRaices();
    if (this.puedeAsignar) this.cargarPersonal();
  }

  ngOnDestroy(): void {
    if (this.buscarTimer) clearTimeout(this.buscarTimer);
    if (this.avisoAutoguardadoTimer) clearTimeout(this.avisoAutoguardadoTimer);
    this.detenerAutosave();
    this.inactividad.setBeforeExpireHook(null);
    this.limpiarPreviews();
    this.registrarCierre(true);
  }

  @HostListener('window:beforeunload', ['$event'])
  public onBeforeUnload(event: BeforeUnloadEvent): void {
    this.registrarCierre(true);
    if (!this.modificado) return;
    event.preventDefault();
    event.returnValue = '';
  }

  public get tituloActual(): string {
    if (this.editor) return this.editor.item.name;
    if (!this.ruta.length) return 'Carpetas vinculadas';
    return this.ruta[this.ruta.length - 1].name;
  }

  public get puedeRegresar(): boolean {
    return this.ruta.length > 0 || !!this.editor;
  }

  public get visibles(): DriveItem[] {
    const q = this.busqueda.trim().toLowerCase();
    const local = this.items.filter((item) => !q || (item.name || '').toLowerCase().includes(q));
    const extra = this.extrasBusqueda.filter((item) => !this.items.some((actual) => actual.id === item.id));
    return [...local, ...extra];
  }

  public get carpetas(): DriveItem[] {
    return this.visibles.filter((item) => item.isFolder);
  }

  public get archivos(): DriveItem[] {
    return this.visibles.filter((item) => !item.isFolder);
  }

  public get raicesIds(): string[] {
    return this.raices.map((raiz) => raiz.id);
  }

  public puedeSalir(): boolean | Promise<boolean> {
    if (!this.modificado) return true;
    return this.resolverCambios();
  }

  public cambiarVista(vista: 'grid' | 'list'): void {
    this.vista = vista;
    localStorage.setItem('driveVista', vista);
  }

  public onBusqueda(value: string): void {
    this.busqueda = value;
    if (this.buscarTimer) clearTimeout(this.buscarTimer);
    const q = value.trim();
    if (q.length < 2) {
      this.extrasBusqueda = [];
      return;
    }
    this.buscarTimer = setTimeout(() => this.buscarRemoto(q), 350);
  }

  public irAConfig(): void {
    void this.router.navigateByUrl('/panel/configuracion');
  }

  public abrirPermisos(): void {
    this.showPermisos = true;
  }

  public onEditorChange(): void {
    this.marcarCambio();
  }

  public seleccionarHoja(index: number): void {
    const n = Number(index);
    if (!Number.isFinite(n) || n === this.hojaActiva) return;
    this.hojaActiva = n;
    this.cdr.detectChanges();
    setTimeout(() => this.asegurarHoja(n), 0);
  }

  public asegurarHoja(index: number): void {
    const hoja = this.hojas[index];
    if (!hoja) return;
    if (!hoja.cargada) {
      hoja.rows = this.filasDesdeSheet(this.worksheetDe(index, hoja.name));
      hoja.cargada = true;
    }
    this.cdr.detectChanges();
  }

  public precargarHojasBusqueda(): void {
    this.hojas.forEach((_, index) => this.asegurarHoja(index));
  }

  private worksheetDe(index: number, name: string): XLSX.WorkSheet {
    if (!this.libro) return {};
    const porNombre = name ? this.libro.Sheets[name] : undefined;
    if (porNombre) return porNombre;
    const clave = this.libro.SheetNames[index];
    return (clave && this.libro.Sheets[clave]) || {};
  }

  public onRichHtml(html: string): void {
    this.texto = html;
    this.marcarCambio();
  }

  public async regresar(): Promise<void> {
    if (this.editor) {
      await this.cerrarEditor();
      return;
    }
    await this.irA(this.ruta.length - 2);
  }

  public abrir(item: DriveItem): void {
    if (item.isFolder) {
      this.limpiarBusqueda();
      this.drive.abrirArchivo(item.id).subscribe({ error: () => undefined });
      this.ruta = [...this.ruta, { id: item.id, name: item.name }];
      this.carpetaActual = item.id;
      this.cargarItems(item.id, true);
      return;
    }
    if (item.parentId && !this.carpetaActual) this.carpetaActual = item.parentId;
    this.loading = true;
    this.drive.abrirArchivo(item.id, this.carpetaActual).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.kind === 'folder') {
          this.ruta = [...this.ruta, { id: response.item.id, name: response.item.name }];
          this.carpetaActual = response.item.id;
          this.cargarItems(response.item.id, true);
          return;
        }
        if (response.converted) this.cargarItems(this.carpetaActual || undefined);
        if (response.kind === 'download') {
          this.descargar(response.item);
          return;
        }
        this.editor = {
          item: response.item,
          kind: response.kind,
          embedUrl: response.embedUrl
            ? this.sanitizer.bypassSecurityTrustResourceUrl(response.embedUrl)
            : null,
          editUrl: response.editUrl
        };
        this.openedAt = response.openedAt || response.item.modifiedTime || new Date().toISOString();
        this.iniciarHeartbeat();
        if (response.kind === 'sheet' && !response.embedUrl) this.cargarPlanilla(response.item);
        if (response.kind === 'text') {
          if (response.texto != null) this.texto = response.texto;
          else this.cargarTexto(response.item);
        }
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo abrir', this.textoError(err, 'No se pudo abrir el archivo. Probá de nuevo.'));
      }
    });
  }

  public async cerrarEditor(): Promise<void> {
    if (!(await this.resolverCambios())) return;
    this.salirDelEditor();
  }

  public trabajarAfuera(): void {
    if (this.editor?.editUrl) window.open(this.editor.editUrl, '_blank', 'noopener');
  }

  public async irA(index: number): Promise<void> {
    if (!(await this.resolverCambios())) return;
    if (this.editor) this.limpiarEditor();
    this.limpiarBusqueda();
    if (index < 0) {
      this.ruta = [];
      this.carpetaActual = null;
      this.cargarItems(undefined, true);
      return;
    }
    this.ruta = this.ruta.slice(0, index + 1);
    this.carpetaActual = this.ruta[this.ruta.length - 1].id;
    this.cargarItems(this.carpetaActual, true);
  }

  public async nuevaCarpeta(): Promise<void> {
    if (!this.carpetaActual) {
      void this.aviso('warning', 'Elegí una carpeta', 'Entrá a una carpeta vinculada para crear una subcarpeta.');
      return;
    }
    const name = await this.pedirNombre('Nueva carpeta', 'Nombre');
    if (!name) return;
    this.drive.crearCarpeta(this.carpetaActual, name).subscribe({
      next: () => this.cargarItems(this.carpetaActual || undefined),
      error: (err) => this.aviso('error', 'No se pudo crear', this.textoError(err, 'No se pudo crear la carpeta. Probá de nuevo.'))
    });
  }

  public async nuevoDocumento(): Promise<void> {
    if (!this.carpetaActual) {
      void this.aviso('warning', 'Elegí una carpeta', 'Entrá a una carpeta vinculada para crear el documento.');
      return;
    }
    const name = await this.pedirNombre('Nuevo documento', 'Documento');
    if (!name) return;
    this.loading = true;
    this.drive.crearDocumento(this.carpetaActual, name).subscribe({
      next: (response) => {
        this.loading = false;
        this.cargarItems(this.carpetaActual || undefined);
        this.abrir(response.item);
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo crear', this.textoError(err, 'No se pudo crear el documento. Probá de nuevo.'));
      }
    });
  }

  public async nuevaPlanilla(): Promise<void> {
    if (!this.carpetaActual) {
      void this.aviso('warning', 'Elegí una carpeta', 'Entrá a una carpeta vinculada para crear la planilla.');
      return;
    }
    const name = await this.pedirNombre('Nueva planilla', 'Planilla');
    if (!name) return;
    const fileName = name.toLowerCase().endsWith('.xlsx') ? name : `${name}.xlsx`;
    const wb = XLSX.utils.book_new();
    const rows = Array.from({ length: 16 }, () => Array(8).fill(''));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Hoja1');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File(
      [buffer],
      fileName,
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    this.loading = true;
    this.drive.subirArchivo(this.carpetaActual, file).subscribe({
      next: (response) => {
        this.loading = false;
        this.cargarItems(this.carpetaActual || undefined);
        this.abrir(response.item);
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo crear', this.textoError(err, 'No se pudo crear la planilla. Probá de nuevo.'));
      }
    });
  }

  public async nuevaPresentacion(): Promise<void> {
    if (!this.carpetaActual) {
      void this.aviso('warning', 'Elegí una carpeta', 'Entrá a una carpeta vinculada para crear la presentación.');
      return;
    }
    const name = await this.pedirNombre('Nueva presentación', 'Presentación');
    if (!name) return;
    this.loading = true;
    this.drive.crearPresentacion(this.carpetaActual, name).subscribe({
      next: (response) => {
        this.loading = false;
        this.cargarItems(this.carpetaActual || undefined);
        this.abrir(response.item);
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo crear', this.textoError(err, 'No se pudo crear la presentación. Probá de nuevo.'));
      }
    });
  }

  public async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const elegidos = Array.from(input.files || []);
    input.value = '';
    if (!elegidos.length || !this.carpetaActual) return;

    const maxBytes = 25 * 1024 * 1024;
    const grandes = elegidos.filter((f) => f.size > maxBytes);
    const files = elegidos.filter((f) => f.size <= maxBytes);
    if (!files.length) {
      void this.aviso('warning', 'Archivos muy pesados', 'Ninguno se puede subir: el límite es 25 MB por archivo.');
      return;
    }

    const parentId = this.carpetaActual;
    const total = files.length;
    this.loading = true;
    void Swal.fire({
      title: total === 1 ? 'Subiendo archivo' : 'Subiendo archivos',
      html: `0 / ${total}`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    let ok = 0;
    const fallidos: string[] = [];
    const concurrency = 3;
    let index = 0;

    const worker = async () => {
      while (index < files.length) {
        const current = index++;
        const file = files[current];
        try {
          await firstValueFrom(this.drive.subirArchivo(parentId, file));
          ok += 1;
        } catch (err: any) {
          fallidos.push(
            `${file.name}: ${this.textoError(err, 'No se pudo subir (máx. 25 MB).')}`
          );
        }
        Swal.update({ html: `${ok + fallidos.length} / ${total}` });
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()));
    this.loading = false;
    this.cargarItems(parentId);

    const extras =
      grandes.length > 0
        ? `<p style="margin-top:8px">Se omitieron ${grandes.length} por superar 25 MB.</p>`
        : '';

    if (!fallidos.length) {
      await Swal.fire({
        icon: 'success',
        title: ok === 1 ? 'Archivo subido' : 'Archivos subidos',
        html: `Se subieron ${ok} archivo${ok === 1 ? '' : 's'}.${extras}`,
        confirmButtonColor: '#b91828'
      });
      return;
    }

    await Swal.fire({
      icon: ok ? 'warning' : 'error',
      title: ok ? 'Subida parcial' : 'No se pudo subir',
      html:
        `<p>OK: ${ok} · Fallaron: ${fallidos.length}</p>${extras}` +
        `<ul style="text-align:left;max-height:180px;overflow:auto;margin:8px 0 0;padding-left:18px">${fallidos
          .slice(0, 12)
          .map((f) => `<li>${f}</li>`)
          .join('')}</ul>`,
      confirmButtonColor: '#b91828'
    });
  }

  public async renombrar(item: DriveItem): Promise<void> {
    const result = await Swal.fire({
      title: 'Renombrar',
      input: 'text',
      inputValue: item.name,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91828'
    });
    const name = String(result.value || '').trim();
    if (!result.isConfirmed || !name || name === item.name) return;
    this.drive.renombrar(item.id, name).subscribe({
      next: () => this.cargarItems(this.carpetaActual || undefined),
      error: (err) => this.aviso('error', 'No se pudo renombrar', this.textoError(err, 'No se pudo renombrar. Probá de nuevo.'))
    });
  }

  public async mover(item: DriveItem): Promise<void> {
    const destinos = this.destinosMover(item);
    if (!destinos.length) {
      void this.aviso('info', 'Sin destino', 'No hay otra carpeta vinculada para mover este archivo.');
      return;
    }
    const result = await Swal.fire({
      title: `Mover ${item.name}`,
      input: 'select',
      inputOptions: destinos.reduce((acc, destino) => {
        acc[destino.id] = destino.name;
        return acc;
      }, {} as Record<string, string>),
      inputPlaceholder: 'Elegí la carpeta destino',
      showCancelButton: true,
      confirmButtonText: 'Mover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91828'
    });
    const parentId = String(result.value || '').trim();
    if (!result.isConfirmed || !parentId) return;
    this.drive.mover(item.id, parentId).subscribe({
      next: () => {
        void this.aviso('success', 'Movido', `${item.name} quedó en la carpeta elegida.`);
        this.cargarItems(this.carpetaActual || undefined);
        if (this.busqueda.trim().length >= 2) this.buscarRemoto(this.busqueda.trim());
      },
      error: (err) => this.aviso('error', 'No se pudo mover', this.textoError(err, 'No se pudo mover. Probá de nuevo.'))
    });
  }

  public eliminar(item: DriveItem): void {
    void Swal.fire({
      title: `¿Eliminar ${item.name}?`,
      text: 'Se mueve a la papelera de Drive.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91828'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.drive.eliminar(item.id).subscribe({
        next: () => {
          if (this.editor?.item.id === item.id) {
            this.modificado = false;
            this.salirDelEditor();
          } else this.cargarItems(this.carpetaActual || undefined);
        },
        error: (err) => this.aviso('error', 'No se pudo eliminar', this.textoError(err, 'No se pudo eliminar. Puede que no tengas permiso para borrar.'))
      });
    });
  }

  public descargar(item: DriveItem): void {
    this.drive.descargar(item.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.aviso('error', 'No se pudo descargar', this.textoError(err, 'No se pudo descargar el archivo. Probá de nuevo.'))
    });
  }

  public guardarPlanilla(silencioso = false): Promise<boolean> {
    if (!this.editor || this.guardando) return Promise.resolve(false);
    const wb = XLSX.utils.book_new();
    this.hojas.forEach((hoja) => {
      const ws = hoja.cargada || !this.libro?.Sheets[hoja.name]
        ? this.sheetDesdeHoja(hoja)
        : this.libro.Sheets[hoja.name];
      XLSX.utils.book_append_sheet(wb, ws, hoja.name.slice(0, 31) || 'Hoja');
    });
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const file = new File(
      [buffer],
      this.editor.item.name.toLowerCase().endsWith('.xlsx') ? this.editor.item.name : `${this.editor.item.name}.xlsx`,
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    this.guardando = true;
    return new Promise((resolve) => {
      this.drive.guardarContenido(this.editor!.item.id, file).subscribe({
        next: () => {
          this.guardando = false;
          this.modificado = false;
          this.openedAt = new Date().toISOString();
          if (silencioso) this.mostrarAutoguardado();
          else void this.aviso('success', 'Guardado', 'La planilla quedó actualizada en Drive.');
          resolve(true);
        },
        error: (err) => {
          this.guardando = false;
          if (!silencioso) {
            void this.aviso('error', 'No se pudo guardar', this.textoError(err, 'No se pudo guardar la planilla. Probá de nuevo.'));
          }
          resolve(false);
        }
      });
    });
  }

  public guardarTexto(silencioso = false): Promise<boolean> {
    if (!this.editor || this.guardando) return Promise.resolve(false);
    const html = this.wordEditor?.getHtml() || this.texto;
    this.texto = html;
    const esWord = /\.docx?$/i.test(this.editor.item.name || '') || (this.editor.item.mimeType || '').includes('word');
    this.guardando = true;
    const request = esWord
      ? this.drive.guardarDocumento(this.editor.item.id, this.sanitizarHtml(html))
      : this.drive.guardarContenido(
          this.editor.item.id,
          new File([this.wordEditor?.getText() || html], this.editor.item.name, {
            type: this.editor.item.mimeType || 'text/plain'
          })
        );
    return new Promise((resolve) => {
      request.subscribe({
        next: () => {
          this.guardando = false;
          this.modificado = false;
          this.openedAt = new Date().toISOString();
          if (silencioso) this.mostrarAutoguardado();
          else void this.aviso('success', 'Guardado', 'El archivo quedó actualizado en Drive.');
          resolve(true);
        },
        error: (err) => {
          this.guardando = false;
          if (!silencioso) {
            void this.aviso('error', 'No se pudo guardar', this.textoError(err, 'No se pudo guardar el documento. Probá de nuevo.'));
          }
          resolve(false);
        }
      });
    });
  }

  public cargarPersonal(): void {
    this.profesoresService.obtenerProfesores().subscribe({
      next: (list) => {
        this.profesores = list || [];
      },
      error: () => {
        this.profesores = [];
      }
    });
  }

  private iniciarHeartbeat(): void {
    this.detenerHeartbeat();
    this.heartbeat = setInterval(() => this.registrarCierre(false, false), 45000);
    this.iniciarAutosave();
  }

  private detenerHeartbeat(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }
    this.detenerAutosave();
  }

  private iniciarAutosave(): void {
    this.detenerAutosave();
    this.autosaveTimer = setInterval(() => {
      void this.autoguardarSiCorresponde();
    }, AUTOSAVE_MS);
  }

  private detenerAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = undefined;
    }
  }

  private puedeAutoguardar(): boolean {
    if (!this.editor || !this.puedeEditar || !this.modificado || this.guardando) return false;
    if (this.editor.embedUrl) return false;
    return this.editor.kind === 'sheet' || this.editor.kind === 'text';
  }

  private async autoguardarSiCorresponde(): Promise<boolean> {
    if (!this.puedeAutoguardar() || !this.editor) return false;
    if (this.editor.kind === 'sheet') return this.guardarPlanilla(true);
    if (this.editor.kind === 'text') return this.guardarTexto(true);
    return false;
  }

  private async guardarEmergenciaPorInactividad(): Promise<void> {
    if (!this.puedeAutoguardar()) return;
    await this.autoguardarSiCorresponde();
  }

  private mostrarAutoguardado(): void {
    this.avisoAutoguardado = 'Autoguardado';
    this.cdr.markForCheck();
    if (this.avisoAutoguardadoTimer) clearTimeout(this.avisoAutoguardadoTimer);
    this.avisoAutoguardadoTimer = setTimeout(() => {
      this.avisoAutoguardado = '';
      this.cdr.markForCheck();
    }, 3500);
  }

  private marcarCambio(): void {
    if (!this.editor || !this.puedeEditar || this.editor.embedUrl) return;
    this.modificado = true;
    this.avisoAutoguardado = '';
  }

  private async resolverCambios(): Promise<boolean> {
    if (!this.modificado || !this.editor) return true;
    const result = await Swal.fire({
      title: 'Hay cambios sin guardar',
      text: 'Si salís ahora, se pierden los cambios de este archivo.',
      icon: 'warning',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      denyButtonText: 'Salir sin guardar',
      cancelButtonText: 'Seguir editando',
      confirmButtonColor: '#b91828',
      denyButtonColor: '#6b7280'
    });
    if (result.isConfirmed) {
      if (this.editor.kind === 'sheet' && !this.editor.embedUrl) return this.guardarPlanilla(true);
      if (this.editor.kind === 'text') return this.guardarTexto(true);
      this.modificado = false;
      return true;
    }
    if (result.isDenied) {
      this.modificado = false;
      return true;
    }
    return false;
  }

  private salirDelEditor(): void {
    this.modificado = false;
    this.limpiarEditor();
    this.cargarItems(this.carpetaActual || undefined);
  }

  private limpiarEditor(): void {
    this.registrarCierre();
    this.editor = null;
    this.hojas = [];
    this.hojaActiva = 0;
    this.libro = null;
    this.texto = '';
    this.modificado = false;
    this.avisoPlanilla = '';
    this.avisoAutoguardado = '';
  }

  private registrarCierre(sync = false, stop = true): void {
    const editor = this.editor;
    const openedAt = this.openedAt;
    if (stop) this.detenerHeartbeat();
    if (!editor) return;
    if (sync) this.drive.cerrarArchivoSync(editor.item.id, openedAt);
    else this.drive.cerrarArchivo(editor.item.id, openedAt).subscribe({ error: () => undefined });
    if (stop) this.openedAt = null;
  }

  private cargarPlanilla(item: DriveItem): void {
    this.loading = true;
    this.avisoPlanilla = '';
    this.hojas = [];
    this.drive.descargar(item.id).subscribe({
      next: (blob) => {
        void this.parsearPlanilla(blob);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        void this.aviso('error', 'No se pudo abrir la planilla', this.textoError(err, 'No se pudo abrir la planilla. Probá de nuevo.'));
      }
    });
  }

  private async parsearPlanilla(blob: Blob): Promise<void> {
    try {
      const buffer = await blob.arrayBuffer();
      await new Promise((resolve) => setTimeout(resolve, 0));
      let wb: XLSX.WorkBook;
      try {
        wb = XLSX.read(buffer, { type: 'array', cellStyles: true });
      } catch {
        wb = XLSX.read(buffer, { type: 'array' });
      }
      this.libro = wb;
      const nombres = wb.SheetNames?.length ? wb.SheetNames : ['Hoja1'];
      this.hojas = nombres.map((name) => ({ name, rows: [], cargada: false }));
      this.hojaActiva = 0;
      this.asegurarHoja(0);
    } catch (err) {
      console.error(err);
      this.libro = null;
      this.hojas = [{ name: 'Hoja1', rows: this.padGrid([]), cargada: true }];
      this.avisoPlanilla = 'No se pudo leer la planilla. Probá de nuevo.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private cargarTexto(item: DriveItem): void {
    this.loading = true;
    this.drive.descargar(item.id).subscribe({
      next: async (blob) => {
        this.texto = await blob.text();
        this.loading = false;
      },
      error: () => {
        this.texto = '';
        this.loading = false;
      }
    });
  }

  private padGrid(rows: CeldaHoja[][], minRows = 16, minCols = 8): CeldaHoja[][] {
    const cols = Math.max(minCols, ...rows.map((row) => row?.length || 0), 1);
    const next = (rows.length ? rows : [[celdaVacia()]]).map((row) =>
      Array.from({ length: cols }, (_, i) => (row?.[i] ? { ...celdaVacia(), ...row[i] } : celdaVacia()))
    );
    while (next.length < minRows) next.push(Array.from({ length: cols }, () => celdaVacia()));
    return next;
  }

  private filasDesdeSheet(ws: XLSX.WorkSheet): CeldaHoja[][] {
    const celdas = new Map<string, CeldaHoja>();
    let maxR = 0;
    let maxC = 0;
    Object.keys(ws || {}).forEach((key) => {
      if (!key || key.charAt(0) === '!') return;
      let addr: { r: number; c: number };
      try {
        addr = XLSX.utils.decode_cell(key);
      } catch {
        return;
      }
      maxR = Math.max(maxR, addr.r);
      maxC = Math.max(maxC, addr.c);
      celdas.set(`${addr.r}:${addr.c}`, this.celdaDesdeXlsx(ws[key]));
    });
    const rowCount = Math.max(maxR + 1, 16);
    const colCount = Math.max(maxC + 1, 8);
    const rows: CeldaHoja[][] = [];
    for (let r = 0; r < rowCount; r++) {
      const row: CeldaHoja[] = [];
      for (let c = 0; c < colCount; c++) {
        row.push(celdas.get(`${r}:${c}`) || celdaVacia());
      }
      rows.push(row);
    }
    return rows;
  }

  private celdaDesdeXlsx(cell: XLSX.CellObject | undefined): CeldaHoja {
    const base = celdaVacia();
    if (!cell) return base;
    const style = (cell as { s?: {
      font?: { bold?: boolean; italic?: boolean; underline?: boolean | object; name?: string; sz?: number; color?: { rgb?: string } };
      fill?: { fgColor?: { rgb?: string }; bgColor?: { rgb?: string } };
      alignment?: { horizontal?: string };
    } }).s || {};
    const font = style.font || {};
    const fill = style.fill || {};
    const alignment = style.alignment || {};
    const value = cell.w != null ? String(cell.w) : cell.v != null ? String(cell.v) : '';
    const fillColor = this.fromArgb(fill.fgColor?.rgb || fill.bgColor?.rgb);
    return {
      v: value,
      bold: !!font.bold,
      italic: !!font.italic,
      underline: !!font.underline,
      font: String(font.name || 'Arial'),
      size: Number(font.sz) || 11,
      color: this.fromArgb(font.color?.rgb) || '#000000',
      fill: fillColor === '#ffffff' ? '' : fillColor,
      align: alignment.horizontal === 'center' || alignment.horizontal === 'right' ? alignment.horizontal : 'left'
    };
  }

  private sheetDesdeHoja(hoja: HojaDrive): XLSX.WorkSheet {
    const ws: XLSX.WorkSheet = {};
    let maxR = 0;
    let maxC = 0;
    hoja.rows.forEach((row, r) => {
      row.forEach((celda, c) => {
        if (!this.celdaTieneDato(celda)) return;
        maxR = Math.max(maxR, r);
        maxC = Math.max(maxC, c);
        ws[XLSX.utils.encode_cell({ r, c })] = {
          v: celda.v,
          t: 's',
          s: {
            font: {
              name: celda.font,
              sz: celda.size,
              bold: celda.bold,
              italic: celda.italic,
              underline: celda.underline,
              color: { rgb: this.toArgb(celda.color || '#000000') }
            },
            fill: celda.fill
              ? { patternType: 'solid', fgColor: { rgb: this.toArgb(celda.fill) } }
              : undefined,
            alignment: { horizontal: celda.align, vertical: 'center', wrapText: true }
          }
        };
      });
    });
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(maxR, 0), c: Math.max(maxC, 0) } });
    return ws;
  }

  private celdaTieneDato(celda: CeldaHoja): boolean {
    return !!(
      celda.v ||
      celda.bold ||
      celda.italic ||
      celda.underline ||
      celda.fill ||
      celda.align !== 'left' ||
      celda.size !== 11 ||
      celda.font !== 'Arial' ||
      (celda.color && celda.color !== '#000000')
    );
  }

  private toArgb(hex: string): string {
    const raw = String(hex || '').replace('#', '');
    const full = raw.length === 3 ? raw.split('').map((ch) => ch + ch).join('') : raw.padStart(6, '0');
    return `FF${full.slice(-6).toUpperCase()}`;
  }

  private fromArgb(rgb?: string): string {
    if (!rgb) return '';
    let h = String(rgb).replace('#', '');
    if (h.length === 8) h = h.slice(-6);
    if (h.length === 6) return `#${h.toLowerCase()}`;
    return '';
  }

  private cargarRaices(): void {
    this.loading = true;
    this.drive.listarRaices().subscribe({
      next: (response) => {
        this.raices = response.carpetas || [];
        this.clientEmail = response.clientEmail || '';
        this.cargarItems();
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('info', 'Drive no vinculado', this.textoError(err, 'Cargá las credenciales en Configuración.'));
      }
    });
  }

  private limpiarPreviews(): void {
    Object.values(this.previews).forEach((url) => URL.revokeObjectURL(url));
    this.previews = {};
  }

  private cargarMiniaturas(items: DriveItem[], pedido: number): void {
    this.limpiarPreviews();
    for (const item of items) {
      if (item.isFolder || !item.hasThumbnail) continue;
      this.drive.miniatura(item.id).subscribe({
        next: (blob) => {
          if (pedido !== this.listadoPedido) return;
          if (!blob || (blob.type && blob.type.includes('json'))) return;
          this.previews = { ...this.previews, [item.id]: URL.createObjectURL(blob) };
        },
        error: () => undefined
      });
    }
  }

  private cargarItems(folderId?: string, reset = false): void {
    const pedido = ++this.listadoPedido;
    this.loading = true;
    if (reset) this.items = [];
    this.drive.listarItems(folderId).subscribe({
      next: (response) => {
        if (pedido !== this.listadoPedido) return;
        this.items = response.items || [];
        this.loading = false;
        this.cargarMiniaturas(this.items, pedido);
      },
      error: (err) => {
        if (pedido !== this.listadoPedido) return;
        this.loading = false;
        this.items = [];
        this.limpiarPreviews();
        void this.aviso('error', 'No se pudo listar', this.textoError(err, 'No se pudo listar Drive. Revisá que las carpetas sigan compartidas con el portal.'));
      }
    });
  }

  private async pedirNombre(title: string, fallback: string): Promise<string | null> {
    const result = await Swal.fire({
      title,
      input: 'text',
      inputValue: fallback,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91828'
    });
    const name = String(result.value || '').trim();
    if (!result.isConfirmed || !name) return null;
    return name;
  }

  private buscarRemoto(q: string): void {
    const pedido = ++this.buscarPedido;
    this.drive.buscar(q, this.carpetaActual).subscribe({
      next: (response) => {
        if (pedido !== this.buscarPedido) return;
        this.extrasBusqueda = response.items || [];
        this.cargarMiniaturas(this.extrasBusqueda, this.listadoPedido);
      },
      error: () => {
        if (pedido !== this.buscarPedido) return;
        this.extrasBusqueda = [];
      }
    });
  }

  private limpiarBusqueda(): void {
    this.busqueda = '';
    this.extrasBusqueda = [];
    if (this.buscarTimer) clearTimeout(this.buscarTimer);
  }

  private destinosMover(item: DriveItem): Array<{ id: string; name: string }> {
    const actual = item.parentId || this.carpetaActual || '';
    const seen = new Set<string>([item.id, actual]);
    const out: Array<{ id: string; name: string }> = [];
    const push = (id: string, name: string) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      out.push({ id, name });
    };
    this.raices.forEach((raiz) => push(raiz.id, raiz.name));
    this.items.filter((actualItem) => actualItem.isFolder).forEach((folder) => push(folder.id, folder.name));
    return out;
  }

  private sanitizarHtml(html: string): string {
    return String(html || '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '');
  }

  private textoError(err: unknown, fallback: string): string {
    const raw = String((err as { error?: { msj?: string } })?.error?.msj || '').trim();
    if (!raw) return fallback;
    if (/[áéíóúñ¿¡]/i.test(raw) && !/https?:\/\//i.test(raw)) return raw;
    if (/https?:\/\/|service account|storage quota|developers\.google|googleapis|leverage shared|oauth delegation/i.test(raw)) {
      return fallback;
    }
    return raw;
  }

  private aviso(icon: 'success' | 'error' | 'warning' | 'info', title: string, text: string): Promise<unknown> {
    return Swal.fire({ icon, title, text, confirmButtonColor: '#b91828' });
  }
}
