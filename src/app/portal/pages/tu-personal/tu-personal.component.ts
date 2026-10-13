import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { DatoPersonal, Profesores } from './profesor.interface';
import { ProfesoresService } from './profesores.service';

@Component({
  selector: 'app-tu-personal',
  templateUrl: './tu-personal.component.html',
  styleUrls: ['./tu-personal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class TuPersonalComponent implements OnDestroy {
  public showLoading = false;
  public profesores: Profesores[] = [];
  public profesor: Profesores | null = null;
  public registroDatos: DatoPersonal[] = [];
  public copiaRegistroDatos: DatoPersonal[] = [];
  public showFechaFiltro = false;
  public profesorSeleccionado = false;
  public fechaSeleccionada: string | null = null;
  public fechaModel = '';
  public moduloSeleccionado: string | null = null;
  public diaSeleccionado: string | null = null;
  public mesSeleccionado: string | null = null;
  public anioSeleccionado: string | null = null;
  public fechaIndividualSeleccionada = false;
  public paginaActual = 1;
  public limit = 100;
  public totalPaginas = 0;
  public modulos = [
    'Tu Personal',
    'Administradores',
    'Consorcios',
    'Carga de Archivos',
    'Generador de recibos',
    'Noticia',
    'Plantillas de Email',
    'Prospectos'
  ];
  public anios: string[] = Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => (2024 + i).toString());
  public meses: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  public dias: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  private dniProfesorSeleccionado = '';
  private destroy$ = new Subject<void>();

  constructor(private profesoresService: ProfesoresService, private router: Router) {
    this.obtenerProfesores();
  }

  public goToPanelProfesor(): void {
    void this.router.navigateByUrl('/panel/agregar-profesor/panel-profesor');
  }

  public onProfesorSeleccionado(profesor: Profesores): void {
    if (!profesor?.documento) return;
    this.showLoading = true;
    this.dniProfesorSeleccionado = profesor.documento;
    this.profesoresService.obtenerDatosProfesor(profesor.documento, 1, this.limit).pipe(takeUntil(this.destroy$)).subscribe({
      next: (datos) => {
        this.registroDatos = datos.registros || [];
        this.copiaRegistroDatos = [...this.registroDatos];
        this.showFechaFiltro = true;
        this.profesorSeleccionado = true;
        this.paginaActual = 1;
        this.totalPaginas = datos.totalPages || Math.ceil((Number(datos.total) || 0) / this.limit);
        this.showLoading = false;
      },
      error: () => {
        this.showLoading = false;
        void Swal.fire({
          icon: 'error',
          title: '¡Ups!',
          text: 'No se pudo cargar los registros del personal.',
          timer: 2500,
          showConfirmButton: false
        });
      }
    });
  }

  public onFechaCalendario(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fechaModel = value;
    if (!value) {
      this.fechaSeleccionada = null;
      this.aplicarFiltrosCombinados();
      return;
    }
    const [anio, mes, dia] = value.split('-');
    this.fechaSeleccionada = `${dia}-${mes}-${anio}`;
    this.aplicarFiltrosCombinados();
  }

  public cancelarFecha(): void {
    this.fechaIndividualSeleccionada = false;
    this.diaSeleccionado = null;
    this.mesSeleccionado = null;
    this.anioSeleccionado = null;
    this.fechaSeleccionada = null;
    this.fechaModel = '';
    this.aplicarFiltrosCombinados();
  }

  public cancelarModulo(): void {
    this.moduloSeleccionado = null;
    this.aplicarFiltrosCombinados();
  }

  public onFechaSeleccionadaIndividual(): void {
    this.fechaIndividualSeleccionada = !!(this.diaSeleccionado || this.mesSeleccionado || this.anioSeleccionado);
    this.aplicarFiltrosCombinadosIndividual();
  }

  public filtrarPorModulo(): void {
    this.aplicarFiltrosCombinados();
  }

  private aplicarFiltrosCombinados(): void {
    this.copiaRegistroDatos = this.registroDatos.filter((dato) => {
      const coincideFecha = !this.fechaSeleccionada || dato.fechaDeRegistro === this.fechaSeleccionada;
      const coincideModulo = !this.moduloSeleccionado || dato.moduloModificacion === this.moduloSeleccionado;
      return coincideFecha && coincideModulo;
    });
  }

  private aplicarFiltrosCombinadosIndividual(): void {
    this.copiaRegistroDatos = this.registroDatos.filter((dato) => {
      const [dia, mes, anio] = (dato.fechaDeRegistro || '').split('-');
      const coincideDia = !this.diaSeleccionado || String(this.diaSeleccionado).padStart(2, '0') === dia;
      const coincideMes = !this.mesSeleccionado || String(this.mesSeleccionado).padStart(2, '0') === mes;
      const coincideAnio = !this.anioSeleccionado || this.anioSeleccionado === anio;
      return coincideDia && coincideMes && coincideAnio;
    });
  }

  public cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.showLoading = true;
    this.paginaActual = pagina;
    this.profesoresService
      .obtenerDatosProfesor(this.dniProfesorSeleccionado, pagina, this.limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datos) => {
          this.registroDatos = datos.registros || [];
          this.copiaRegistroDatos = [...this.registroDatos];
          this.totalPaginas = datos.totalPages || Math.ceil((Number(datos.total) || 0) / this.limit);
          this.showLoading = false;
        },
        error: () => {
          this.showLoading = false;
        }
      });
  }

  public obtenerPaginasVisibles(): (number | string)[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const visibles: (number | string)[] = [1];
    if (actual > 3) visibles.push('...');
    const start = Math.max(2, actual - 1);
    const end = Math.min(total - 1, actual + 1);
    for (let i = start; i <= end; i++) visibles.push(i);
    if (actual < total - 3) visibles.push('...');
    visibles.push(total);
    return visibles;
  }

  public cambiarPaginaDesdeTemplate(pagina: number | string): void {
    const numero = Number(pagina);
    if (!isNaN(numero)) this.cambiarPagina(numero);
  }

  private obtenerProfesores(): void {
    this.showLoading = true;
    this.profesoresService.obtenerProfesores().pipe(take(1)).subscribe({
      next: (rest) => {
        this.profesores = rest || [];
        this.showLoading = false;
      },
      error: () => {
        this.showLoading = false;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
