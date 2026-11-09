import { Component, input, output } from '@angular/core';
import { Station, fuelLabels } from '../../core/models';
@Component({selector:'app-station-list',standalone:true,template:`
<div class="station-list">@for(s of stations();track s.id){
<button class="station-card" [class.selected]="selectedId()===s.id" (click)="selected.emit(s)">
  <span class="eyebrow">DEMO DUS</span><h3>{{s.name}}</h3><p>{{s.address}}</p>
  <div class="price-chips">@for(p of s.fuelPrices;track p.fuelType){
    <span>{{labels[p.fuelType]}} <strong>{{p.price}}</strong></span>
  }</div>
</button>}@empty{<p class="muted">Atbilstošas DUS nav atrastas.</p>}</div>`})
export class StationListComponent {
  stations=input<Station[]>([]);selectedId=input<string|null>(null);selected=output<Station>();labels=fuelLabels;
}
