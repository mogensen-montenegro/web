import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesComponent } from './pages.component';
import { RouterModule } from '@angular/router';
import { PanelControlModule } from './panel-control/panel-control.module';


@NgModule({
  declarations: [
    PagesComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    PanelControlModule
  ],
  exports:[PagesComponent]
})
export class PagesModule { }
