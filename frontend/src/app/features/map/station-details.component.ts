import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Station, apiError, fuelLabels } from '../../core/models';
import { StationService } from '../../core/station.service';
import { AuthService } from '../../core/auth.service';
@Component({selector:'app-station-details',standalone:true,imports:[FormsModule,DatePipe],template:`
<section class="details"><button class="close" (click)="closed.emit()" aria-label="Aizvērt">×</button>
<span class="eyebrow">STACIJAS INFORMĀCIJA</span><h2>{{station().name}}</h2><p>{{station().address}}</p>
<p class="muted">{{station().description}}</p>
@for(p of station().fuelPrices;track p.fuelType){<div class="fuel-row"><div>{{labels[p.fuelType]}}
<small>Atjaunots {{p.updatedAt | date:'dd.MM.yyyy HH:mm'}}</small></div><strong>{{p.price}} EUR/L</strong></div>}
<hr><h3>Iesniegt cenas izmaiņu</h3>
<form (ngSubmit)="save(false)"><label>Degvielas veids<select name="fuel" [(ngModel)]="fuelType">
<option value="">Izvēlies</option>@for(p of station().fuelPrices;track p.fuelType){<option [value]="p.fuelType">{{labels[p.fuelType]}}</option>}
</select></label><label>Cena EUR/L<input name="price" type="number" min="0.001" max="10" step="0.001" [(ngModel)]="price" required></label>
<button class="primary" [disabled]="busy() || !fuelType || !price">Iesniegt piedāvājumu</button>
@if(auth.canModerate){<button type="button" [disabled]="busy() || !fuelType || !price" (click)="save(true)">Saglabāt tieši (moderators)</button>}
@if(message()){<p role="status">{{message()}}</p>}</form></section>`})
export class StationDetailsComponent {
  station=input.required<Station>();closed=output<void>();changed=output<void>();
  auth=inject(AuthService);private api=inject(StationService);labels=fuelLabels;
  fuelType='';price:number|null=null;message=signal('');busy=signal(false);
  save(direct:boolean){if(!this.price || !this.fuelType)return;this.busy.set(true);this.message.set('');
    const action=direct?this.api.update(this.station().id,this.fuelType,String(this.price)):
      this.api.suggest(this.station().id,this.fuelType,String(this.price));
    action.subscribe({next:()=>{this.busy.set(false);this.message.set(direct?'Cena saglabāta.':'Piedāvājums gaida moderatora pārbaudi.');if(direct)this.changed.emit();},
      error:e=>{this.busy.set(false);this.message.set(apiError(e));}});
  }
}
