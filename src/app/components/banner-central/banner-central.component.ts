import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  standalone:true,
  selector: 'app-banner-central',
  templateUrl: './banner-central.component.html',
  styleUrls: ['./banner-central.component.scss'],
  imports:[]
})
export class BannerCentralComponent implements OnDestroy{
  private destroy$: Subject<void> = new Subject();

  constructor(){}

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

}
