import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({selector:'app-header',standalone:true,imports:[RouterLink,RouterLinkActive],template:`
<header class="topbar"><a class="brand" routerLink="/map">DUS<span>ATLAS</span></a>
<nav><a routerLink="/map" routerLinkActive="active">Karte</a>
@if(auth.canModerate){<a routerLink="/moderation" routerLinkActive="active">Piedāvājumi</a>}
@if(auth.user()?.role==='ADMIN'){<a routerLink="/users" routerLinkActive="active">Lietotāji</a>}</nav>
<div class="account"><span>{{auth.user()?.username}} · {{auth.user()?.role}}</span><button (click)="logout()">Iziet</button></div></header>`})
export class HeaderComponent {
  auth=inject(AuthService); private router=inject(Router);
  logout(){this.auth.logout().subscribe({next:()=>this.router.navigateByUrl('/login'),error:()=>alert('Neizdevās iziet. Mēģini vēlreiz.')});}
}
