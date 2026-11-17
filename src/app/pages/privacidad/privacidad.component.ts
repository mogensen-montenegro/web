import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from 'src/app/components/header/header.component';

@Component({
  selector: 'app-privacidad',
  templateUrl: './privacidad.component.html',
  styleUrls: ['./privacidad.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderComponent]
})
export class PrivacidadComponent {
  readonly actualizado = '17 de noviembre de 2026';
}
