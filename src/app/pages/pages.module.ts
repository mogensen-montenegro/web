import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesComponent } from './pages.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from '../app-routing.module';
import { FooterComponent } from '../components/footer/footer.component';
import { HomeModule } from './home/home.module';
import { NoticiaModalComponent } from '../components/noticia-modal/noticia-modal.component';


@NgModule({
  declarations: [
    PagesComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    AppRoutingModule,
    FooterComponent,
    HomeModule,
    NoticiaModalComponent
  ],
  exports:[PagesComponent]
})
export class PagesModule { }
