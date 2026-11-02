import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DriveItem } from '../configuracion/configuracion.service';
import { DriveItemActionsComponent } from './drive-item-actions.component';
import { iconoDrive, tipoArchivo } from './drive.models';

@Component({
  selector: 'app-drive-file-card',
  standalone: true,
  imports: [CommonModule, DriveItemActionsComponent],
  templateUrl: './drive-file-card.component.html',
  styleUrls: ['./drive-file-card.component.scss']
})
export class DriveFileCardComponent {
  @Input() item!: DriveItem;
  @Input() preview = '';
  @Input() puedeEditar = false;
  @Input() puedeBorrar = false;
  @Input() esRaiz = false;
  @Output() abrir = new EventEmitter<DriveItem>();
  @Output() bajar = new EventEmitter<DriveItem>();
  @Output() renombrar = new EventEmitter<DriveItem>();
  @Output() mover = new EventEmitter<DriveItem>();
  @Output() borrar = new EventEmitter<DriveItem>();

  public get tipo() {
    return tipoArchivo(this.item);
  }

  public get icono() {
    return iconoDrive(this.item);
  }
}
