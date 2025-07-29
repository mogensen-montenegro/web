import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PanelControlComponent } from './panel-control.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ReactiveFormsModule } from '@angular/forms';
import { InternalHeaderComponent } from '../../components/internal-header/internal-header.component';


@NgModule({
  declarations: [PanelControlComponent],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SidebarComponent,
    InternalHeaderComponent,
  ],
  exports: [PanelControlComponent]
})
export class PanelControlModule { }
