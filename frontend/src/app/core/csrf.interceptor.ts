import { inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { switchMap } from 'rxjs';
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || ['GET','HEAD','OPTIONS'].includes(req.method)) return next(req);
  return inject(HttpClient).get<{token:string;headerName:string}>('/api/auth/csrf').pipe(
    switchMap(csrf => next(req.clone({setHeaders:{[csrf.headerName]:csrf.token}})))
  );
};
