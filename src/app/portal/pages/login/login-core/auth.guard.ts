import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { InactividadService } from './inactividad.service';
import { LoginService } from './login.service';

const checkAuth = async () => {
  const loginService = inject(LoginService);
  const inactividad = inject(InactividadService);
  const router = inject(Router);
  if (!loginService.isLoggedIn()) return router.parseUrl('/login');
  if (inactividad.shouldExpire()) {
    await inactividad.expire();
    return router.parseUrl('/login');
  }
  inactividad.enforce();
  return true;
};

export const AuthGuard: CanActivateFn = () => checkAuth();

export const AuthChildGuard: CanActivateChildFn = () => checkAuth();
