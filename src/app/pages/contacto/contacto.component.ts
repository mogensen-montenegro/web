import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from 'src/app/components/header/header.component';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss'],
  standalone: true,
  imports:[CommonModule, HeaderComponent]
})
export class ContactoComponent {

  public email: string = 'mogensenmontenegroseguros@gmail.com'

}
