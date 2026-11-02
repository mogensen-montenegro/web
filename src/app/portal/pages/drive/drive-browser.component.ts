import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DriveItem } from '../configuracion/configuracion.service';
import { DriveFileCardComponent } from './drive-file-card.component';
import { DriveItemActionsComponent } from './drive-item-actions.component';
import { fechaDrive, iconoDrive, pesoDrive, tipoArchivo } from './drive.models';

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

  public esRaiz(item: DriveItem): boolean {
    return this.raicesIds.includes(item.id);
  }

  public abrirFileInput(): void {
    this.fileInput?.nativeElement.click();
  }
}
