import { Injectable } from '@angular/core';
import { LoginService } from '../login/login-core/login.service';
import { PersonalModuloConfig, PersonalModuloId, PersonalPermisosModulos } from './profesor.interface';

export const PERSONAL_MODULOS_CONFIG: PersonalModuloConfig[] = [
  { id: 'consorcio', label: 'Administradores' },
  { id: 'consorcios', label: 'Consorcios' },
  { id: 'base', label: 'Carga de Archivos' },
  { id: 'generador-recibos', label: 'Generador de recibos' },
  { id: 'noticia', label: 'Noticia' },
  { id: 'plantillas-email', label: 'Plantillas de Email' },
  { id: 'prospectos', label: 'Prospectos' },
  { id: 'drive', label: 'Archivos de Drive' },
  { id: 'driveBorrar', label: 'Borrar Drive' }
];

const STORAGE_KEY = 'personalPermisos';

@Injectable({ providedIn: 'root' })
export class ProfesorPermisosService {
  constructor(private loginService: LoginService) {}

  public normalize(permisos?: Partial<Record<PersonalModuloId, boolean>> | null): PersonalPermisosModulos {
    const normalized = PERSONAL_MODULOS_CONFIG.reduce((acc, modulo) => {
      acc[modulo.id] = modulo.id === 'driveBorrar'
        ? permisos?.[modulo.id] === true
        : permisos?.[modulo.id] !== false;
      return acc;
    }, {} as PersonalPermisosModulos);
    normalized.addProf = false;
    normalized.driveBorrar = permisos?.driveBorrar === true;
    return normalized;
  }

  public save(permisos?: Partial<Record<PersonalModuloId, boolean>> | null): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.normalize(permisos)));
  }

  public clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  public getStored(): PersonalPermisosModulos {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return this.normalize();
    try {
      return this.normalize(JSON.parse(raw));
    } catch {
      return this.normalize();
    }
  }

  public canAccessModule(moduleId: string): boolean {
    if (this.loginService.getRole() !== 'personal') return true;
    if (moduleId === 'addProf' || moduleId === 'reportes' || moduleId === 'driveBorrar') return false;
    return this.getStored()[moduleId as PersonalModuloId] !== false;
  }

  public canDeleteDrive(): boolean {
    if (this.loginService.hasRole(['superuser'])) return true;
    if (this.loginService.getRole() !== 'personal') return false;
    return this.getStored().driveBorrar === true;
  }

  public firstAllowedUrl(items: Array<{ id: string; url: string }>): string {
    const allowed = items.find(
      (item) => item.id !== 'addProf' && item.id !== 'reportes' && this.canAccessModule(item.id)
    );
    return allowed?.url || '/login';
  }
}
