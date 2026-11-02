import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

  public drive: DriveConfig = {
    configurado: false,
    conectado: false,
    hasClient: false,
    clientEmail: '',
    connectedEmail: '',
    folderId: '',
    folders: [],
    oauthClientId: ''
  };
  public oauthClientId = '';
  public oauthClientSecret = '';
  public folderIds: string[] = [''];
  public guardandoDrive = false;
  public conectandoGoogle = false;

  public pass1 = '';
  public pass2 = '';
  public verPass1 = false;
  public verPass2 = false;
  public guardandoPass = false;

  constructor(
    private configuracionService: ConfiguracionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarDrive();
    this.leerResultadoOAuth();
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
    const clientId = this.oauthClientId.trim() || this.drive.oauthClientId || '';
    const secret = this.oauthClientSecret.trim();
    if (!clientId) {
      void this.aviso('warning', 'Falta el Client ID', 'Pegá el Client ID del cliente OAuth de Google.');
      return;
    }
    if (!secret && !this.drive.hasClient) {
      void this.aviso('warning', 'Falta el Client Secret', 'Pegá el Client Secret del cliente OAuth de Google.');
      return;
    }
    if (!ids.length) {
      void this.aviso('warning', 'Falta una carpeta', 'Agregá al menos un ID de carpeta de Drive.');
      return;
    }
    this.guardandoDrive = true;
    this.configuracionService
      .guardarDrive({
        oauthClientId: clientId,
        oauthClientSecret: secret || undefined,
        folderIds: ids
      })
      .subscribe({
        next: (response) => {
          this.aplicarDrive(response.drive);
          this.oauthClientSecret = '';
          this.guardandoDrive = false;
          void this.aviso(
            'success',
            response.drive.conectado ? 'Drive actualizado' : 'Credenciales guardadas',
            response.drive.conectado
              ? 'El portal ya puede listar, crear y subir archivos con esa cuenta.'
              : 'Ahora tocá Conectar con Google e ingresá con la cuenta de la oficina.'
          );
        },
        error: (err) => {
          this.guardandoDrive = false;
          void this.aviso(
            'error',
            'No se pudo guardar',
            err?.error?.msj || 'Revisá el Client ID, el Secret y los IDs de carpeta.'
          );
        }
      });
  }

  public conectarGoogle(): void {
    const ids = this.folderIds.map((id) => id.trim()).filter(Boolean);
    const clientId = this.oauthClientId.trim() || this.drive.oauthClientId || '';
    const secret = this.oauthClientSecret.trim();
    const necesitaGuardar = !this.drive.hasClient || !!secret || ids.join(',') !== (this.drive.folders || []).map((f) => f.id).join(',');

    this.conectandoGoogle = true;
    const iniciar = () => {
      this.configuracionService.iniciarOAuthDrive().subscribe({
        next: (response) => {
          if (!response?.url) {
            this.conectandoGoogle = false;
            void this.aviso('error', 'No se pudo iniciar', 'Google no devolvió la URL de autorización.');
            return;
          }
          window.location.href = response.url;
        },
        error: (err) => {
          this.conectandoGoogle = false;
          void this.aviso(
            'error',
            'No se pudo conectar',
            err?.error?.msj || 'Guardá primero el Client ID y el Client Secret.'
          );
        }
      });
    };

    if (!necesitaGuardar) {
      iniciar();
      return;
    }
    if (!clientId || (!secret && !this.drive.hasClient) || !ids.length) {
      this.conectandoGoogle = false;
      void this.aviso(
        'warning',
        'Faltan datos',
        'Completá Client ID, Client Secret y al menos una carpeta antes de conectar.'
      );
      return;
    }
    this.configuracionService
      .guardarDrive({
        oauthClientId: clientId,
        oauthClientSecret: secret || undefined,
        folderIds: ids
      })
      .subscribe({
        next: (response) => {
          this.aplicarDrive(response.drive);
          this.oauthClientSecret = '';
          iniciar();
        },
        error: (err) => {
          this.conectandoGoogle = false;
          void this.aviso('error', 'No se pudo guardar', err?.error?.msj || 'Revisá las credenciales y las carpetas.');
        }
      });
  }

  public desvincularDrive(): void {
    this.guardandoDrive = true;
    this.configuracionService.desvincularDrive().subscribe({
      next: () => {
        this.drive = {
          configurado: false,
          conectado: false,
          hasClient: false,
          clientEmail: '',
          connectedEmail: '',
          folderId: '',
          folders: [],
          oauthClientId: ''
        };
        this.folderIds = [''];
        this.oauthClientId = '';
        this.oauthClientSecret = '';
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

  private aplicarDrive(drive: DriveConfig | undefined): void {
    this.drive = {
      configurado: !!drive?.configurado,
      conectado: !!drive?.conectado,
      hasClient: !!drive?.hasClient,
      clientEmail: drive?.connectedEmail || drive?.clientEmail || '',
      connectedEmail: drive?.connectedEmail || drive?.clientEmail || '',
      folderId: drive?.folderId || '',
      folders: drive?.folders || [],
      oauthClientId: drive?.oauthClientId || '',
      actualizadoEn: drive?.actualizadoEn || null
    };
    this.oauthClientId = this.drive.oauthClientId || '';
    this.folderIds = this.drive.folders.length ? this.drive.folders.map((folder) => folder.id) : [''];
  }

  private cargarDrive(): void {
    this.configuracionService.obtener().subscribe({
      next: (response) => this.aplicarDrive(response?.drive),
      error: () => undefined
    });
  }

  private leerResultadoOAuth(): void {
    const params = this.route.snapshot.queryParamMap;
    const drive = params.get('drive');
    if (!drive) return;
    if (drive === 'ok') {
      void this.aviso('success', 'Google conectado', 'El portal ya opera con la cuenta de Drive de la oficina.');
      this.cargarDrive();
    } else if (drive === 'error') {
      const msj = params.get('msj') || 'No se pudo conectar Google Drive.';
      void this.aviso('error', 'No se pudo conectar', msj);
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
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
