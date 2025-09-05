import {inject} from '@angular/core';
import {CanActivateFn, Router, ActivatedRouteSnapshot} from '@angular/router';
import {LoginService} from './login.service';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const roles = route.data['roles'] as string[] | undefined;
  const ls = inject(LoginService);
  const router = inject(Router);

  if (!ls.isLoggedIn()) return router.parseUrl('/login');
  if (!roles || roles.length === 0) return true;

  return ls.hasRole(roles) ? true : router.parseUrl('/forbidden');
};
