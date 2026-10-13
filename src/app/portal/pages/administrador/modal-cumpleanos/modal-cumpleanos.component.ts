import {CommonModule} from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {forkJoin, of, Subject, takeUntil} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import Swal from 'sweetalert2';
import {LoginService} from '../../login/login-core/login.service';
import {ProfesorPermisosService} from '../../tu-personal/profesor-permisos.service';
import {AdministradorService} from '../core-administrador/administrador.service';
import {EmailService} from '../service/email.service';
import {
  CUMPLE_VENTANA_DIAS,
  CumpleanoProximo,
  CumpleanosService,
  proximosCumpleanos
} from './cumpleanos.service';

const TITULO_DEFAULT = '¡Feliz cumpleaños!';
const ASUNTO_DEFAULT = '¡Feliz cumpleaños, {{NOMBRE}}!';
const MENSAJE_DEFAULT = `Hola {{NOMBRE}},

Desde Mogensen Montenegro queremos desearte un muy feliz cumpleaños. Que este nuevo año venga lleno de salud, alegría y buenos momentos.

Un saludo,
Mogensen Montenegro`;

@Component({
  selector: 'app-modal-cumpleanos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-cumpleanos.component.html',
  styleUrls: ['./modal-cumpleanos.component.scss']
})
export class ModalCumpleanosComponent implements OnInit, OnDestroy {
  readonly ventanaDias = CUMPLE_VENTANA_DIAS;
  readonly variableNombre = '{{NOMBRE}}';
  abierto = false;
  saludoAbierto = false;
  cargando = false;
  enviando = false;
  proximos: CumpleanoProximo[] = [];
  seleccion = new Set<string>();
  titulo = TITULO_DEFAULT;
  asunto = ASUNTO_DEFAULT;
  mensaje = MENSAJE_DEFAULT;

  private destroy$ = new Subject<void>();
  private carga$ = new Subject<void>();

  constructor(
    private cumpleanos: CumpleanosService,
    private adminSvc: AdministradorService,
    private emailSvc: EmailService,
    private login: LoginService,
    private permisos: ProfesorPermisosService
  ) {}

  ngOnInit(): void {
    this.cumpleanos.solicitudAbrir$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.abrir(false));

