import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarConfig } from '../../interface/sidebar.interfaces';
import { GYM_ROUTES_CONFIG } from '../../interface/sidebar-config.constants';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]

})
export class SidebarComponent {
  public navigationItems: SidebarConfig[] = GYM_ROUTES_CONFIG;

    constructor(private cdRef: ChangeDetectorRef) {}

    ngOnInit(): void {
    this.cdRef.detectChanges();
  }


}
