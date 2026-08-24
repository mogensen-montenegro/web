import {Component, OnDestroy, OnInit} from '@angular/core';
import {LoginService} from '../login/login-core/login.service';
import {ProspectosNuevosService} from '../../../core/prospecto/prospectos-nuevos.service';

@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.scss']
})
export class PanelControlComponent implements OnInit, OnDestroy {
  constructor(
    public prospectosNuevos: ProspectosNuevosService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    if (this.loginService.hasRole(['superuser'])) {
      this.prospectosNuevos.start();
    }
  }

  ngOnDestroy(): void {
    this.prospectosNuevos.stop();
  }
}

