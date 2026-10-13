import {inject} from '@angular/core';
import {CanActivateFn, Router, ActivatedRouteSnapshot} from '@angular/router';
import {LoginService} from './login.service';
import {ProfesorPermisosService} from '../../tu-personal/profesor-permisos.service';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const roles = route.data['roles'] as string[] | undefined;
  const sidebarId = route.data['sidebarId'] as string | undefined;
  const ls = inject(LoginService);
  const permisos = inject(ProfesorPermisosService);
  const router = inject(Router);

  if (!ls.isLoggedIn()) return router.parseUrl('/login');
  if (!roles || roles.length === 0) return true;
  if (!ls.hasRole(roles)) return router.parseUrl('/forbidden');
  if (ls.getRole() === 'personal' && sidebarId && !permisos.canAccessModule(sidebarId)) {
    return router.parseUrl('/forbidden');
  }
  return true;
};
