import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { ButtonWhatsappComponent } from '../../components/button-whatsapp/button-whatsapp.component';
import { ProspectoService } from '../../core/prospecto/prospecto.service';
import { ESPACIOS_COMUNES, Prospecto, ProspectoAdjunto, ROLES_CONTACTO, TIPOS_EDIFICIO } from '../../core/prospecto/prospecto.interface';

@Component({
  selector: 'app-cotizar',
  templateUrl: './cotizar.component.html',
  styleUrls: ['./cotizar.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent, ButtonWhatsappComponent]
})
export class CotizarComponent {
  readonly roles = ROLES_CONTACTO;
  readonly tipos = TIPOS_EDIFICIO;
  readonly espacios = ESPACIOS_COMUNES;
  public submitted = false;
  public loading = false;
  public errorEnvio = '';
  public vista: 'form' | 'exito' | 'error' = 'form';
  public espaciosSeleccionados: string[] = [];
  public reglamento: ProspectoAdjunto | null = null;
  public polizaActual: ProspectoAdjunto | null = null;
  public documentosAdicionales: ProspectoAdjunto[] = [];
  public errorReglamento = '';
  public errorPoliza = '';
  public errorDocumentosAdicionales = '';
  readonly maxDocumentosAdicionales = 5;
  private readonly maxFileBytes = 5 * 1024 * 1024;
  private readonly mimePermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  public form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['Administrador', Validators.required],
    nombreConsorcio: [''],
    direccion: ['', Validators.required],
    localidad: ['', Validators.required],
    codigoPostal: [''],
    cuit: [''],
    tipoEdificio: ['PH residencial', Validators.required],
    unidadesFuncionales: [null as number | null],
    cantidadPlantas: [null as number | null],
    metrosCuadrados: [null as number | null],
    anioConstruccion: [null as number | null],
    cantidadAscensores: [null as number | null],
    tieneCocheras: [''],
    calderasTermotanques: [''],
    sumaAsegurableDetalle: [''],
    sumaAsegurableMonto: [null as number | null],
    polizaVigente: [''],
    companiaActual: [''],
    comentarios: ['']
  });

  constructor(
    private fb: FormBuilder,
    private prospectoService: ProspectoService,
    private cdr: ChangeDetectorRef
  ) {}

  public invalid(control: string): boolean {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  public toggleEspacio(value: string): void {
    if (this.espaciosSeleccionados.includes(value)) {
      this.espaciosSeleccionados = this.espaciosSeleccionados.filter((e) => e !== value);
      return;
    }
    this.espaciosSeleccionados = [...this.espaciosSeleccionados, value];
  }

  public isEspacio(value: string): boolean {
    return this.espaciosSeleccionados.includes(value);
  }

  public onAdjunto(tipo: 'reglamento' | 'polizaActual', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const setError = (msg: string) => {
      if (tipo === 'reglamento') {
        this.errorReglamento = msg;
        this.reglamento = null;
      } else {
        this.errorPoliza = msg;
        this.polizaActual = null;
      }
    };

    this.leerArchivo(file, setError, (adjunto) => {
      if (tipo === 'reglamento') {
        this.reglamento = adjunto;
        this.errorReglamento = '';
      } else {
        this.polizaActual = adjunto;
        this.errorPoliza = '';
      }
    });
  }

  public onDocumentosAdicionales(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;

    const disponibles = this.maxDocumentosAdicionales - this.documentosAdicionales.length;
    if (disponibles <= 0) {
      this.errorDocumentosAdicionales = `Podés subir hasta ${this.maxDocumentosAdicionales} archivos adicionales.`;
      return;
    }

    const aProcesar = files.slice(0, disponibles);
    if (files.length > disponibles) {
      this.errorDocumentosAdicionales = `Solo se agregaron ${disponibles} archivo(s). El máximo es ${this.maxDocumentosAdicionales}.`;
    } else {
      this.errorDocumentosAdicionales = '';
    }

    for (const file of aProcesar) {
      this.leerArchivo(
        file,
        (msg) => {
          this.errorDocumentosAdicionales = msg;
        },
        (adjunto) => {
          this.documentosAdicionales = [...this.documentosAdicionales, adjunto];
        }
      );
    }
  }

  public quitarDocumentoAdicional(index: number): void {
    this.documentosAdicionales = this.documentosAdicionales.filter((_, i) => i !== index);
    if (this.documentosAdicionales.length < this.maxDocumentosAdicionales) {
      this.errorDocumentosAdicionales = '';
    }
  }

  private leerArchivo(
    file: File,
    onError: (msg: string) => void,
    onOk: (adjunto: ProspectoAdjunto) => void
  ): void {
    const mime = (file.type || '').toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const extOk = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
    const mimeOk = this.mimePermitidos.includes(mime);
    if (!mimeOk && !extOk) {
      onError('Solo se admiten archivos PDF, JPG, JPEG o PNG.');
      return;
    }
    if (file.size > this.maxFileBytes) {
      onError('Cada archivo no puede superar los 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || '');
      const tipoFinal = mime === 'image/jpg' ? 'image/jpeg' : mime || this.mimeDesdeNombre(file.name);
      const payload = raw.includes(',') ? raw.split(',')[1] : '';
      if (!payload) {
        onError('No se pudo leer el archivo. Intentá de nuevo.');
        return;
      }
      onOk({
        nombre: file.name.slice(0, 180),
        tipo: tipoFinal,
        base64: `data:${tipoFinal};base64,${payload}`
      });
    };
    reader.onerror = () => onError('No se pudo leer el archivo. Intentá de nuevo.');
    reader.readAsDataURL(file);
  }

  public quitarAdjunto(tipo: 'reglamento' | 'polizaActual'): void {
    if (tipo === 'reglamento') {
      this.reglamento = null;
      this.errorReglamento = '';
      return;
    }
    this.polizaActual = null;
    this.errorPoliza = '';
  }

  public esImagen(adjunto?: ProspectoAdjunto | null): boolean {
    return !!adjunto?.tipo?.startsWith('image/');
  }

  private mimeDesdeNombre(nombre: string): string {
    const ext = nombre.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'png') return 'image/png';
    return 'image/jpeg';
  }

  public enviar(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.loading) return;

    this.submitted = true;
    this.errorEnvio = '';
    this.trimCampos();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      const faltantes = this.camposInvalidos();
      this.errorEnvio = faltantes.length
        ? `Completá los campos obligatorios: ${faltantes.join(', ')}.`
        : 'Revisá los campos obligatorios marcados en rojo.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    const v = this.form.getRawValue();
    const toNum = (val: unknown): number | null => {
      if (val === '' || val === null || val === undefined) return null;
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    };
    const payload: Prospecto = {
      nombre: (v.nombre || '').trim(),
      email: (v.email || '').trim(),
      telefono: (v.telefono || '').trim(),
      rol: v.rol || '',
      nombreConsorcio: (v.nombreConsorcio || '').trim(),
      direccion: (v.direccion || '').trim(),
      localidad: (v.localidad || '').trim(),
      codigoPostal: (v.codigoPostal || '').trim(),
      cuit: (v.cuit || '').trim(),
      tipoEdificio: v.tipoEdificio || '',
      unidadesFuncionales: toNum(v.unidadesFuncionales),
      cantidadPlantas: toNum(v.cantidadPlantas),
      metrosCuadrados: toNum(v.metrosCuadrados),
      anioConstruccion: toNum(v.anioConstruccion),
      cantidadAscensores: toNum(v.cantidadAscensores),
      tieneCocheras: v.tieneCocheras === 'si' ? true : v.tieneCocheras === 'no' ? false : null,
      calderasTermotanques: (v.calderasTermotanques || '').trim(),
      sumaAsegurableDetalle: (v.sumaAsegurableDetalle || '').trim(),
      sumaAsegurableMonto: toNum(v.sumaAsegurableMonto),
      espaciosComunes: this.espaciosSeleccionados,
      polizaVigente: v.polizaVigente === 'si' ? true : v.polizaVigente === 'no' ? false : null,
      companiaActual: (v.companiaActual || '').trim(),
      comentarios: (v.comentarios || '').trim(),
      reglamento: this.reglamento,
      polizaActual: this.polizaActual,
      documentosAdicionales: this.documentosAdicionales
    };

    this.prospectoService.crear(payload).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.vista = 'exito';
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.vista = 'error';
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  public volverAlFormulario(): void {
    this.vista = 'form';
    this.loading = false;
    this.errorEnvio = '';
  }

  private camposInvalidos(): string[] {
    const labels: Record<string, string> = {
      nombre: 'nombre',
      email: 'email',
      telefono: 'teléfono',
      direccion: 'dirección',
      localidad: 'localidad',
      rol: 'rol',
      tipoEdificio: 'tipo de edificio'
    };
    return Object.keys(labels).filter((key) => this.form.get(key)?.invalid).map((key) => labels[key]);
  }

  private trimCampos(): void {
    const keys = ['nombre', 'email', 'telefono', 'nombreConsorcio', 'direccion', 'localidad', 'codigoPostal', 'cuit', 'companiaActual', 'calderasTermotanques', 'sumaAsegurableDetalle', 'comentarios'] as const;
    const patch: Record<string, string> = {};
    for (const key of keys) {
      const value = this.form.get(key)?.value;
      if (typeof value === 'string') patch[key] = value.trim();
    }
    this.form.patchValue(patch, { emitEvent: false });
  }
}
