import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarConfig } from './interface/sidebar.interface';
import { GYM_ROUTES_CONFIG } from './interface/sidebar.config';
import { LoginService } from "../../pages/login/login-core/login.service";
import { ArchivosNuevosService } from "../../pages/archivos/archivos-core/archivos-nuevos.service";
import { ProspectosNuevosService } from "../../../core/prospecto/prospectos-nuevos.service";
import { ProfesorPermisosService } from "../../pages/tu-personal/profesor-permisos.service";
import { ConfiguracionService } from "../../pages/configuracion/configuracion.service";

const STORAGE_KEY = 'sidebarCollapsed';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  @Output() collapsedChange = new EventEmitter<boolean>();

  public navigationItems: SidebarConfig[] = GYM_ROUTES_CONFIG;
  public collapsed = false;
  public driveOn = false;

  constructor(
    private cdRef: ChangeDetectorRef,
    private authService: LoginService,
    public archivosNuevosSrv: ArchivosNuevosService,
    public prospectosNuevosSrv: ProspectosNuevosService,
    private profesorPermisosSrv: ProfesorPermisosService,
    public configuracionService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    this.collapsed = localStorage.getItem(STORAGE_KEY) === '1';
    this.collapsedChange.emit(this.collapsed);
    this.configuracionService.driveHabilitado$.subscribe((value) => {
      this.driveOn = value;
      this.cdRef.markForCheck();
    });
    this.configuracionService.refrescarDrive();
    this.cdRef.detectChanges();
  }

  public driveHabilitado(item: SidebarConfig): boolean {
    return item.id !== 'drive' || this.driveOn;
  }

  public toggle(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem(STORAGE_KEY, this.collapsed ? '1' : '0');
    this.collapsedChange.emit(this.collapsed);
  }

  canSee(item: SidebarConfig): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    if (!this.authService.hasRole(item.roles)) return false;
    if (this.authService.getRole() === 'personal') {
      return this.profesorPermisosSrv.canAccessModule(item.id);
    }
    return true;
  }

  get visibleItems(): SidebarConfig[] {
    return this.navigationItems.filter(i => this.canSee(i));
  }

  /** Solo los clientes (rol admin) ven el badge de archivos nuevos; el superuser no. */
  get showArchivosNuevosBadge(): boolean {
    return this.authService.hasRole(['admin']);
  }

  get showProspectosNuevosBadge(): boolean {
    return this.authService.hasRole(['superuser']);
  }
}
