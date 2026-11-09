import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
  {path:'login',loadComponent:()=>import('./features/login/login.component').then(m=>m.LoginComponent)},
  {path:'map',canActivate:[authGuard],loadComponent:()=>import('./features/map/map-page.component').then(m=>m.MapPageComponent)},
  {path:'moderation',canActivate:[authGuard],data:{roles:['ADMIN','MODERATOR']},loadComponent:()=>import('./features/moderation/moderation.component').then(m=>m.ModerationComponent)},
  {path:'users',canActivate:[authGuard],data:{roles:['ADMIN']},loadComponent:()=>import('./features/users/users.component').then(m=>m.UsersComponent)},
  {path:'',pathMatch:'full',redirectTo:'map'},
  {path:'**',redirectTo:'map'}
];
