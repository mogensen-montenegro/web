import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { Administrador } from '../core-administrador/administrador.interface';
import { EmailService } from '../service/email.service';
import { PlantillaEmail } from '../../plantillas-email/plantilla-email.interface';
import { PlantillaEmailService } from '../../plantillas-email/plantilla-email.service';


type EmailForm = FormGroup<{
  subject: FormControl<string>;
  body: FormControl<string>;
}>;

@Component({
  selector: 'app-send-admin-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './send-admin-email.component.html'
})
export class SendAdminEmailComponent implements OnChanges, OnDestroy {
  // Permitimos null para que nunca truene el binding del padre
  @Input() admin: Administrador | null = null;

  @Output() sent = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  isSending = false;

  // Typed form
  form: EmailForm = this.fb.nonNullable.group({
    subject: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(150)
    ]),
    body: this.fb.nonNullable.control(
      `Hola {{NOMBRE}},\n\nTe escribimos para avisarte que ...\n\nSaludos,\nMogensen Montenegro`,
      [Validators.required, Validators.minLength(5)]
    )
  });

  // Para imprimir chips de variables disponibles (solo UI)
  placeholders = [
    '{{NOMBRE}}',
    '{{EMAIL}}',
    '{{CUIT}}',
    '{{FECHA_NACIMIENTO}}',
    '{{DIRECCION}}',
    '{{TELEFONO}}',
    '{{CONSORCIOS}}'
  ];

  plantillas: PlantillaEmail[] = [];
  plantillaSeleccionadaId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private emailSvc: EmailService,
    private plantillaSvc: PlantillaEmailService,
    private router: Router
  ) {}

  get hasPlantillas(): boolean {
    return this.plantillas.length > 0;
  }

  loadPlantillas(): void {
    this.plantillaSvc
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.plantillas = list;
        this.plantillaSeleccionadaId = null;
        this.form.patchValue({ subject: '', body: '' });
      });
  }

  onPlantillaChange(): void {
    const id = this.plantillaSeleccionadaId;
    if (!id) {
      this.form.patchValue({ subject: '', body: '' });
      return;
    }
    const p = this.plantillas.find((x) => x.id === id);
    if (p) {
      this.form.patchValue({ subject: p.asunto, body: p.body });
    }
  }

  goToPlantillas(): void {
    this.close();
    this.router.navigate(['/panel/plantillas-email']);
  }

  get subjectCtrl() {
    return this.form.controls.subject;
  }
  get bodyCtrl() {
    return this.form.controls.body;
  }

  get previewHtml(): string {
    return this.render(this.bodyCtrl.value);
  }

  send(): void {
    if (!this.admin?.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin email',
        text: 'Este administrador no tiene email cargado.'
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: { to: string; subject: string; html: string; [k: string]: any } = {
      to: this.admin.email,
      subject: this.subjectCtrl.value.trim(),
      html: this.render(this.bodyCtrl.value),
      meta: { adminId: (this.admin as any)?._id, triggeredBy: 'panel-admin' }
    };

    this.isSending = true;
    this.emailSvc
      .sendToAdmin(payload as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSending = false;
          Swal.fire({
            icon: 'success',
            title: 'Enviado',
            timer: 2000,
            showConfirmButton: false
          });
          this.sent.emit();
        },
        error: (err) => {
          this.isSending = false;
          const msg = err?.error?.msj || 'No se pudo enviar el email';
          Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
      });
  }

  close(): void {
    this.closed.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['admin'] && this.admin) {
      this.loadPlantillas();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Render simple de variables {{TAG}} -> valor
  private render(template: string): string {
    const a = this.admin;
    const safe = (v: any) => (v ?? '').toString();

    const fmtFecha = (d?: string) => {
      if (!d) return '';
      // Si viene como YYYY-MM-DD, lo mostramos DD-MM-YYYY
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
    };

    const map = new Map<string, string>([
      ['NOMBRE', safe((a as any)?.nombre)],
      ['EMAIL', safe(a?.email)],
      ['CUIT', safe((a as any)?.cuit)],
      ['FECHA_NACIMIENTO', fmtFecha((a as any)?.fechaNacimiento)],
      ['DIRECCION', safe((a as any)?.direccion)],
      ['TELEFONO', safe((a as any)?.telefono)],
      ['CONSORCIOS', safe((a as any)?.consorciosCount ?? (a as any)?.consorcios ?? 0)]
    ]);

    let out = template ?? '';
    map.forEach((val, key) => {
      out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val);
    });

    // \n -> <br/>
    return out.replace(/\n/g, '<br/>');
  }
}
