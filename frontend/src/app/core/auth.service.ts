import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { switchMap, tap } from 'rxjs';
import { CurrentUser } from './models';
@Injectable({providedIn:'root'})
export class AuthService {
  private http=inject(HttpClient);
  user=signal<CurrentUser|null>(null);
  load() { return this.http.get<CurrentUser>('/api/auth/me').pipe(tap(u=>this.user.set(u))); }
  login(username:string,password:string) {
    const body=new HttpParams().set('username',username).set('password',password);
    return this.http.post('/api/auth/login',body).pipe(switchMap(()=>this.load()));
  }
  logout() { return this.http.post('/api/auth/logout',{}).pipe(tap(()=>this.user.set(null))); }
  get canModerate() { return ['ADMIN','MODERATOR'].includes(this.user()?.role ?? ''); }
}
