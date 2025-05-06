import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-bullets',
  templateUrl: './bullets.component.html',
  styleUrls: ['./bullets.component.scss'],
  imports: []
})
export class BulletsComponent implements OnDestroy{
  private destroy$: Subject<void> = new Subject();

  constructor(){}

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
