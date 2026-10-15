import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profesores } from '../tu-personal/profesor.interface';

@Component({
  selector: 'app-reportes-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-filtros.component.html',
  styleUrls: ['./reportes-filtros.component.scss']
})
export class ReportesFiltrosComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() empleados: Profesores[] = [];
  @Input() empleado: Profesores | null = null;
  @Input() dia: number | null = null;
  @Input() mes: number | null = null;
  @Input() anio: number | null = null;
  @Input() dias: number[] = [];
  @Input() meses: { value: number; label: string }[] = [];
  @Input() anios: number[] = [];

  @Output() empleadoChange = new EventEmitter<Profesores | null>();
  @Output() diaChange = new EventEmitter<number | null>();
  @Output() mesChange = new EventEmitter<number | null>();
  @Output() anioChange = new EventEmitter<number | null>();
  @Output() aplicar = new EventEmitter<void>();
  @Output() limpiar = new EventEmitter<void>();
}
