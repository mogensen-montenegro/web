import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CeldaHoja, DRIVE_COLORES, DRIVE_FUENTES, HojaDrive, PaletaFmt, SeleccionHoja, celdaVacia } from './drive.models';

const ALTO_FILA = 34;
const FILAS_VENTANA = 42;

@Component({
  selector: 'app-drive-sheet-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drive-sheet-editor.component.html',
  styleUrls: ['./drive-sheet-editor.component.scss']
})
export class DriveSheetEditorComponent implements OnChanges {
  @Input() hojas: HojaDrive[] = [];
  @Input() puedeEditar = false;
  @Input() cargando = false;
  @Input() aviso = '';
  @Input() hojaActiva = 0;
  @Output() changed = new EventEmitter<void>();
  @Output() hojaChange = new EventEmitter<number>();
  public busquedaHoja = '';
  public filaInicio = 0;
  public paleta: PaletaFmt = null;
  public sel: SeleccionHoja | null = { r1: 0, c1: 0, r2: 0, c2: 0 };
  public readonly fuentes = DRIVE_FUENTES;
  public readonly colores = DRIVE_COLORES;
  private arrastrando = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hojaActiva']) {
      this.filaInicio = 0;
      this.sel = { r1: 0, c1: 0, r2: 0, c2: 0 };
    }
  }

  public get filas(): CeldaHoja[][] {
    return this.hojas[this.hojaActiva]?.rows || [];
  }

  public get columnas(): string[] {
    const count = this.filas[0]?.length || 0;
    return Array.from({ length: count }, (_, i) => this.columna(i));
  }

  public get estiloCelda(): CeldaHoja {
    return this.celdasSeleccionadas()[0] || celdaVacia();
  }

  public get hojasFiltradas(): Array<{ hoja: HojaDrive; index: number }> {
    const q = this.normalizar(this.busquedaHoja);
    return this.hojas
      .map((hoja, index) => ({ hoja, index }))
      .filter((item) => !q || this.normalizar(item.hoja.name).includes(q));
  }

  public get filasVisibles(): Array<{ row: CeldaHoja[]; r: number }> {
    const start = this.filaInicio;
    const end = Math.min(this.filas.length, start + FILAS_VENTANA);
    const out: Array<{ row: CeldaHoja[]; r: number }> = [];
    for (let r = start; r < end; r++) out.push({ row: this.filas[r], r });
    return out;
  }

  public get padTop(): number {
    return this.filaInicio * ALTO_FILA;
  }

  public get padBottom(): number {
    return Math.max(0, (this.filas.length - this.filaInicio - this.filasVisibles.length) * ALTO_FILA);
  }

  @HostListener('document:mouseup')
  public onMouseUp(): void {
    this.arrastrando = false;
  }

  @HostListener('document:click', ['$event'])
  public onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.drive-fmt__swatch')) this.paleta = null;
  }

  @HostListener('document:keydown', ['$event'])
  public onDocKey(event: KeyboardEvent): void {
    if (!this.puedeEditar) return;
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === 'b') {
      event.preventDefault();
      this.toggleEstiloHoja('bold');
    } else if (key === 'i') {
      event.preventDefault();
      this.toggleEstiloHoja('italic');
    } else if (key === 'u') {
      event.preventDefault();
      this.toggleEstiloHoja('underline');
    }
  }

  public onBusquedaHoja(value: string): void {
    this.busquedaHoja = value;
    const visibles = this.hojasFiltradas;
    if (!visibles.length) return;
    if (!visibles.some((item) => item.index === this.hojaActiva)) this.activarHoja(visibles[0].index);
  }

  public activarHoja(index: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (index === this.hojaActiva) return;
    this.filaInicio = 0;
    this.sel = { r1: 0, c1: 0, r2: 0, c2: 0 };
    this.paleta = null;
    this.hojaChange.emit(index);
  }

  public trackHoja(_: number, item: { index: number }): number {
    return item.index;
  }

  public onScroll(event: Event): void {
    const wrap = event.target as HTMLElement;
    this.filaInicio = Math.max(0, Math.floor(wrap.scrollTop / ALTO_FILA) - 6);
  }

  public esSeleccionada(row: number, col: number): boolean {
    if (!this.sel) return false;
    const r1 = Math.min(this.sel.r1, this.sel.r2);
    const r2 = Math.max(this.sel.r1, this.sel.r2);
    const c1 = Math.min(this.sel.c1, this.sel.c2);
    const c2 = Math.max(this.sel.c1, this.sel.c2);
    return row >= r1 && row <= r2 && col >= c1 && col <= c2;
  }

  public iniciarSeleccion(row: number, col: number, event: MouseEvent | FocusEvent): void {
    this.paleta = null;
    if (event instanceof MouseEvent && event.shiftKey && this.sel) {
      this.sel = { ...this.sel, r2: row, c2: col };
      return;
    }
    if (event instanceof FocusEvent && this.arrastrando) return;
    this.sel = { r1: row, c1: col, r2: row, c2: col };
    this.arrastrando = event instanceof MouseEvent && event.button === 0;
  }

  public extenderSeleccion(row: number, col: number): void {
    if (!this.arrastrando || !this.sel) return;
    this.sel = { ...this.sel, r2: row, c2: col };
  }

  public agregarFila(): void {
    const cols = this.filas[0]?.length || 8;
    this.hojas[this.hojaActiva].rows = [...this.filas, Array.from({ length: cols }, () => celdaVacia())];
    this.changed.emit();
  }

  public agregarColumna(): void {
    this.hojas[this.hojaActiva].rows = this.filas.map((row) => [...row, celdaVacia()]);
    this.changed.emit();
  }

  public cambiarValorCelda(celda: CeldaHoja, value: string): void {
    if (celda.v === value) return;
    celda.v = value;
    this.changed.emit();
  }

  public togglePaleta(tipo: Exclude<PaletaFmt, null>, event: Event): void {
    event.stopPropagation();
    this.paleta = this.paleta === tipo ? null : tipo;
  }

  public aplicarEstiloHoja(patch: Partial<CeldaHoja>): void {
    this.celdasSeleccionadas().forEach((celda) => Object.assign(celda, patch));
    this.paleta = null;
    this.changed.emit();
  }

  public toggleEstiloHoja(clave: 'bold' | 'italic' | 'underline'): void {
    const celdas = this.celdasSeleccionadas();
    const next = !celdas.every((celda) => celda[clave]);
    celdas.forEach((celda) => {
      celda[clave] = next;
    });
    this.changed.emit();
  }

  public cambiarTamanioHoja(delta: number): void {
    const size = Math.min(72, Math.max(8, (this.estiloCelda.size || 11) + delta));
    this.aplicarEstiloHoja({ size });
  }

  public setTamanioHoja(value: string | number): void {
    const size = Math.min(72, Math.max(8, Number(value) || 11));
    this.aplicarEstiloHoja({ size });
  }

  public trackFila(_: number, item: { r: number }): string {
    return `${this.hojaActiva}:${item.r}`;
  }

  private normalizar(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private columna(index: number): string {
    let n = index + 1;
    let label = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      label = String.fromCharCode(65 + rem) + label;
      n = Math.floor((n - 1) / 26);
    }
    return label;
  }

  private celdasSeleccionadas(): CeldaHoja[] {
    if (!this.sel) return [];
    const r1 = Math.min(this.sel.r1, this.sel.r2);
    const r2 = Math.max(this.sel.r1, this.sel.r2);
    const c1 = Math.min(this.sel.c1, this.sel.c2);
    const c2 = Math.max(this.sel.c1, this.sel.c2);
    const out: CeldaHoja[] = [];
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const celda = this.filas[r]?.[c];
        if (celda) out.push(celda);
      }
    }
    return out;
  }
}
