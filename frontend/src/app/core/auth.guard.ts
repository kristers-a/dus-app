import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = route => {
  const auth=inject(AuthService), router=inject(Router);
  return auth.load().pipe(map(user=>{
    const roles=route.data['roles'] as string[]|undefined;
    return !roles || roles.includes(user.role) ? true : router.createUrlTree(['/map']);
  }),catchError(()=>{auth.user.set(null);return of(router.createUrlTree(['/login']));}));
};
