import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { apiError } from '../../core/models';
@Component({selector:'app-register',standalone:true,imports:[FormsModule,RouterLink],template:`
  <main class="login-page"><section class="login-card">
    <span class="eyebrow">DUSOTĀJS · PROTOTIPS</span><h1>Izveido lietotāja kontu.</h1>
    <p class="muted">Ar lietotāja kontu var skatīt karti un iesniegt degvielas cenas.</p>
    <form (ngSubmit)="register()">
      <label>Lietotājvārds<input name="username" [(ngModel)]="username" minlength="3" maxlength="40" required autocomplete="username"></label>
      <label>Parole (12–64 rakstzīmes)<input name="password" type="password" [(ngModel)]="password" minlength="12" maxlength="64" required autocomplete="new-password"></label>
      <label>Parole vēlreiz<input name="confirm" type="password" [(ngModel)]="confirm" required autocomplete="new-password"></label>
      @if(error()){<p class="error" role="alert">{{error()}}</p>}
      <button class="primary" [disabled]="busy() || username.trim().length<3 || password.length<12 || !confirm">{{busy()?'Izveido…':'Reģistrēties'}}</button>
    </form><p class="muted"><a routerLink="/login">Jau ir konts? Pieteikties</a></p>
  </section></main>`})
export class RegisterComponent {
  private auth=inject(AuthService); private router=inject(Router);
  username=''; password=''; confirm=''; error=signal(''); busy=signal(false);
  register(){
    if(this.password!==this.confirm){this.error.set('Paroles nesakrīt.');return;}
    this.busy.set(true);this.error.set('');
    const username=this.username.trim();
    this.auth.register(username,this.password).subscribe({
      next:()=>{this.busy.set(false);this.router.navigateByUrl('/map');},
      error:e=>{this.busy.set(false);this.error.set(apiError(e));}
    });
  }
}
