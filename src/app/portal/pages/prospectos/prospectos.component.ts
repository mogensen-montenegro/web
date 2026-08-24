import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { ESPACIOS_COMUNES, Prospecto, ProspectoAdjunto } from '../../../core/prospecto/prospecto.interface';
import { ProspectoService } from '../../../core/prospecto/prospecto.service';
import { ProspectosNuevosService } from '../../../core/prospecto/prospectos-nuevos.service';

@Component({
  selector: 'app-prospectos',
  templateUrl: './prospectos.component.html',
  styleUrls: ['./prospectos.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ProspectosComponent implements OnInit, OnDestroy {
  public busqueda = '';
  public prospectos: Prospecto[] = [];
  private prospectosAll: Prospecto[] = [];
  public loading = false;
  public showEmpty = false;
  public selected: Prospecto | null = null;
  private destroy$ = new Subject<void>();
  private espaciosMap = new Map(ESPACIOS_COMUNES.map((e) => [e.value, e.label]));

  constructor(
    private prospectoService: ProspectoService,
    private prospectosNuevosSrv: ProspectosNuevosService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.showEmpty = false;
    this.prospectoService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.prospectosAll = list;
          this.prospectos = [...list];
          this.showEmpty = list.length === 0;
          this.loading = false;
          this.buscarData();
        },
        error: () => {
          this.loading = false;
          this.showEmpty = true;
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los prospectos' });
        }
      });
  }

  private norm(v: unknown): string {
    return (v ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  public buscarData(): void {
    const term = this.norm(this.busqueda);
    if (!term) {
      this.prospectos = [...this.prospectosAll];
      this.showEmpty = this.prospectos.length === 0;
      return;
    }
    const words = term.split(/\s+/).filter(Boolean);
    this.prospectos = this.prospectosAll.filter((p) => {
      const blob = [
        p.nombre,
        p.email,
        p.telefono,
        p.nombreConsorcio,
        p.direccion,
        p.localidad,
        p.cuit,
        p.rol,
        p.estado
      ]
        .map((x) => this.norm(x))
        .join(' ');
      return words.every((w) => blob.includes(w));
    });
    this.showEmpty = this.prospectos.length === 0;
  }

  public fmtFecha(v?: string): string {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  }

  public siNo(v?: boolean | null): string {
    if (v === true) return 'Sí';
    if (v === false) return 'No';
    return '-';
  }

  public espaciosLabel(list?: string[]): string {
    if (!list?.length) return '-';
    return list.map((v) => this.espaciosMap.get(v) || v).join(', ');
  }

  public tieneAdjuntos(p: Prospecto): boolean {
    return !!(p.reglamento?.base64 || p.polizaActual?.base64);
  }

  public esImagen(adjunto?: ProspectoAdjunto | null): boolean {
    return !!adjunto?.tipo?.startsWith('image/');
  }

  public ver(p: Prospecto): void {
    this.selected = p;
    if (p.id && p.estado !== 'contactado') {
      this.prospectosNuevosSrv.markVisto(p.id);
    }
  }

  public cerrarDetalle(): void {
    this.selected = null;
  }

  public marcarContactado(p: Prospecto): void {
    const id = p.id;
    if (!id) return;
    const next = p.estado === 'contactado' ? 'nuevo' : 'contactado';
    this.prospectoService.actualizarEstado(id, next).subscribe({
      next: (updated) => {
        this.prospectosAll = this.prospectosAll.map((item) => (item.id === id ? { ...item, ...updated } : item));
        this.buscarData();
        if (this.selected?.id === id) this.selected = { ...this.selected, ...updated };
        if (next === 'contactado' && id) this.prospectosNuevosSrv.markVisto(id);
        else this.prospectosNuevosSrv.refresh().subscribe();
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el estado' });
      }
    });
  }

  public eliminar(p: Prospecto): void {
    Swal.fire({
      title: 'Eliminar prospecto',
      text: `¿Desea eliminar la consulta de ${p.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed || !p.id) return;
      this.prospectoService.eliminar(p.id).subscribe({
        next: () => {
          this.prospectosAll = this.prospectosAll.filter((item) => item.id !== p.id);
          this.buscarData();
          if (this.selected?.id === p.id) this.selected = null;
          this.prospectosNuevosSrv.refresh().subscribe();
          Swal.fire({
            icon: 'success',
            title: '¡Listo!',
            text: 'El prospecto se eliminó correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el prospecto' });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
