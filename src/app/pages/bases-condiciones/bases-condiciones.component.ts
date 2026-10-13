import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from 'src/app/components/header/header.component';

@Component({
  selector: 'app-bases-condiciones',
  templateUrl: './bases-condiciones.component.html',
  styleUrls: ['./bases-condiciones.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderComponent]
})
export class BasesCondicionesComponent {
  readonly pdfUrl = 'assets/docs/bases-y-condiciones-sorteo.pdf';
}
