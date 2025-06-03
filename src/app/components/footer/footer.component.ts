import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone:true,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports:[RouterModule]
})
export class FooterComponent{
  public web :string = 'mogensenmontenegroseguros@gmail.com'

  constructor(){}



}
