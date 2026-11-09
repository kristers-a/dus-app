import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HeaderComponent } from '../../shared/header.component';
import { StationService } from '../../core/station.service';
import { PriceSuggestion, Station, apiError, fuelLabels } from '../../core/models';
@Component({selector:'app-moderation',standalone:true,imports:[HeaderComponent,DatePipe],template:`
<app-header/><main class="content"><h1>Cenu piedāvājumi</h1><p class="muted">Pārbaudi informāciju pirms cenas publicēšanas.</p>
@if(error()){<p class="error">{{error()}}</p>}<button (click)="load()">Atjaunot sarakstu</button>
@for(s of suggestions();track s.id){<article class="panel"><h3>{{stationName(s.stationId)}}</h3>
<p>{{labels[s.fuelType]}} · piedāvātā cena {{s.proposedPrice}} EUR/L</p>
<p class="muted">{{s.submittedBy}} · {{s.submittedAt | date:'dd.MM.yyyy HH:mm'}}</p>
<div class="actions"><button class="primary" [disabled]="busy()" (click)="review(s,'APPROVED')">Apstiprināt</button>
<button [disabled]="busy()" (click)="review(s,'REJECTED')">Noraidīt</button></div></article>}
@empty{<p>Nav neapstrādātu piedāvājumu.</p>}</main>`})
export class ModerationComponent {
  private api=inject(StationService);suggestions=signal<PriceSuggestion[]>([]);stations=signal<Station[]>([]);
  error=signal('');busy=signal(false);labels=fuelLabels;
  constructor(){this.load();this.api.all().subscribe({next:s=>this.stations.set(s),error:e=>this.error.set(apiError(e))});}
  stationName(id:string){return this.stations().find(s=>s.id===id)?.name??id;}
  load(){this.api.pending().subscribe({next:s=>this.suggestions.set(s),error:e=>this.error.set(apiError(e))});}
  review(s:PriceSuggestion,decision:string){
    let reason='';if(decision==='REJECTED'){const answer=prompt('Noraidījuma iemesls:');if(!answer?.trim())return;reason=answer.trim();}
    this.busy.set(true);this.error.set('');this.api.review(s.id,decision,reason).subscribe({
      next:()=>{this.busy.set(false);this.load();},error:e=>{this.busy.set(false);this.error.set(apiError(e));}});
  }
}
