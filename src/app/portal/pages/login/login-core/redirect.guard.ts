import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {LoginService} from "./login.service";

export const RedirectGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  const role = loginService.getRole();
  if (role === 'superuser') {
    return router.parseUrl('/panel/administrador');
  }
  if (role === 'admin') {
    return router.parseUrl('/panel/archivos');
  }
  return router.parseUrl('/forbidden');
};
