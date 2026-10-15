import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReporteRegistro } from './reportes.interface';

@Component({
  selector: 'app-reportes-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes-historial.component.html',
  styleUrls: ['./reportes-historial.component.scss']
})
export class ReportesHistorialComponent {
  @Input() vista: 'asistencia' | 'accion' = 'asistencia';
  @Input() titulo = '';
  @Input() tituloTimeline = '';
  @Input() registros: ReporteRegistro[] = [];
  @Input() timeline: ReporteRegistro[] = [];

  public nombreEmpleado(item: ReporteRegistro): string {
    return item.nombre?.trim() || item.user || item.documento || '-';
  }

  public estadoLabel(item: ReporteRegistro): string {
    if (item.estado) return item.estado;
    if (/inactividad/i.test(item.detalle || '')) return 'Inactividad';
    if (/reconex/i.test(item.detalle || '')) return 'Reconexión';
    return 'Correcto';
  }

  public estadoClass(item: ReporteRegistro): string {
    const estado = this.estadoLabel(item).toLowerCase();
    if (estado.includes('inactiv')) return 'is-warning';
    if (estado.includes('reconex')) return 'is-info';
    return 'is-ok';
  }
}
