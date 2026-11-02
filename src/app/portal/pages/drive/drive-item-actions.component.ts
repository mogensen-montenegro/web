import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DriveItem } from '../configuracion/configuracion.service';

@Component({
  selector: 'app-drive-item-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drive-item-actions.component.html',
  styleUrls: ['./drive-item-actions.component.scss']
})
export class DriveItemActionsComponent {
  @Input() item!: DriveItem;
  @Input() puedeEditar = false;
  @Input() puedeBorrar = false;
  @Input() esRaiz = false;
  @Input() compact = false;
  @Output() bajar = new EventEmitter<DriveItem>();
  @Output() renombrar = new EventEmitter<DriveItem>();
  @Output() mover = new EventEmitter<DriveItem>();
  @Output() borrar = new EventEmitter<DriveItem>();
}
