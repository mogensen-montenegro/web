import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { BulletsComponent } from 'src/app/components/bullets/bullets.component';
import { BannerCentralComponent } from 'src/app/components/banner-central/banner-central.component';
import { BannerInfoComponent } from 'src/app/components/banner-info/banner-info.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { ButtonWhatsappComponent } from 'src/app/components/button-whatsapp/button-whatsapp.component';



@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    // SeccionCelularComponent,
    BulletsComponent,
    BannerCentralComponent,
    BannerInfoComponent,
    HeaderComponent,
    // ContactoComponent,
    ButtonWhatsappComponent,
  ],
  exports: [HomeComponent]
})
export class HomeModule { }
