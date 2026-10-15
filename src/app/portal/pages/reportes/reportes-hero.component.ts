import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-reportes-hero',
  standalone: true,
  templateUrl: './reportes-hero.component.html',
  styleUrls: ['./reportes-hero.component.scss']
})
export class ReportesHeroComponent {
  @Input() vista: 'asistencia' | 'accion' = 'asistencia';
  @Output() vistaChange = new EventEmitter<'asistencia' | 'accion'>();
  @Output() exportar = new EventEmitter<void>();
}
