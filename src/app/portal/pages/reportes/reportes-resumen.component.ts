import { Component, Input } from '@angular/core';
import { ReportesResumen } from './reportes.interface';

@Component({
  selector: 'app-reportes-resumen',
  standalone: true,
  templateUrl: './reportes-resumen.component.html',
  styleUrls: ['./reportes-resumen.component.scss']
})
export class ReportesResumenComponent {
  @Input() resumen: ReportesResumen = {
    registrosDelDia: 0,
    primerIngreso: null,
    ultimoMovimiento: null,
    diasConActividad: 0,
    diasDelMes: 0,
    timeline: []
  };
}
