import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {LoginService} from "./login.service";
import {GYM_ROUTES_CONFIG} from '../../../components/sidebar/interface/sidebar.config';
import {ProfesorPermisosService} from '../../tu-personal/profesor-permisos.service';

export const RedirectGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const permisos = inject(ProfesorPermisosService);
  const router = inject(Router);

  const role = loginService.getRole();
  if (role === 'superuser') {
    return router.parseUrl('/panel/administrador');
  }
  if (role === 'admin') {
    return router.parseUrl('/panel/archivos');
  }
  if (role === 'personal') {
    return router.parseUrl(permisos.firstAllowedUrl(GYM_ROUTES_CONFIG));
  }
  return router.parseUrl('/forbidden');
};
