import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { AdministradorData } from '../../interface/dataUser.interface';
import Swal from 'sweetalert2';
import { AddAdministradorComponent } from '../add-administrador/add-administrador.component';

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, AddAdministradorComponent]
})
export class AdministradorComponent implements OnDestroy{
  public busqueda: string = '';
  public busquedaHandle: string = '';
  public busquedaEmpty: string = '';
  public data: Array<AdministradorData> = [
    {nombre: 'Jorge Martinez',
      email: 'jorgitoMar@gmail.com',
      telefono: '1143256535',
      direccion: 'calle falsa 123',
      cantidadConsorcio: 4
    }
  ];
  private destroy$: Subject<void> = new Subject();
  public showEmpty:boolean = false;
  public spinner: boolean = false;

  constructor(){
  }

  public crearNuevoAdministrador(): void {

  }
  public buscarData(): void {

  }

  public eliminarConsorcio():void{
        Swal.fire({
      title: `Eliminar Consorcio`,
      text: `¿Desea eliminar el consorcio (nombre consorcio)?`,
      icon: 'question',
      showCancelButton: true,
      backdrop: false,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Aceptar',
    }).then((result) => {
      if (result.isConfirmed) {
      Swal.fire({
        position: 'center',
        icon: 'success',
        title: '¡Listo!',
        text: 'El consorcio se eliminó correctamente',
        showConfirmButton: false,
        timer: 1500,
      });

      }
    });
  }

    public cerrarModal(): void {
    // @ts-ignore
    $('#agregarEjercicio').modal('hide');
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

}
