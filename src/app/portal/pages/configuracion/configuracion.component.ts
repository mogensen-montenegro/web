import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginService } from '../login/login-core/login.service';
import { ConfiguracionGeneralComponent } from './configuracion-general.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfiguracionGeneralComponent],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {
  public tab: 'general' = 'general';
  public esSuperuser = false;

  constructor(private loginService: LoginService) {}

  ngOnInit(): void {
    this.esSuperuser = this.loginService.hasRole(['superuser']);
  }
}
