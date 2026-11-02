import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CeldaHoja, DRIVE_COLORES, DRIVE_FUENTES, HojaDrive, PaletaFmt, SeleccionHoja, celdaVacia } from './drive.models';

@Component({
  selector: 'app-drive-sheet-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drive-sheet-editor.component.html',
  styleUrls: ['./drive-sheet-editor.component.scss']
})
export class DriveSheetEditorComponent {
  @Input() hojas: HojaDrive[] = [];
  @Input() puedeEditar = false;
  @Output() changed = new EventEmitter<void>();

  public hojaActiva = 0;
  public paleta: PaletaFmt = null;
  public sel: SeleccionHoja | null = { r1: 0, c1: 0, r2: 0, c2: 0 };
  public readonly fuentes = DRIVE_FUENTES;
  public readonly colores = DRIVE_COLORES;
  private arrastrando = false;

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

  public activarHoja(index: number): void {
    this.hojaActiva = index;
    this.sel = { r1: 0, c1: 0, r2: 0, c2: 0 };
    this.paleta = null;
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
