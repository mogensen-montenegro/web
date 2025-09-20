import {CommonModule} from '@angular/common';
import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AddConsorcioComponent} from './add-consorcio/add-consorcio.component';
import {Subject, takeUntil} from "rxjs";
import {Administrador, AdministradorResponse} from "../administrador/core-administrador/administrador.interface";
import {Consorcio, ConsorcioResponse} from './core-consorcio/consorcio.interface';
import Swal from "sweetalert2";
import {AdministradorService} from "../administrador/core-administrador/administrador.service";
import {ConsorcioService} from "./core-consorcio/consorcio.service";

declare const bootstrap: any;

@Component({
  selector: 'app-consorcios',
  templateUrl: './consorcios.component.html',
  styleUrls: ['./consorcios.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AddConsorcioComponent]
})
export class ConsorciosComponent implements OnInit, AfterViewInit {
  public showEmpty = false;
  public adminSeleccionadoId = '';
  public administradorSeleccionado: Administrador | null = null;
  public loading = false;
  private destroy$ = new Subject<void>();
  public administradores: Administrador[] = [];
  public consorcios: Consorcio[] = [];
  public consorcioSeleccionado: Consorcio | null = null;
  private modal?: any;

  constructor(private administradorService: AdministradorService, private consorcioService: ConsorcioService) {
  }

  ngOnInit(): void {
    this.cargarAdministradores();
  }

  private getUserId(): string {
    return localStorage.getItem('userId') ?? '000000000000000000000000';
  }

  protected getAdminId(): string {
    return this.administradorSeleccionado?._id ?? '000000000000000000000000';
  }

  public cerrarModal(): void {
    const modalEl = document.getElementById('agregarConsorcio');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();
  }

  public eliminarConsorcio(consorcio: Consorcio): void {
    Swal.fire({
      title: `Eliminar Consorcio`,
      text: `¿Desea eliminar el consorcio ${consorcio.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      backdrop: false,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed || !consorcio._id) return;
      this.consorcioService
        .deleteById(consorcio._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: '¡Listo!',
              text: 'El consorcio se eliminó correctamente',
              showConfirmButton: false,
              timer: 3000
            }).then();
            this.cargarConsorcios();
          },
          error: (err) => {
            Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo eliminar el consorcio'}).then();
            console.error(err);
          },
        });
    });
  }

  public editarConsorcio(c: Consorcio): void {
    this.consorcioSeleccionado = {...c};
    setTimeout(() => {
      const el = document.getElementById('agregarConsorcio');
      if (el) new bootstrap.Modal(el).show();
    }, 0);
    setTimeout(() => this.openModal(), 0);
  }

  public crearNuevoConsorcio(): void {
    this.consorcioSeleccionado = null;
    setTimeout(() => {
      const el = document.getElementById('agregarConsorcio');
      if (el) new bootstrap.Modal(el).show();
    }, 0);
    setTimeout(() => this.openModal(), 0);
  }

  public onAdministradorSeleccionado(): void {
    this.administradorSeleccionado = this.administradores.find((a) => a._id === this.adminSeleccionadoId) || null;
    this.cargarConsorcios();
  }

  private cargarAdministradores(): void {
    this.loading = true;
    this.showEmpty = false;
    this.administradorService
      .getAll(this.getUserId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: AdministradorResponse) => {
          this.administradores = resp.body ?? [];
          this.showEmpty = this.administradores.length === 0;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          Swal.fire({icon: 'error', title: 'Error', text: 'No se pudieron cargar los administradores'}).then();
          console.error(err);
        },
      });
  }

  private cargarConsorcios(): void {
    if (!this.getAdminId()) {
      this.consorcios = [];
      return;
    }
    this.loading = true;
    this.showEmpty = false;
    this.consorcioService
      .getAllById(this.getAdminId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ConsorcioResponse) => {
          this.consorcios = resp.body ?? [];
          this.showEmpty = this.consorcios.length === 0;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          Swal.fire({icon: 'error', title: 'Error', text: 'No se pudieron cargar los consorcios'}).then();
          console.error(err);
        },
      });
  }

  public onConsorcioGuardado(cambio?: Consorcio): void {
    this.cerrarModal();

    const adminIdActual = this.getAdminId();
    if (!cambio || !adminIdActual) return;
    if (cambio.idAdmin !== adminIdActual) return;

    const idx = this.consorcios.findIndex(c => c._id === cambio._id);
    if (idx >= 0) {
      this.consorcios = [
        ...this.consorcios.slice(0, idx),
        {...this.consorcios[idx], ...cambio},
        ...this.consorcios.slice(idx + 1),
      ];
    } else {
      this.consorcios = [cambio, ...this.consorcios];
    }
  }

  openModal() {
    const el = document.getElementById('agregarConsorcio');
    if (!el) return;
    this.modal = bootstrap.Modal.getOrCreateInstance(el, {backdrop: true, keyboard: true, focus: true});
    this.modal.show();
  }

  ngAfterViewInit() {
    const el = document.getElementById('agregarConsorcio');
    el?.addEventListener('hidden.bs.modal', () => {
      document.body.classList.remove('modal-open');
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    });
  }

  verObs(c: Consorcio): void {
    const obs = (c?.observacion ?? '').trim();
    if (!obs) return;
    Swal.fire({
      title: 'Observación',
      html: `
      <div style="border:1px solid #ccc; border-radius:6px; padding:10px; background:#f8f9fa; text-align:left; white-space: normal; margin:0;">
        ${this.escapeHtml(obs)}
      </div>
      `,
      confirmButtonText: 'Cerrar'
    }).then();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
