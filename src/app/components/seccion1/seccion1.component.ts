import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-seccion1',
  templateUrl: './seccion1.component.html',
  styleUrls: ['./seccion1.component.scss'],
  imports: [CommonModule]
})
export class Seccion1Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
