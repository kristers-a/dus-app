import { Component, input, output } from '@angular/core';
import { Station, chainLabels, fuelLabels, isEstimate } from '../../core/models';
@Component({selector:'app-station-list',standalone:true,template:`
<div class="station-list">@for(s of stations();track s.id){
<button class="station-card" [class.selected]="selectedId()===s.id" (click)="selected.emit(s)">
  <span class="eyebrow">@if(s.demo){DEMO · }{{s.chain ? (chains[s.chain] ?? s.chain) : 'DUS'}}</span><h3>{{s.name}}</h3><p>{{s.address}}</p>
  <div class="price-chips">@for(p of s.fuelPrices;track p.fuelType){
    <span [class.estimate]="estimate(p)" [class.highlight]="fuel()===p.fuelType">{{labels[p.fuelType]}} <strong>@if(estimate(p)){~}{{p.price}}</strong>
    @if(estimate(p)){<small>aplēse</small>}</span>
  }</div>
  @if(priceDate(s);as date){<small class="card-date">Cenas no {{date}}</small>}
</button>}@empty{<p class="muted">Atbilstošas DUS nav atrastas.</p>}</div>`})
export class StationListComponent {
  stations=input<Station[]>([]);selectedId=input<string|null>(null);fuel=input('');selected=output<Station>();
  labels=fuelLabels;chains=chainLabels;estimate=isEstimate;
  priceDate(s:Station){const dates=s.fuelPrices.filter(p=>!isEstimate(p)).map(p=>p.effectiveDate??p.updatedAt?.slice(0,10)).filter(Boolean) as string[];
    return dates.length?dates.sort().at(-1)!.split('-').reverse().join('.'):null;}
}
