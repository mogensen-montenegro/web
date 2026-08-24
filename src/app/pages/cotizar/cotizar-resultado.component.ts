import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ButtonWhatsappComponent } from '../../components/button-whatsapp/button-whatsapp.component';

@Component({
  selector: 'app-cotizar-resultado',
  templateUrl: './cotizar-resultado.component.html',
  styleUrls: ['./cotizar-resultado.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ButtonWhatsappComponent]
})
export class CotizarResultadoComponent {
  public ok = false;

  constructor(private route: ActivatedRoute) {
    this.ok = this.route.snapshot.data['tipo'] === 'exito';
  }
}
