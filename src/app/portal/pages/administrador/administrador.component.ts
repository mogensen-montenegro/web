import {CommonModule} from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {filter, Subject, takeUntil} from 'rxjs';
import Swal from 'sweetalert2';
import {AddAdministradorComponent} from './add-administrador/add-administrador.component';
import {HttpClientModule} from '@angular/common/http';
import {Administrador, AdministradorResponse} from "./core-administrador/administrador.interface";
import {AdministradorService} from "./core-administrador/administrador.service";
import {NavigationEnd, Router} from "@angular/router";

declare const bootstrap: any;

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, AddAdministradorComponent]
})
export class AdministradorComponent implements OnInit, OnDestroy {
  public busqueda = '';
  public busquedaEmpty = '';
  public administradores: Administrador[] = [];
  private administradoresAll: Administrador[] = [];
  private destroy$ = new Subject<void>();
  public showEmpty = false;
  public loading = false;
  public isEdit = false;
  public selectedAdmin: Administrador | null = null;

  constructor(private adminSvc: AdministradorService, private router: Router) {
  }

  ngOnInit(): void {
    this.cargarAdministradores();

    this.router.events
      .pipe(takeUntil(this.destroy$), filter(ev => ev instanceof NavigationEnd))
      .subscribe(() => {
        this.cargarAdministradores();
      });
  }

  private getUserId(): string {
    return localStorage.getItem('userId') ?? '000000000000000000000000';
  }

  private cargarAdministradores(): void {
    this.loading = true;
    this.showEmpty = false;
    this.adminSvc
      .getAll(this.getUserId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: AdministradorResponse) => {
          this.administradoresAll = resp.body ?? [];
          this.administradores = [...this.administradoresAll];
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

  public crearNuevoAdministrador(): void {
    this.isEdit = false;
    this.selectedAdmin = null;
    this.openModal();
  }

  public editarAdministrador(usuario: Administrador): void {
    this.isEdit = true;
    this.selectedAdmin = {...usuario};
    this.openModal();
  }

  private openModal(): void {
    const modalEl = document.getElementById('addAdministrador');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  public onSubmit(evt: { mode: 'create' | 'edit', payload: Administrador, id?: string }): void {
    const userId = this.getUserId();
    if (evt.mode === 'create') {
      this.adminSvc.crearAdministrador(userId, evt.payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: '¡Listo!',
              text: 'Administrador creado correctamente',
              timer: 2000,
              showConfirmButton: false
            }).then();
            this.cargarAdministradores();
            this.cerrarModal();
          },
          error: (err) => {
            Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo crear el administrador'}).then();
            console.error(err);
          }
        });
    } else {
      if (!evt.id) return;
      if (!evt.payload.password) {
        // @ts-ignore
        delete evt.payload.password;
      }
      this.adminSvc.updateById(evt.id, userId, evt.payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: '¡Listo!',
              text: 'Administrador actualizado correctamente',
              timer: 2000,
              showConfirmButton: false
            }).then();
            this.cargarAdministradores();
            this.cerrarModal();
          },
          error: (err) => {
            Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo modificar el administrador'}).then();
            console.error(err);
          }
        });
    }
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
      this.administradores = [...this.administradoresAll];
      this.showEmpty = this.administradores.length === 0;
      this.busquedaEmpty = '';
      return;
    }

    const words = term.split(/\s+/).filter(Boolean);

    const matches = (a: Administrador): boolean => {
      const blob = [
        this.norm(a.nombre),
        this.norm(a.email),
        this.norm(a.telefono),
        this.norm(a.direccion),
        this.norm(a.cuit),
        this.norm(a.observacion),
        this.norm(this.fmtFecha(a.fechaNacimiento))
      ].join(' ');
      return words.every(w => blob.includes(w));
    };

    this.administradores = this.administradoresAll.filter(matches);
    this.showEmpty = this.administradores.length === 0;
    this.busquedaEmpty = this.busqueda;
  }

  public eliminarAdministrador(usuario: Administrador): void {
    Swal.fire({
      title: `Eliminar Administrador`,
      text: `¿Desea eliminar el administrador ${usuario.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      backdrop: false,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed || !usuario._id) return;
      this.adminSvc
        .deleteById(usuario._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: '¡Listo!',
              text: 'El administrador se eliminó correctamente',
              showConfirmButton: false,
              timer: 3000
            }).then();
            this.cargarAdministradores();
          },
          error: (err) => {
            Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo eliminar el administrador'}).then();
            console.error(err);
          },
        });
    });
  }

  public cerrarModal(): void {
    const modalEl = document.getElementById('addAdministrador');
    if (!modalEl) return;
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  fmtFecha(v: string | Date | null | undefined): string {
    if (!v) return '';
    if (v instanceof Date) {
      const dd = String(v.getDate()).padStart(2, '0');
      const mm = String(v.getMonth() + 1).padStart(2, '0');
      const yy = v.getFullYear();
      return `${dd}-${mm}-${yy}`;
    }

    const s = String(v).trim();
    if (!s) return '';

    let m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      return `${dd}-${mm}-${m[3]}`;
    }

    m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m) {
      const dd = m[3].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      return `${dd}-${mm}-${m[1]}`;
    }

    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = d.getFullYear();
        return `${dd}-${mm}-${yy}`;
      }
    } catch {
      console.log('Error al intentar parsear la fecha');
    }
    return s;
  }

  verObs(a: Administrador): void {
    const obs = (a?.observacion ?? '').trim();
    if (!obs) return;
    Swal.fire({
      title: 'Observación',
      html: `
      <div style="
        border:1px solid #ccc;
        border-radius:6px;
        padding:10px;
        background:#f8f9fa;
        text-align:left;
        white-space: normal;
        margin:0;">
        ${this.escapeHtml(obs)}
      </div>`,
      confirmButtonText: 'Cerrar'
    }).then();
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}
