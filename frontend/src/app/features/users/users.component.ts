import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header.component';
import { apiError } from '../../core/models';
interface UserView {id:string;username:string;role:string;enabled:boolean;}
@Component({selector:'app-users',standalone:true,imports:[HeaderComponent,FormsModule],template:`
<app-header/><main class="content"><h1>Lietotāji</h1><section class="panel"><h2>Izveidot kontu</h2>
<form class="user-form" (ngSubmit)="create()"><label>Lietotājvārds<input name="username" [(ngModel)]="username" minlength="3" maxlength="40" required></label>
<label>Parole (12–64 rakstzīmes)<input type="password" name="password" [(ngModel)]="password" minlength="12" maxlength="64" required autocomplete="new-password"></label>
<label>Loma<select name="role" [(ngModel)]="role"><option value="USER">Lietotājs</option><option value="MODERATOR">Moderators</option><option value="ADMIN">Administrators</option></select></label>
<button class="primary" [disabled]="busy() || username.length<3 || password.length<12">Izveidot</button></form>
@if(message()){<p role="status">{{message()}}</p>}</section>
@for(u of users();track u.id){<article class="panel"><strong>{{u.username}}</strong> · {{u.role}}</article>}</main>`})
export class UsersComponent {
  private http=inject(HttpClient);users=signal<UserView[]>([]);busy=signal(false);message=signal('');username='';password='';role='USER';
  constructor(){this.load();}
  load(){this.http.get<UserView[]>('/api/users').subscribe({next:u=>this.users.set(u),error:e=>this.message.set(apiError(e))});}
  create(){this.busy.set(true);this.http.post('/api/users',{username:this.username,password:this.password,role:this.role}).subscribe({
    next:()=>{this.busy.set(false);this.password='';this.username='';this.message.set('Konts izveidots.');this.load();},
    error:e=>{this.busy.set(false);this.message.set(apiError(e));}});}
}
