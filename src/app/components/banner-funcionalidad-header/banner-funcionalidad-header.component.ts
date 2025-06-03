import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';


@Component({
  standalone:true,
  selector: 'app-banner-funcionalidad-header',
  templateUrl: './banner-funcionalidad-header.component.html',
  styleUrls: ['./banner-funcionalidad-header.component.scss'],
  imports:[CommonModule]
})
export class BannerFuncionalidadHeaderComponent{
  @Input() public esProducto: boolean = false;
  @Input() public esNosotros: boolean = false;

  constructor(){}


}
