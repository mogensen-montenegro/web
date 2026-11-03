import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DriveItem } from '../configuracion/configuracion.service';
import { DriveFileCardComponent } from './drive-file-card.component';
import { DriveItemActionsComponent } from './drive-item-actions.component';
import { fechaDrive, iconoDrive, pesoDrive, tipoArchivo } from './drive.models';

type DriveSortKey = 'name' | 'modified' | 'size';
type DriveSortDir = 'asc' | 'desc';

@Component({
  selector: 'app-drive-browser',
  standalone: true,
  imports: [CommonModule, DriveFileCardComponent, DriveItemActionsComponent],
  templateUrl: './drive-browser.component.html',
  styleUrls: ['./drive-browser.component.scss']
})
export class DriveBrowserComponent {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @Input() loading = false;
  @Input() vista: 'grid' | 'list' = 'list';
  @Input() busqueda = '';
  @Input() tituloActual = '';
  @Input() carpetaActual: string | null = null;
  @Input() hayRaices = false;
  @Input() puedeEditar = false;
  @Input() puedeBorrar = false;
  @Input() visibles: DriveItem[] = [];
  @Input() carpetas: DriveItem[] = [];
  @Input() archivos: DriveItem[] = [];
  @Input() previews: Record<string, string> = {};
  @Input() raicesIds: string[] = [];
  @Output() nuevoDocumento = new EventEmitter<void>();
  @Output() nuevaPlanilla = new EventEmitter<void>();
  @Output() nuevaPresentacion = new EventEmitter<void>();
  @Output() nuevaCarpeta = new EventEmitter<void>();
  @Output() archivo = new EventEmitter<Event>();
  @Output() abrir = new EventEmitter<DriveItem>();
  @Output() bajar = new EventEmitter<DriveItem>();
  @Output() renombrar = new EventEmitter<DriveItem>();
  @Output() mover = new EventEmitter<DriveItem>();
  @Output() borrar = new EventEmitter<DriveItem>();

  public tipo = tipoArchivo;
  public icono = iconoDrive;
  public fecha = fechaDrive;
  public peso = pesoDrive;
  public sortKey: DriveSortKey = 'name';
  public sortDir: DriveSortDir = 'asc';

  public get visiblesOrdenados(): DriveItem[] {
    return this.ordenar(this.visibles);
  }

  public get carpetasOrdenadas(): DriveItem[] {
    return this.ordenar(this.carpetas);
  }

  public get archivosOrdenados(): DriveItem[] {
    return this.ordenar(this.archivos);
  }

  public esRaiz(item: DriveItem): boolean {
    return this.raicesIds.includes(item.id);
  }

  public abrirFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  public ordenarPor(key: DriveSortKey): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      return;
    }
    this.sortKey = key;
    this.sortDir = key === 'name' ? 'asc' : 'desc';
  }

  public ariaSort(key: DriveSortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey !== key) return 'none';
    return this.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  private ordenar(items: DriveItem[]): DriveItem[] {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...(items || [])].sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      const cmp = this.comparar(a, b);
      if (cmp !== 0) return cmp * dir;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true });
    });
  }

  private comparar(a: DriveItem, b: DriveItem): number {
    if (this.sortKey === 'name') {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true });
    }
    if (this.sortKey === 'modified') {
      const ta = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
      const tb = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
      return ta - tb;
    }
    return (a.size || 0) - (b.size || 0);
  }
}
