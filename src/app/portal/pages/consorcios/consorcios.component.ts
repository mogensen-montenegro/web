import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {Consorcio, ConsorcioResponse} from './core-consorcio/consorcio.interface';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AddConsorcioComponent} from './add-consorcio/add-consorcio.component';
import {Subject, takeUntil} from "rxjs";
import {Administrador, AdministradorResponse} from "../administrador/core-administrador/administrador.interface";
import Swal from "sweetalert2";
import {AdministradorService} from "../administrador/core-administrador/administrador.service";
import {ConsorcioService} from "./core-consorcio/consorcio.service";

@Component({
  selector: 'app-consorcios',
  templateUrl: './consorcios.component.html',
  styleUrls: ['./consorcios.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AddConsorcioComponent]
})
export class ConsorciosComponent implements OnInit {
  public showEmpty: boolean = false;
  public adminSeleccionadoId: string = '';
  public administradorSeleccionado: Administrador | null = null;
  public loading = false;
  private destroy$ = new Subject<void>();
  public administradores: Administrador[] = [];
  public consorcios: Consorcio[] = [];

  constructor(private administradorService: AdministradorService, private consorcioService: ConsorcioService) {
  }

  ngOnInit(): void {
    this.cargarAdministradores();
    console.log(this.administradorSeleccionado);
  }

  private getUserId(): string {
    return localStorage.getItem('userId') ?? '000000000000000000000000';
  }

  private getAdminId(): string {
    return this.administradorSeleccionado?._id ?? '000000000000000000000000';
  }

  public cerrarModal(): void {
    // @ts-ignore
    $('#agregarEjercicio').modal('hide');
  }

  public eliminarConsorcio(): void {
  }

  public crearNuevoConsorcio(): void {
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
    this.loading = true;
    this.showEmpty = false;
    this.consorcioService
      .getAllById(this.getAdminId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ConsorcioResponse) => {
          this.consorcios = resp.body ?? [];
          this.showEmpty = this.administradores.length === 0;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          Swal.fire({icon: 'error', title: 'Error', text: 'No se pudieron cargar los consorcios'}).then();
          console.error(err);
        },
      });
  }
}
