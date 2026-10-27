import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ConfiguracionService, DriveConfig, DriveFolder } from './configuracion.service';

@Component({
  selector: 'app-configuracion-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-general.component.html',
  styleUrls: ['./configuracion-general.component.scss']
})
export class ConfiguracionGeneralComponent implements OnInit {
  @Input() esSuperuser = false;

  public drive: DriveConfig = { configurado: false, clientEmail: '', folderId: '', folders: [] };
  public jsonCredencial = '';
  public folderIds: string[] = [''];
  public guardandoDrive = false;

  public pass1 = '';
  public pass2 = '';
  public verPass1 = false;
  public verPass2 = false;
  public guardandoPass = false;

  constructor(
    private configuracionService: ConfiguracionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDrive();
  }

  public agregarCarpeta(): void {
    this.folderIds = [...this.folderIds, ''];
  }

  public quitarCarpeta(index: number): void {
    this.folderIds = this.folderIds.filter((_, i) => i !== index);
    if (!this.folderIds.length) this.folderIds = [''];
  }

  public guardarDrive(): void {
    const ids = this.folderIds.map((id) => id.trim()).filter(Boolean);
    if (!this.jsonCredencial.trim()) {
      void this.aviso('warning', 'Falta el JSON', 'Pegá el archivo de credenciales de la cuenta de servicio.');
      return;
    }
    if (!ids.length) {
      void this.aviso('warning', 'Falta una carpeta', 'Agregá al menos un ID de carpeta de Drive.');
      return;
    }
    this.guardandoDrive = true;
    this.configuracionService.guardarDrive({ jsonCredencial: this.jsonCredencial.trim(), folderIds: ids }).subscribe({
      next: (response) => {
        this.drive = response.drive;
        this.folderIds = (response.drive.folders || []).map((folder) => folder.id);
        this.jsonCredencial = '';
        this.guardandoDrive = false;
        void this.aviso('success', 'Drive vinculado', 'El portal ya puede listar, subir y borrar archivos de esas carpetas.');
      },
      error: (err) => {
        this.guardandoDrive = false;
        void this.aviso('error', 'No se pudo vincular', err?.error?.msj || 'Revisá el JSON, las carpetas y que estén compartidas con el mail de la cuenta de servicio.');
      }
    });
  }

  public desvincularDrive(): void {
    this.guardandoDrive = true;
    this.configuracionService.desvincularDrive().subscribe({
      next: () => {
        this.drive = { configurado: false, clientEmail: '', folderId: '', folders: [] };
        this.folderIds = [''];
        this.jsonCredencial = '';
        this.guardandoDrive = false;
        void this.aviso('success', 'Drive desvinculado', 'Se quitaron las credenciales de Google Drive.');
      },
      error: () => {
        this.guardandoDrive = false;
        void this.aviso('error', 'No se pudo desvincular', 'Probá de nuevo en unos minutos.');
      }
    });
  }

  public irADrive(): void {
    void this.router.navigateByUrl('/panel/drive');
  }

  public guardarPassword(): void {
    if (!this.pass1 || !this.pass2) {
      void this.aviso('warning', 'Completá ambos campos', 'Escribí y repetí la nueva contraseña.');
      return;
    }
    if (this.pass1 !== this.pass2) {
      void this.aviso('warning', 'No coinciden', 'Las contraseñas tienen que ser iguales.');
      return;
    }
    if (this.pass1.length < 6) {
      void this.aviso('warning', 'Muy corta', 'Usá al menos 6 caracteres.');
      return;
    }
    this.guardandoPass = true;
    this.configuracionService.cambiarPassword(this.pass1).subscribe({
      next: () => {
        this.pass1 = '';
        this.pass2 = '';
        this.guardandoPass = false;
        void this.aviso('success', 'Contraseña actualizada', 'Ya podés entrar con la nueva clave.');
      },
      error: (err) => {
        this.guardandoPass = false;
        void this.aviso('error', 'No se pudo actualizar', err?.error?.msj || 'Probá de nuevo en unos minutos.');
      }
    });
  }

  public nombresCarpetas(folders: DriveFolder[]): string {
    return (folders || []).map((folder) => folder.name || folder.id).join(', ');
  }

  private cargarDrive(): void {
    this.configuracionService.obtener().subscribe({
      next: (response) => {
        this.drive = {
          ...response?.drive,
          folders: response?.drive?.folders || []
        };
        this.folderIds = this.drive.folders.length ? this.drive.folders.map((folder) => folder.id) : [''];
      },
      error: () => undefined
    });
  }

  private aviso(icon: 'success' | 'error' | 'warning', title: string, text: string): Promise<unknown> {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonColor: '#b91828'
    });
  }
}
