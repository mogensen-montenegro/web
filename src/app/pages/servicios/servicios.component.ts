import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BannerFuncionalidadHeaderComponent } from 'src/app/components/banner-funcionalidad-header/banner-funcionalidad-header.component';
import { ButtonWhatsappComponent } from 'src/app/components/button-whatsapp/button-whatsapp.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { Seccion2Component } from 'src/app/components/seccion2/seccion2.component';

@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss'],
  standalone: true,
    imports:[CommonModule, HeaderComponent, ButtonWhatsappComponent, BannerFuncionalidadHeaderComponent, Seccion2Component]
})
export class ServiciosComponent {

}
