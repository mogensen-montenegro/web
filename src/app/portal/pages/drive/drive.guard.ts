import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ConfiguracionService } from '../configuracion/configuracion.service';

export const DriveGuard: CanActivateFn = () => {
  const configuracion = inject(ConfiguracionService);
  const router = inject(Router);
  if (configuracion.driveHabilitado) return true;
  return configuracion.obtener().pipe(
    map((response) =>
      response?.drive?.configurado ? true : router.parseUrl('/panel/configuracion')
    ),
    catchError(() => of(router.parseUrl('/panel/configuracion')))
  );
};
