import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AdministradorData, ConsorcioData } from '../../interface/consorcio.interface';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddConsorcioComponent } from '../add-consorcio/add-consorcio.component';

@Component({
  selector: 'app-consorcios',
  templateUrl: './consorcios.component.html',
  styleUrls: ['./consorcios.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AddConsorcioComponent]
})
export class ConsorciosComponent {
  public showEmpty: boolean = false;
  public administrador: AdministradorData[] = [{
    nombre: 'Jorge Martinez',
    email: 'jorgitoMar@gmail.com',
    telefono: '1143256535',
    direccion: 'calle falsa 123',
    cantidadConsorcio: 4
  }];
  public consorcioSeleccionado: ConsorcioData =
    {
      nombre: 'Rivadavia',
      encargado: 'Pepito Juarez',
      telefono: '1143256535',
      direccion: 'calle falsa 123',
      cantidadCarpetas: 4,
      cantidadArchivos: 15
    }
  public adminSeleccionadoId: string = '';
  public administradorSeleccionado: AdministradorData | null = null;

  public cerrarModal(): void {
    // @ts-ignore
    $('#agregarEjercicio').modal('hide');
  }

  public eliminarConsorcio(): void { }
  public crearNuevoConsorcio(): void { }

  public onAdministradorSeleccionado(): void {
    this.administradorSeleccionado = this.administrador.find(
      (a) => a._id === this.adminSeleccionadoId
    ) || null;

    console.log('Administrador seleccionado:', this.administradorSeleccionado);
    // Podés usar esto para cargar datos, consorcios, etc.
  }
}
