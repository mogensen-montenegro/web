import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BannerFuncionalidadHeaderComponent } from 'src/app/components/banner-funcionalidad-header/banner-funcionalidad-header.component';
import { ButtonWhatsappComponent } from 'src/app/components/button-whatsapp/button-whatsapp.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { Seccion1Component } from 'src/app/components/seccion1/seccion1.component';

@Component({
  selector: 'app-nosotros',
  templateUrl: './nosotros.component.html',
  styleUrls: ['./nosotros.component.scss'],
  standalone: true,
  imports:[CommonModule, HeaderComponent, ButtonWhatsappComponent, BannerFuncionalidadHeaderComponent, Seccion1Component]
})
export class NosotrosComponent {

}
