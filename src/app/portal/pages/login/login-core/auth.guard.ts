import {inject} from '@angular/core';
import {CanActivateFn, CanActivateChildFn, Router} from '@angular/router';
import {InactividadService} from './inactividad.service';
import {LoginService} from './login.service';

const checkAuth = () => {
  const loginService = inject(LoginService);
  const inactividad = inject(InactividadService);
  const router = inject(Router);
  if (!loginService.isLoggedIn()) return router.parseUrl('/login');
  if (inactividad.enforce()) return router.parseUrl('/login');
  return true;
};

export const AuthGuard: CanActivateFn = () => checkAuth();

export const AuthChildGuard: CanActivateChildFn = () => checkAuth();
