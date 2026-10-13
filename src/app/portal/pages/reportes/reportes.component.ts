import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Profesores } from '../tu-personal/profesor.interface';
import { ProfesoresService } from '../tu-personal/profesores.service';
import { ReportesResumen, ReporteRegistro } from './reportes.interface';
import { ReportesService } from './reportes.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit, OnDestroy {
  public vista: 'asistencia' | 'accion' = 'asistencia';
  public loading = false;
  public empleados: Profesores[] = [];
  public registros: ReporteRegistro[] = [];
  public resumen: ReportesResumen = {
    registrosDelDia: 0,
    primerIngreso: null,
    ultimoMovimiento: null,
    diasConActividad: 0,
    diasDelMes: 0,
    timeline: []
  };

  public empleadoSeleccionado: Profesores | null = null;
  public diaSeleccionado: number | null = null;
  public mesSeleccionado: number | null = null;
  public anioSeleccionado: number | null = null;

  public readonly meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];
  public dias: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  public anios: number[] = Array.from(
    { length: new Date().getFullYear() - 2024 + 1 },
    (_, i) => 2024 + i
  );

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private profesoresService: ProfesoresService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.diaSeleccionado = null;
    this.mesSeleccionado = today.getMonth() + 1;
    this.anioSeleccionado = today.getFullYear();
    this.cargarEmpleados();
  }

  public get filtroTitulo(): string {
    return this.vista === 'asistencia' ? 'Filtrar asistencias' : 'Filtrar acciones';
  }

  public get filtroSubtitulo(): string {
    return this.vista === 'asistencia'
      ? 'Combiná empleado y fecha para revisar ingresos y salidas del portal.'
      : 'Revisá movimientos por módulo, cambios de permisos y acciones del personal.';
  }

  public get historialTitulo(): string {
    return this.vista === 'asistencia' ? 'Historial de asistencias' : 'Historial de acciones';
  }

  public get timelineTitulo(): string {
    return this.vista === 'asistencia' ? 'Actividad del día' : 'Acciones del período';
  }

  public cambiarVista(vista: 'asistencia' | 'accion'): void {
    if (this.vista === vista) return;
    this.vista = vista;
    this.cargarDatos();
  }

  public aplicarFiltros(): void {
    this.cargarDatos();
  }

  public limpiarFiltros(): void {
    const today = new Date();
    this.empleadoSeleccionado = null;
    this.diaSeleccionado = null;
    this.mesSeleccionado = today.getMonth() + 1;
    this.anioSeleccionado = today.getFullYear();
    this.cargarDatos();
  }

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

  private cargarEmpleados(): void {
    this.loading = true;
    this.profesoresService
      .obtenerProfesores()
      .pipe(take(1))
      .subscribe({
        next: (empleados) => {
          this.empleados = empleados || [];
          this.cargarDatos();
        },
        error: () => {
          this.loading = false;
          void Swal.fire({
            icon: 'error',
            title: '¡Ups!',
            text: 'No se pudo cargar el personal',
            timer: 2500,
            showConfirmButton: false
          });
        }
      });
  }

  private cargarDatos(): void {
    this.loading = true;
    const filtro = {
      tipo: this.vista,
      documento: this.empleadoSeleccionado?.documento || null,
      dia: this.diaSeleccionado,
      mes: this.mesSeleccionado,
      anio: this.anioSeleccionado
    };

    forkJoin({
      registros: this.reportesService.obtenerReportes(filtro),
      resumen: this.reportesService.obtenerResumen(filtro)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ registros, resumen }) => {
          this.registros = registros || [];
          this.resumen = resumen;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          void Swal.fire({
            icon: 'error',
            title: '¡Ups!',
            text: 'No se pudieron cargar los reportes',
            timer: 2500,
            showConfirmButton: false
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
