import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConsorcioData } from '../consorcios/interface/consorcio.interface';

@Component({
  selector: 'app-archivos',
  templateUrl: './archivos.component.html',
  styleUrls: ['./archivos.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ArchivosComponent {
  public consorvioSeleccionadoId:string = '';
  public showEmpty: boolean = false;
  public consorvio: ConsorcioData[] =
    [{
      nombre: 'Rivadavia',
      encargado: 'Pepito Juarez',
      telefono: '1143256535',
      direccion: 'calle falsa 123',
      cantidadCarpetas: 4,
      cantidadArchivos: 15
    }]
  public archivosAdjuntos = [{
    cantidadArchivos: 3,
    titulo: 'Seguro de vida'
  },
{
    cantidadArchivos: 7,
    titulo: 'Seguro de Hogar'
  },
{
    cantidadArchivos: 1,
    titulo: 'Seguro de incendio'
  }, {
    cantidadArchivos: 3,
    titulo: 'Seguro de vida'
  },
{
    cantidadArchivos: 7,
    titulo: 'Seguro de Hogar'
  },
{
    cantidadArchivos: 1,
    titulo: 'Seguro de incendio'
  }]

  public onConsorvioSeleccionado():void{}
  public crearNuevaCarpeta():void{}

}
