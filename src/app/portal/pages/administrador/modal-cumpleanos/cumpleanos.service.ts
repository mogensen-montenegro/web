import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Administrador} from '../core-administrador/administrador.interface';

export const CUMPLE_VENTANA_DIAS = 60;
const SESSION_KEY = 'cumpleanosModalMostrado';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export interface CumpleanoProximo {
  id: string;
  nombre: string;
  email: string;
  fechaTexto: string;
  dias: number;
  edad: number | null;
  cuando: string;
  admin: Administrador;
}

@Injectable({providedIn: 'root'})
export class CumpleanosService {
  private abrirSubject = new Subject<void>();
  readonly solicitudAbrir$ = this.abrirSubject.asObservable();

  pedirAbrir(): void {
    this.abrirSubject.next();
  }

  yaMostradoEnSesion(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  marcarMostrado(): void {
    sessionStorage.setItem(SESSION_KEY, '1');
  }

  resetMostrado(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function proximosCumpleanos(
  admins: Administrador[],
  hoy: Date = new Date(),
  ventana: number = CUMPLE_VENTANA_DIAS
): CumpleanoProximo[] {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  return (admins || [])
    .map((admin) => armarCumpleano(admin, inicio))
    .filter((item): item is CumpleanoProximo => !!item && item.dias <= ventana)
    .sort((a, b) => a.dias - b.dias || a.nombre.localeCompare(b.nombre, 'es'));
}

function armarCumpleano(admin: Administrador, inicio: Date): CumpleanoProximo | null {
  const partes = parseNacimiento(admin?.fechaNacimiento);
  if (!partes) return null;

  const esteAnio = fechaEnAnio(inicio.getFullYear(), partes.mes, partes.dia);
  const proxima = esteAnio < inicio
    ? fechaEnAnio(inicio.getFullYear() + 1, partes.mes, partes.dia)
    : esteAnio;

  const dias = Math.round((proxima.getTime() - inicio.getTime()) / 86400000);
  const edad = partes.anio ? proxima.getFullYear() - partes.anio : null;

  return {
    id: admin._id || `${admin.nombre}-${admin.email}`,
    nombre: admin.nombre || 'Sin nombre',
    email: (admin.email || '').trim(),
    fechaTexto: `${proxima.getDate()} de ${MESES[proxima.getMonth()]}`,
    dias,
    edad: edad && edad > 0 ? edad : null,
    cuando: textoCuando(dias),
    admin
  };
}

function textoCuando(dias: number): string {
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

function parseNacimiento(value?: string): { dia: number; mes: number; anio: number } | null {
  const raw = (value || '').trim();
  if (!raw) return null;

  const dmy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(raw);
  if (dmy) {
    return validar(+dmy[1], +dmy[2], +dmy[3]);
  }

  const ymd = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/.exec(raw);
  if (ymd) {
    return validar(+ymd[3], +ymd[2], +ymd[1]);
  }

  return null;
}

function validar(dia: number, mes: number, anio: number): { dia: number; mes: number; anio: number } | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return {dia, mes, anio};
}

function fechaEnAnio(anio: number, mes: number, dia: number): Date {
  const ultimo = new Date(anio, mes, 0).getDate();
  return new Date(anio, mes - 1, Math.min(dia, ultimo));
}
