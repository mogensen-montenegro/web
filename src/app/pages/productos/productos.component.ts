import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BannerFuncionalidadHeaderComponent } from 'src/app/components/banner-funcionalidad-header/banner-funcionalidad-header.component';
import { ButtonWhatsappComponent } from 'src/app/components/button-whatsapp/button-whatsapp.component';
import { HeaderComponent } from 'src/app/components/header/header.component';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
  standalone: true,
  imports:[CommonModule, HeaderComponent, ButtonWhatsappComponent, BannerFuncionalidadHeaderComponent]
})
export class ProductosComponent {

}
