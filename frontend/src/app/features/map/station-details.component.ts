import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FuelPrice, Station, apiError, chainLabels, fuelLabels, isEstimate, kindLabels } from '../../core/models';
import { StationService } from '../../core/station.service';
import { AuthService } from '../../core/auth.service';
@Component({selector:'app-station-details',standalone:true,imports:[FormsModule,DatePipe],template:`
<section class="details"><button class="close" (click)="closed.emit()" aria-label="Aizvērt">×</button>
<span class="eyebrow">STACIJAS INFORMĀCIJA</span><h2>{{station().name}}</h2><p>{{station().address}}</p>
@if(station().chain){<p class="muted">{{chains[station().chain!] ?? station().chain}}@if(station().demo){ · demonstrācijas dati}</p>}
@if(station().description){<p class="muted">{{station().description}}</p>}
@for(p of station().fuelPrices;track p.fuelType){<div class="fuel-row" [class.estimate]="estimate(p)"><div>{{labels[p.fuelType]}}
<span class="kind-badge" [class.estimate]="estimate(p)">{{estimate(p) ? '~ aplēse' : 'publicēta'}}</span>
<small>{{kinds[p.kind ?? 'listed']}}@if(p.source){ · {{p.source}}}</small>
<small>{{estimate(p) ? 'Pamatā cenas no' : 'Spēkā no'}} {{(p.effectiveDate ?? p.updatedAt) | date:'dd.MM.yyyy'}}
@if(p.sourceUrl){ · <a [href]="p.sourceUrl" target="_blank" rel="noopener">avots</a>}</small>
@if(estimate(p)){<small>Iespējams, faktiskā cena ir tāda pati vai augstāka.</small>}
@if(spark(p.fuelType);as line){<svg class="sparkline" viewBox="0 0 90 26" width="90" height="26" role="img" [attr.aria-label]="'Cenu vēsture: '+line.label"><polyline [attr.points]="line.points"/></svg>}
</div><strong>@if(estimate(p)){~}{{p.price}} EUR/L</strong></div>}
<hr><h3>Iesniegt cenas izmaiņu</h3>
<form (ngSubmit)="save(false)"><label>Degvielas veids<select name="fuel" [(ngModel)]="fuelType">
<option value="">Izvēlies</option>@for(type of offered();track type){<option [value]="type">{{labels[type]}}</option>}
</select></label><label>Cena EUR/L<input name="price" type="number" min="0.001" max="10" step="0.001" [(ngModel)]="price" required></label>
<button class="primary" [disabled]="busy() || !fuelType || !price">Iesniegt piedāvājumu</button>
@if(auth.canModerate){<button type="button" [disabled]="busy() || !fuelType || !price" (click)="save(true)">Saglabāt tieši (moderators)</button>}
@if(message()){<p role="status">{{message()}}</p>}</form></section>`})
export class StationDetailsComponent {
  station=input.required<Station>();closed=output<void>();changed=output<void>();
  auth=inject(AuthService);private api=inject(StationService);labels=fuelLabels;chains=chainLabels;kinds=kindLabels;
  fuelType='';price:number|null=null;message=signal('');busy=signal(false);
  estimate(p:FuelPrice){return isEstimate(p);}
  offered(){return this.station().fuels ?? this.station().fuelPrices.map(p=>p.fuelType);}
  spark(fuel:string){
    const points=(this.station().priceHistory??[]).filter(h=>h.fuelType===fuel);
    if(points.length<2)return null;
    const values=points.map(h=>Number(h.price)),min=Math.min(...values),max=Math.max(...values);
    return {points:values.map((v,i)=>`${(i*86/(values.length-1)+2).toFixed(1)},${(max>min?22-(v-min)/(max-min)*18:13).toFixed(1)}`).join(' '),
      label:points.map(h=>h.date.split('-').reverse().join('.')+' '+h.price).join(', ')};
  }
  save(direct:boolean){if(!this.price || !this.fuelType)return;this.busy.set(true);this.message.set('');
    const action=direct?this.api.update(this.station().id,this.fuelType,String(this.price)):
      this.api.suggest(this.station().id,this.fuelType,String(this.price));
    action.subscribe({next:()=>{this.busy.set(false);this.message.set(direct?'Cena saglabāta.':'Piedāvājums gaida moderatora pārbaudi.');if(direct)this.changed.emit();},
      error:e=>{this.busy.set(false);this.message.set(apiError(e));}});
  }
}
