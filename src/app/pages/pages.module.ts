import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesComponent } from './pages.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from '../app-routing.module';
import { FooterComponent } from '../components/footer/footer.component';
import { HomeModule } from './home/home.module';


@NgModule({
  declarations: [
    PagesComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    AppRoutingModule,
    FooterComponent,
    HomeModule
  ],
  exports:[PagesComponent]
})
export class PagesModule { }
