import {Component, OnDestroy, OnInit} from '@angular/core';
import {InactividadService} from '../login/login-core/inactividad.service';
import {LoginService} from '../login/login-core/login.service';
import {ProspectosNuevosService} from '../../../core/prospecto/prospectos-nuevos.service';

@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.scss']
})
export class PanelControlComponent implements OnInit, OnDestroy {
  public sidebarCollapsed = false;

  constructor(
    public prospectosNuevos: ProspectosNuevosService,
    private loginService: LoginService,
    private inactividad: InactividadService
  ) {}

  ngOnInit(): void {
    if (this.loginService.hasRole(['superuser'])) {
      this.prospectosNuevos.start();
    }
    this.inactividad.start();
  }

  public onSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  ngOnDestroy(): void {
    this.prospectosNuevos.stop();
    this.inactividad.stop();
  }
}
