import {inject} from '@angular/core';
import {CanActivateFn, CanActivateChildFn, Router} from '@angular/router';
import {LoginService} from '../../services/login.service';

export const AuthGuard: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  const logged = loginService.isLoggedIn();
  return logged ? true : router.parseUrl('/login');
};

export const AuthChildGuard: CanActivateChildFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  const logged = loginService.isLoggedIn();
  return logged ? true : router.parseUrl('/login');
};
