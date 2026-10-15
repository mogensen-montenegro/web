import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profesores } from '../tu-personal/profesor.interface';

@Component({
  selector: 'app-reportes-pdf-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-pdf-modal.component.html',
  styleUrls: ['./reportes-pdf-modal.component.scss']
})
export class ReportesPdfModalComponent {
  @Input() abierto = false;
  @Input() saliendo = false;
  @Input() exportando = false;
  @Input() empleados: Profesores[] = [];
  @Input() alcance: 'uno' | 'todos' = 'todos';
  @Input() empleado: Profesores | null = null;
  @Input() desde = '';
  @Input() hasta = '';

  @Output() alcanceChange = new EventEmitter<'uno' | 'todos'>();
  @Output() empleadoChange = new EventEmitter<Profesores | null>();
  @Output() desdeChange = new EventEmitter<string>();
  @Output() hastaChange = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() generar = new EventEmitter<void>();
}
