// import { inject } from "@angular/core";
// import { Router, UrlTree } from "@angular/router";
// import { LoginService } from "@app/services/core/login.service";
// import { PersistenceTokenService } from 'src/app/services/core/persistence-token.service';

// export const AuthGuard = (): boolean | UrlTree => {
//   const loginService = inject(LoginService);
//   const persistenceToken = inject(PersistenceTokenService)
//   const router = inject(Router);

//   if (loginService.isLogged() && !persistenceToken.isTokenExpired()) return true;
//   else return router.parseUrl(`/${loginService.userRole}/login`);
// }
