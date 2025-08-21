import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SidebarConfig} from './interface/sidebar.interface';
import {GYM_ROUTES_CONFIG} from './interface/sidebar.config';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]

})
export class SidebarComponent implements OnInit {
  public navigationItems: SidebarConfig[] = GYM_ROUTES_CONFIG;

  constructor(private cdRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.cdRef.detectChanges();
  }
}
