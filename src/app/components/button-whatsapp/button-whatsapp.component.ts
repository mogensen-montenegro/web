import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-button-whatsapp',
  template: `
  <ng-container>
  <a href="https://wa.me/+5491145280955?text=Hola%20quiero%20información" target="_blank" class="contenedor-pregunta" #boton>
  <img src="../../assets/img/whatsappIcon.png" class="w-100" alt="Pregunta">
</a>

<a href="https://wa.me/+5491145280955?text=Hola%20quiero%20información" target="_blank"  *ngIf="showCartel" class="mensaje fadeIn d-flex">
<svg width="50" height="50" fill="#ea7306" class="bi bi-chat-dots-fill mr-3" viewBox="0 0 16 16">
  <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
</svg>
<p><b>¿Tenés dudas?</b> Mandanos un mensaje</p>
</a>
</ng-container>
`,
  styleUrls: ['./button-whatsapp.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ButtonWhatsappComponent implements OnDestroy{
  public showCartel: boolean = false;
  private destroy$: Subject<void> = new Subject();

  constructor(){
    setTimeout(() => {
      this.showCartel = true;
    },1000);
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

}
