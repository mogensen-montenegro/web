import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { firstValueFrom, forkJoin, Subject, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Profesores } from '../tu-personal/profesor.interface';
import { ProfesoresService } from '../tu-personal/profesores.service';
import { ReportesFiltrosComponent } from './reportes-filtros.component';
import { ReportesHeroComponent } from './reportes-hero.component';
import { ReportesHistorialComponent } from './reportes-historial.component';
import { descargarReportePdf } from './reportes-pdf';
import { ReportesPdfModalComponent } from './reportes-pdf-modal.component';
import { ReportesResumenComponent } from './reportes-resumen.component';
import { ReportesResumen, ReporteRegistro } from './reportes.interface';
import { ReportesService } from './reportes.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    ReportesHeroComponent,
    ReportesFiltrosComponent,
    ReportesResumenComponent,
    ReportesHistorialComponent,
    ReportesPdfModalComponent
  ],
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

  public exportAbierto = false;
  public exportSaliendo = false;
  public exportando = false;
  public exportAlcance: 'uno' | 'todos' = 'todos';
  public exportEmpleado: Profesores | null = null;
  public exportDesde = '';
  public exportHasta = '';

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
  private exportTimer: ReturnType<typeof setTimeout> | null = null;

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

  public abrirExportar(): void {
    if (this.exportTimer) {
      clearTimeout(this.exportTimer);
      this.exportTimer = null;
    }
    const today = new Date();
    const inicio = new Date(today.getFullYear(), today.getMonth(), 1);
    this.exportAlcance = 'todos';
    this.exportEmpleado = null;
    this.exportDesde = this.fechaInput(inicio);
    this.exportHasta = this.fechaInput(today);
    this.exportSaliendo = false;
    this.exportAbierto = true;
  }

  public cerrarExportar(): void {
    if (this.exportando) return;
    this.cerrarExportarAnimado();
  }

  public async generarPdf(): Promise<void> {
    if (!this.exportDesde || !this.exportHasta) {
      void this.aviso('warning', 'Elegí el rango', 'Indicá la fecha desde y la fecha hasta.');
      return;
    }
    if (this.exportDesde > this.exportHasta) {
      void this.aviso('warning', 'Rango inválido', 'La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }
    if (this.exportAlcance === 'uno' && !this.exportEmpleado) {
      void this.aviso('warning', 'Elegí un empleado', 'Seleccioná de quién querés el reporte.');
      return;
    }

    this.exportando = true;
    try {
      const registros = await this.traerRegistrosExport();
      if (!registros.length) {
        void this.aviso('info', 'Sin movimientos', 'No hay registros en ese rango para el alcance elegido.');
        return;
      }
      const alcance = this.exportAlcance === 'todos'
        ? 'Todos los empleados'
        : `${this.exportEmpleado?.nombre || ''} ${this.exportEmpleado?.apellido || ''}`.trim();
      descargarReportePdf({
        alcance,
        desde: this.exportDesde,
        hasta: this.exportHasta,
        registros
      });
      this.cerrarExportarAnimado();
      void this.aviso('success', 'PDF generado', `Se descargó el reporte de ${alcance}.`, 1800);
    } catch {
      void this.aviso('error', 'No se pudo generar el PDF', 'Probá de nuevo en unos minutos.');
    } finally {
      this.exportando = false;
    }
  }

  public limpiarFiltros(): void {
    const today = new Date();
    this.empleadoSeleccionado = null;
    this.diaSeleccionado = null;
    this.mesSeleccionado = today.getMonth() + 1;
    this.anioSeleccionado = today.getFullYear();
    this.cargarDatos();
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

  private async traerRegistrosExport(): Promise<ReporteRegistro[]> {
    const filtro = {
      documento: this.exportAlcance === 'uno' ? this.exportEmpleado?.documento || null : null,
      desde: this.exportDesde,
      hasta: this.exportHasta,
      limit: 200
    };
    const registros: ReporteRegistro[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await firstValueFrom(
        this.reportesService.obtenerReportesPagina({ ...filtro, page })
      );
      registros.push(...(response?.registros || []));
      totalPages = response?.totalPages || 1;
      page += 1;
    } while (page <= totalPages && page <= 50);
    return registros;
  }

  private cerrarExportarAnimado(): void {
    if (!this.exportAbierto || this.exportSaliendo) return;
    this.exportSaliendo = true;
    this.exportTimer = setTimeout(() => {
      this.exportAbierto = false;
      this.exportSaliendo = false;
      this.exportTimer = null;
    }, 200);
  }

  private aviso(
    icon: 'warning' | 'info' | 'success' | 'error',
    title: string,
    text: string,
    timer?: number
  ): Promise<unknown> {
    return Swal.fire({
      icon,
      title,
      text,
      timer,
      showConfirmButton: !timer,
      confirmButtonColor: '#b91828',
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = '4000';
      }
    });
  }

  private fechaInput(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  ngOnDestroy(): void {
    if (this.exportTimer) clearTimeout(this.exportTimer);
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
