import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Station, apiError, fuelLabels } from '../../core/models';
import { StationService } from '../../core/station.service';
import { HeaderComponent } from '../../shared/header.component';
import { StationMapComponent } from './station-map.component';
import { StationListComponent } from './station-list.component';
import { StationDetailsComponent } from './station-details.component';
@Component({selector:'app-map-page',standalone:true,imports:[FormsModule,HeaderComponent,StationMapComponent,StationListComponent,StationDetailsComponent],template:`
<app-header/><main class="map-layout"><aside class="sidebar"><span class="eyebrow">TAVA NĀKAMĀ PIETURA</span>
<h1>Degvielas stacijas</h1><p class="muted">Izvēlies staciju kartē vai sarakstā.</p>
<label>Meklēt<input placeholder="Nosaukums vai adrese" [ngModel]="query()" (ngModelChange)="query.set($event)"></label>
<label>Degviela<select [ngModel]="fuel()" (ngModelChange)="fuel.set($event)"><option value="">Visi veidi</option>
@for(type of fuelTypes;track type){<option [value]="type">{{labels[type]}}</option>}</select></label>
<div class="result-count">{{filtered().length}} stacijas · demonstrācijas dati</div>
@if(loading()){<p>Ielādē DUS…</p>}@if(error()){<p class="error">{{error()}}</p><button (click)="load()">Mēģināt vēlreiz</button>}
<app-station-list [stations]="filtered()" [selectedId]="selectedId()" (selected)="selectedId.set($event.id)"/>
</aside><section class="map-area"><app-station-map [stations]="filtered()" [selectedId]="selectedId()" (stationSelected)="selectedId.set($event.id)"/>
@if(selected();as station){<div class="detail-overlay"><app-station-details [station]="station" (closed)="selectedId.set(null)" (changed)="load()"/></div>}
</section></main>`})
export class MapPageComponent {
  private api=inject(StationService);stations=signal<Station[]>([]);query=signal('');fuel=signal('');
  selectedId=signal<string|null>(null);loading=signal(false);error=signal('');labels=fuelLabels;fuelTypes=Object.keys(fuelLabels);
  filtered=computed(()=>this.stations().filter(s=>(s.name+' '+s.address).toLocaleLowerCase().includes(this.query().trim().toLocaleLowerCase())
    && (!this.fuel() || s.fuelPrices.some(p=>p.fuelType===this.fuel()))));
  selected=computed(()=>this.filtered().find(s=>s.id===this.selectedId())??null);
  constructor(){this.load();}
  load(){this.loading.set(true);this.error.set('');this.api.all().subscribe({next:s=>{this.stations.set(s);this.loading.set(false);},
    error:e=>{this.error.set(apiError(e));this.loading.set(false);}});}
}
