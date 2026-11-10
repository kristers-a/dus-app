import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PriceSource, Station, apiError, chainLabels, fuelLabels, isEstimate } from '../../core/models';
import { StationService } from '../../core/station.service';
import { HeaderComponent } from '../../shared/header.component';
import { StationMapComponent } from './station-map.component';
import { StationListComponent } from './station-list.component';
import { StationDetailsComponent } from './station-details.component';
@Component({selector:'app-map-page',standalone:true,imports:[FormsModule,HeaderComponent,StationMapComponent,StationListComponent,StationDetailsComponent],template:`
<app-header/><main class="map-layout"><aside class="sidebar"><span class="eyebrow">TAVA NĀKAMĀ PIETURA</span>
<h1>Degvielas stacijas</h1><p class="muted">Izvēlies staciju kartē vai sarakstā.</p>
@if(freshness()){<p class="freshness">{{freshness()}}</p>}
<label>Meklēt<input placeholder="Nosaukums vai adrese" [ngModel]="query()" (ngModelChange)="query.set($event)"></label>
<label>Degviela<select [ngModel]="fuel()" (ngModelChange)="fuel.set($event)"><option value="">Visi veidi</option>
@for(type of fuelTypes;track type){<option [value]="type">{{labels[type]}}</option>}</select></label>
@if(chainOptions().length>1){<div class="filter-label">Tīkls</div><div class="chain-chips">@for(c of chainOptions();track c){
<button type="button" [class.active]="chainOn(c)" [attr.aria-pressed]="chainOn(c)" (click)="toggleChain(c)">{{chainNames[c]??c}}</button>}</div>}
<label class="toggle"><input type="checkbox" [ngModel]="showEstimates()" (ngModelChange)="showEstimates.set($event)">Rādīt aplēstās cenas (~)</label>
<div class="result-count">{{filtered().length}} stacijas@if(showsDemo()){ · demonstrācijas dati}</div>
@if(loading()){<p>Ielādē DUS…</p>}@if(error()){<p class="error">{{error()}}</p><button (click)="load()">Mēģināt vēlreiz</button>}
<app-station-list [stations]="filtered()" [selectedId]="selectedId()" [fuel]="fuel()" (selected)="selectedId.set($event.id)"/>
<p class="price-note">Cenas ir informatīvas. Aplēses (~) nav reālas cenas: tās rēķinātas no tīklu zemākajām publicētajām cenām, tāpēc faktiskā cena var būt augstāka.</p>
</aside><section class="map-area"><app-station-map [stations]="filtered()" [selectedId]="selectedId()" [fuel]="fuel()" (stationSelected)="selectedId.set($event.id)"/>
@if(selected();as station){<div class="detail-overlay"><app-station-details [station]="station" (closed)="selectedId.set(null)" (changed)="load()"/></div>}
</section></main>`})
export class MapPageComponent {
  private api=inject(StationService);stations=signal<Station[]>([]);sources=signal<PriceSource[]>([]);query=signal('');fuel=signal('');
  chains=signal<string[]>([]);showEstimates=signal(true);
  selectedId=signal<string|null>(null);loading=signal(false);error=signal('');labels=fuelLabels;chainNames=chainLabels;fuelTypes=Object.keys(fuelLabels);
  chainOptions=computed(()=>[...new Set(this.stations().map(s=>s.chain??'other'))].sort((a,b)=>(chainLabels[a]??a).localeCompare(chainLabels[b]??b)));
  visible=computed(()=>this.stations().filter(s=>this.chainOn(s.chain??'other'))
    .map(s=>this.showEstimates()?s:{...s,fuelPrices:s.fuelPrices.filter(p=>!isEstimate(p))}));
  filtered=computed(()=>this.visible().filter(s=>(s.name+' '+s.address).toLocaleLowerCase().includes(this.query().trim().toLocaleLowerCase())
    && (!this.fuel() || s.fuelPrices.some(p=>p.fuelType===this.fuel()))));
  selected=computed(()=>this.filtered().find(s=>s.id===this.selectedId())??null);
  showsDemo=computed(()=>this.filtered().some(s=>s.demo));
  freshness=computed(()=>this.sources().map(s=>s.label+': '+(s.updatedAt?s.updatedAt.split('-').reverse().join('.'):s.note??'nav datu')).join(' · '));
  constructor(){this.load();this.api.sources().subscribe({next:s=>this.sources.set(s),error:()=>this.sources.set([])});}
  chainOn(chain:string){return !this.chains().length || this.chains().includes(chain);}
  toggleChain(chain:string){const on=this.chains();
    this.chains.set(on.includes(chain)?on.filter(c=>c!==chain):[...on,chain]);}
  load(){this.loading.set(true);this.error.set('');this.api.all().subscribe({next:s=>{this.stations.set(s);this.loading.set(false);},
    error:e=>{this.error.set(apiError(e));this.loading.set(false);}});}
}