    this.abrir(true);
  }

  ngOnDestroy(): void {
    this.carga$.next();
    this.carga$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get seleccionados(): CumpleanoProximo[] {
    return this.proximos.filter((item) => this.seleccion.has(item.id));
  }

  get puedeEnviarSaludo(): boolean {
    return this.seleccionados.some((item) => !!item.email);
  }

  get todosConEmailSeleccionados(): boolean {
    const conEmail = this.proximos.filter((item) => item.email);
    return conEmail.length > 0 && conEmail.every((item) => this.seleccion.has(item.id));
  }

  get nombresSeleccionados(): string {
    if (!this.seleccionados.length) return 'nadie';
    const nombres = this.seleccionados.slice(0, 6).map((item) => item.nombre);
    const resto = this.seleccionados.length - nombres.length;
    return resto > 0 ? `${nombres.join(', ')} y ${resto} más` : nombres.join(', ');
  }

  estaSeleccionado(item: CumpleanoProximo): boolean {
    return this.seleccion.has(item.id);
  }

  toggle(item: CumpleanoProximo): void {
    if (!item.email) return;
    if (this.seleccion.has(item.id)) {
      this.seleccion.delete(item.id);
    } else {
      this.seleccion.add(item.id);
    }
  }

  seleccionarTodos(): void {
    const conEmail = this.proximos.filter((item) => item.email);
    const todos = conEmail.every((item) => this.seleccion.has(item.id));
    this.seleccion = todos ? new Set() : new Set(conEmail.map((item) => item.id));
  }

  abrirSaludo(): void {
    if (!this.puedeEnviarSaludo) return;
    this.titulo = TITULO_DEFAULT;
    this.asunto = ASUNTO_DEFAULT;
    this.mensaje = MENSAJE_DEFAULT;
    this.saludoAbierto = true;
  }

  cerrarSaludo(): void {
    if (this.enviando) return;
    this.saludoAbierto = false;
  }

  cerrar(): void {
    if (this.enviando) return;
    this.saludoAbierto = false;
    this.abierto = false;
  }

  enviarSaludo(): void {
    const titulo = this.titulo.trim();
    const asunto = this.asunto.trim();
    const mensaje = this.mensaje.trim();
    const destinatarios = this.seleccionados.filter((item) => item.email);

    if (!titulo || !asunto || mensaje.length < 5 || !destinatarios.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Completá el saludo',
        text: 'El título, el asunto y el mensaje son necesarios para enviar.'
      });
      return;
    }

    this.enviando = true;
    forkJoin(
      destinatarios.map((item) =>
        this.emailSvc.sendToAdmin({
          to: item.email,
          subject: this.render(asunto, item).slice(0, 150),
          html: this.htmlSaludo(titulo, mensaje, item),
          meta: {adminId: item.admin._id, triggeredBy: 'cumpleanos'}
        }).pipe(
          map(() => ({ok: true, nombre: item.nombre})),
          catchError(() => of({ok: false, nombre: item.nombre}))
        )
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((resultados) => {
        this.enviando = false;
        const fallidos = resultados.filter((r) => !r.ok).map((r) => r.nombre);
        if (!fallidos.length) {
          this.saludoAbierto = false;
          Swal.fire({
            icon: 'success',
            title: 'Saludo enviado',
            text: destinatarios.length === 1
              ? `Se envió el email a ${destinatarios[0].nombre}.`
              : `Se enviaron ${destinatarios.length} emails.`,
            timer: 2200,
            showConfirmButton: false
          });
          return;
        }
        Swal.fire({
          icon: 'error',
          title: 'Algunos saludos no se enviaron',
          text: fallidos.join(', ')
        });
      });
  }

  private abrir(automatico: boolean): void {
    if (!this.puedeVer()) return;
    if (automatico && this.cumpleanos.yaMostradoEnSesion()) return;

    this.carga$.next();
    this.cargando = true;
    this.adminSvc.getAll(this.login.getDataUserId())
      .pipe(takeUntil(this.carga$), takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.proximos = proximosCumpleanos(resp.body ?? []);
          this.seleccion = new Set(this.proximos.filter((item) => item.email).map((item) => item.id));
          this.cargando = false;
          if (automatico && !this.proximos.length) return;
          if (automatico) this.cumpleanos.marcarMostrado();
          this.abierto = true;
        },
        error: () => {
          this.cargando = false;
          if (!automatico) {
            Swal.fire({icon: 'error', title: 'Error', text: 'No se pudieron cargar los cumpleaños.'});
          }
        }
      });
  }

  private puedeVer(): boolean {
    if (!this.login.isLoggedIn()) return false;
    if (this.login.getRole() === 'superuser') return true;
    return this.login.getRole() === 'personal' && this.permisos.canAccessModule('consorcio');
  }

  private htmlSaludo(titulo: string, mensaje: string, item: CumpleanoProximo): string {
    const tituloHtml = this.escape(this.render(titulo, item));
    const cuerpo = this.escape(this.render(mensaje, item)).replace(/\n/g, '<br>');
    return `<h2 style="color:#b91828;font-family:Arial,sans-serif;">${tituloHtml}</h2><p style="font-family:Arial,sans-serif;line-height:1.5;color:#1c1f3a;">${cuerpo}</p>`;
  }

  private render(template: string, item: CumpleanoProximo): string {
    const admin = item.admin;
    const map: Record<string, string> = {
      NOMBRE: item.nombre,
      EMAIL: item.email,
      CUIT: admin.cuit || '',
      FECHA_NACIMIENTO: admin.fechaNacimiento || '',
      DIRECCION: admin.direccion || '',
      TELEFONO: admin.telefono || ''
    };
    return Object.entries(map).reduce(
      (out, [key, value]) => out.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value),
      template || ''
    );
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
