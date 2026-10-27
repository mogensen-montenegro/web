import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import {
  ConfiguracionService,
  DriveEditorKind,
  DriveFolder,
  DriveItem
} from '../configuracion/configuracion.service';
import { LoginService } from '../login/login-core/login.service';
import { ModalPermisosProfesorComponent } from '../tu-personal/modal-permisos-profesor/modal-permisos-profesor.component';
import { Profesores } from '../tu-personal/profesor.interface';
import { ProfesorPermisosService } from '../tu-personal/profesor-permisos.service';
import { ProfesoresService } from '../tu-personal/profesores.service';

interface DriveEditor {
  item: DriveItem;
  kind: DriveEditorKind;
  embedUrl: SafeResourceUrl | null;
  editUrl: string | null;
}

@Component({
  selector: 'app-drive-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalPermisosProfesorComponent],
  templateUrl: './drive-explorer.component.html',
  styleUrls: ['./drive-explorer.component.scss']
})
export class DriveExplorerComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  public loading = false;
  public guardando = false;
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
  public hojas: Array<{ name: string; rows: string[][] }> = [];
  public hojaActiva = 0;
  public texto = '';
  private openedAt: string | null = null;
  private heartbeat?: ReturnType<typeof setInterval>;

  constructor(
    private drive: ConfiguracionService,
    private loginService: LoginService,
    private permisos: ProfesorPermisosService,
    private profesoresService: ProfesoresService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.puedeEditar = this.loginService.hasRole(['superuser', 'personal']);
    this.puedeBorrar = this.permisos.canDeleteDrive();
    this.puedeAsignar = this.loginService.hasRole(['superuser', 'admin']);
    this.esSuperuser = this.loginService.hasRole(['superuser']);
    this.cargarRaices();
    if (this.puedeAsignar) this.cargarPersonal();
  }

  ngOnDestroy(): void {
    this.registrarCierre(true);
  }

  @HostListener('window:beforeunload')
  public onBeforeUnload(): void {
    this.registrarCierre(true);
  }

  public get tituloActual(): string {
    if (this.editor) return this.editor.item.name;
    if (!this.ruta.length) return 'Carpetas vinculadas';
    return this.ruta[this.ruta.length - 1].name;
  }

  public get filas(): string[][] {
    return this.hojas[this.hojaActiva]?.rows || [];
  }

  public get columnas(): string[] {
    const count = this.filas[0]?.length || 0;
    return Array.from({ length: count }, (_, i) => this.columna(i));
  }

  public irAConfig(): void {
    void this.router.navigateByUrl('/panel/configuracion');
  }

  public abrirPermisos(): void {
    this.showPermisos = true;
  }

  public tipoArchivo(item: DriveItem): 'folder' | 'word' | 'sheet' | 'slides' | 'file' {
    if (item.isFolder) return 'folder';
    const mime = item.mimeType || '';
    const name = item.name || '';
    if (mime.includes('spreadsheet') || mime.includes('excel') || /\.xlsx?$/i.test(name) || /\.csv$/i.test(name)) {
      return 'sheet';
    }
    if (mime.includes('presentation') || mime.includes('powerpoint') || /\.pptx?$/i.test(name)) {
      return 'slides';
    }
    if (mime.includes('document') || mime.includes('word') || /\.docx?$/i.test(name)) {
      return 'word';
    }
    return 'file';
  }

  public icono(item: DriveItem): string {
    const tipo = this.tipoArchivo(item);
    if (tipo === 'folder') return 'fa-folder';
    if (tipo === 'sheet') return 'fa-file-excel';
    if (tipo === 'slides') return 'fa-file-powerpoint';
    if (tipo === 'word') return 'fa-file-word';
    const mime = item.mimeType || '';
    const name = item.name || '';
    if (mime.includes('pdf') || /\.pdf$/i.test(name)) return 'fa-file-pdf';
    if (mime.startsWith('image/')) return 'fa-file-image';
    return 'fa-file-lines';
  }

  public abrir(item: DriveItem): void {
    if (item.isFolder) {
      this.drive.abrirArchivo(item.id).subscribe({ error: () => undefined });
      this.ruta = [...this.ruta, { id: item.id, name: item.name }];
      this.carpetaActual = item.id;
      this.cargarItems(item.id);
      return;
    }
    this.loading = true;
    this.drive.abrirArchivo(item.id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.kind === 'folder') {
          this.ruta = [...this.ruta, { id: response.item.id, name: response.item.name }];
          this.carpetaActual = response.item.id;
          this.cargarItems(response.item.id);
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
        if (response.kind === 'text') this.cargarTexto(response.item);
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo abrir', err?.error?.msj || 'Probá de nuevo.');
      }
    });
  }

  public cerrarEditor(): void {
    this.registrarCierre();
    this.editor = null;
    this.hojas = [];
    this.hojaActiva = 0;
    this.texto = '';
    this.cargarItems(this.carpetaActual || undefined);
  }

  public trabajarAfuera(): void {
    if (this.editor?.editUrl) window.open(this.editor.editUrl, '_blank', 'noopener');
  }

  public irA(index: number): void {
    if (this.editor) this.cerrarEditor();
    if (index < 0) {
      this.ruta = [];
      this.carpetaActual = null;
      this.cargarItems();
      return;
    }
    this.ruta = this.ruta.slice(0, index + 1);
    this.carpetaActual = this.ruta[this.ruta.length - 1].id;
    this.cargarItems(this.carpetaActual);
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
      error: (err) => this.aviso('error', 'No se pudo crear', err?.error?.msj || 'Probá de nuevo.')
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
        void this.aviso('error', 'No se pudo crear', err?.error?.msj || 'Probá de nuevo.');
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
    this.loading = true;
    this.drive.crearPlanilla(this.carpetaActual, name).subscribe({
      next: (response) => {
        this.loading = false;
        this.cargarItems(this.carpetaActual || undefined);
        this.abrir(response.item);
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo crear', err?.error?.msj || 'Probá de nuevo.');
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
        void this.aviso('error', 'No se pudo crear', err?.error?.msj || 'Probá de nuevo.');
      }
    });
  }

  public elegirArchivo(): void {
    if (!this.carpetaActual) {
      void this.aviso('warning', 'Elegí una carpeta', 'Entrá a una carpeta vinculada para subir archivos.');
      return;
    }
    this.fileInput?.nativeElement.click();
  }

  public onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.carpetaActual) return;
    this.loading = true;
    this.drive.subirArchivo(this.carpetaActual, file).subscribe({
      next: () => {
        this.loading = false;
        this.cargarItems(this.carpetaActual || undefined);
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo subir', err?.error?.msj || 'El archivo no puede superar 25 MB.');
      }
    });
  }

  public async renombrar(item: DriveItem, event: Event): Promise<void> {
    event.stopPropagation();
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
      error: (err) => this.aviso('error', 'No se pudo renombrar', err?.error?.msj || 'Probá de nuevo.')
    });
  }

  public eliminar(item: DriveItem, event?: Event): void {
    event?.stopPropagation();
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
          if (this.editor?.item.id === item.id) this.cerrarEditor();
          else this.cargarItems(this.carpetaActual || undefined);
        },
        error: (err) => this.aviso('error', 'No se pudo eliminar', err?.error?.msj || 'No tenés permiso para borrar.')
      });
    });
  }

  public descargar(item: DriveItem, event?: Event): void {
    event?.stopPropagation();
    this.drive.descargar(item.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.aviso('error', 'No se pudo descargar', err?.error?.msj || 'Probá de nuevo.')
    });
  }

  public onCell(row: number, col: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!this.hojas[this.hojaActiva]) return;
    this.hojas[this.hojaActiva].rows[row][col] = value;
  }

  public agregarFila(): void {
    const cols = this.filas[0]?.length || 8;
    this.hojas[this.hojaActiva].rows = [...this.filas, Array(cols).fill('')];
  }

  public agregarColumna(): void {
    this.hojas[this.hojaActiva].rows = this.filas.map((row) => [...row, '']);
  }

  public guardarPlanilla(): void {
    if (!this.editor) return;
    const wb = XLSX.utils.book_new();
    this.hojas.forEach((hoja) => {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hoja.rows), hoja.name.slice(0, 31) || 'Hoja');
    });
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File(
      [buffer],
      this.editor.item.name.toLowerCase().endsWith('.xlsx') ? this.editor.item.name : `${this.editor.item.name}.xlsx`,
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    this.guardando = true;
    this.drive.guardarContenido(this.editor.item.id, file).subscribe({
      next: () => {
        this.guardando = false;
        this.openedAt = new Date().toISOString();
        void this.aviso('success', 'Guardado', 'La planilla quedó actualizada en Drive.');
      },
      error: (err) => {
        this.guardando = false;
        void this.aviso('error', 'No se pudo guardar', err?.error?.msj || 'Probá de nuevo.');
      }
    });
  }

  public guardarTexto(): void {
    if (!this.editor) return;
    const file = new File([this.texto], this.editor.item.name, {
      type: this.editor.item.mimeType || 'text/plain'
    });
    this.guardando = true;
    this.drive.guardarContenido(this.editor.item.id, file).subscribe({
      next: () => {
        this.guardando = false;
        this.openedAt = new Date().toISOString();
        void this.aviso('success', 'Guardado', 'El archivo quedó actualizado.');
      },
      error: (err) => {
        this.guardando = false;
        void this.aviso('error', 'No se pudo guardar', err?.error?.msj || 'Probá de nuevo.');
      }
    });
  }

  public peso(item: DriveItem): string {
    if (item.isFolder || !item.size) return '—';
    if (item.size < 1024) return `${item.size} B`;
    if (item.size < 1024 * 1024) return `${Math.round(item.size / 1024)} KB`;
    return `${(item.size / (1024 * 1024)).toFixed(1)} MB`;
  }

  public columna(index: number): string {
    let n = index + 1;
    let label = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      label = String.fromCharCode(65 + rem) + label;
      n = Math.floor((n - 1) / 26);
    }
    return label;
  }

  private iniciarHeartbeat(): void {
    this.detenerHeartbeat();
    this.heartbeat = setInterval(() => this.registrarCierre(false, false), 45000);
  }

  private detenerHeartbeat(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }
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
    this.drive.descargar(item.id).subscribe({
      next: async (blob) => {
        const buffer = await blob.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        this.hojas = wb.SheetNames.map((name) => ({
          name,
          rows: this.padGrid(XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false }) as string[][])
        }));
        this.hojaActiva = 0;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        void this.aviso('error', 'No se pudo abrir la planilla', err?.error?.msj || 'Probá de nuevo.');
      }
    });
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

  private padGrid(rows: string[][], minRows = 16, minCols = 8): string[][] {
    const cols = Math.max(minCols, ...rows.map((row) => row?.length || 0), 1);
    const next = (rows.length ? rows : [['']]).map((row) => {
      const cells = Array.from({ length: cols }, (_, i) => (row?.[i] == null ? '' : String(row[i])));
      return cells;
    });
    while (next.length < minRows) next.push(Array(cols).fill(''));
    return next;
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
        void this.aviso('info', 'Drive no vinculado', err?.error?.msj || 'Cargá las credenciales en Configuración.');
      }
    });
  }

  private cargarItems(folderId?: string): void {
    this.loading = true;
    this.drive.listarItems(folderId).subscribe({
      next: (response) => {
        this.items = response.items || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.items = [];
        void this.aviso('error', 'No se pudo listar', err?.error?.msj || 'Revisá el vínculo con Drive.');
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

  private aviso(icon: 'success' | 'error' | 'warning' | 'info', title: string, text: string): Promise<unknown> {
    return Swal.fire({ icon, title, text, confirmButtonColor: '#b91828' });
  }
}
