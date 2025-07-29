import { Component } from '@angular/core';

@Component({
  selector: 'app-panel-control',
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.scss']
})
export class PanelControlComponent {
  public showModal:boolean = true;
  public aceptoTerminosCondiciones:  boolean = true;

  constructor( ){
  }

  private obtenerDataGym():void{
  //   this.usuarioGym.obtenerDataGym().pipe(take(1)).subscribe({
  //     next: (data: GymUsuario) => {
  //       if (data) {
  //         this.usuarioGym.setGymActivo(data.gymActivo);
  //         this.showModal = data.mensajeModalAceptado;
  //         this.aceptoTerminosCondiciones = data.aceptoTerminosCondiciones;
  //         this.usuarioGym.setData(data);
  //         }
  //     }
  //   })
 }
}

