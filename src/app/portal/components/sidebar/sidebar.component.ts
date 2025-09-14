import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SidebarConfig} from './interface/sidebar.interface';
import {GYM_ROUTES_CONFIG} from './interface/sidebar.config';
import {LoginService} from "../../pages/login/login-core/login.service";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]

})
export class SidebarComponent implements OnInit {
  public navigationItems: SidebarConfig[] = GYM_ROUTES_CONFIG;

  constructor(private cdRef: ChangeDetectorRef, private authService: LoginService) {
  }

  ngOnInit(): void {
    this.cdRef.detectChanges();
  }

  canSee(item: SidebarConfig): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return this.authService.hasRole(item.roles);
  }

  get visibleItems(): SidebarConfig[] {
    return this.navigationItems.filter(i => this.canSee(i));
  }
}
