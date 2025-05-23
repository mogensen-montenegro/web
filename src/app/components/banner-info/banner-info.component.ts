import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-banner-info',
  templateUrl: './banner-info.component.html',
  styleUrls: ['./banner-info.component.scss'],
  imports: [RouterModule]
})
export class BannerInfoComponent implements OnDestroy{
  private destroy$: Subject<void> = new Subject();

  constructor(){}

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
