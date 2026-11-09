import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiError } from '../../core/models';
@Component({selector:'app-login',standalone:true,imports:[FormsModule],template:`
  <main class="login-page"><section class="login-card">
    <span class="eyebrow">DUS ATLAS · PROTOTIPS</span><h1>Atrodi savu nākamo pieturu.</h1>
    <p class="muted">Piesakies, lai apskatītu karti un iesniegtu degvielas cenas.</p>
    <form (ngSubmit)="login()">
      <label>Lietotājvārds<input name="username" [(ngModel)]="username" required autocomplete="username"></label>
      <label>Parole<input name="password" type="password" [(ngModel)]="password" required autocomplete="current-password"></label>
      @if(error()){<p class="error" role="alert">{{error()}}</p>}
      <button class="primary" [disabled]="busy() || !username || !password">{{busy()?'Pieslēdzas…':'Pieteikties'}}</button>
    </form><small class="muted">Kartē tiek izmantoti izdomāti demonstrācijas DUS dati.</small>
  </section></main>`})
export class LoginComponent {
  private auth=inject(AuthService); private router=inject(Router);
  username=''; password=''; error=signal(''); busy=signal(false);
  login(){ this.busy.set(true);this.error.set('');this.auth.login(this.username,this.password).subscribe({
    next:()=>{this.busy.set(false);this.router.navigateByUrl('/map');},
    error:e=>{this.error.set(apiError(e));this.busy.set(false);}
  }); }
}
