import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { AuthService } from '../../core/auth.service';
import { Station, isEstimate } from '../../core/models';
@Component({selector:'app-station-map',standalone:true,imports:[FormsModule],template:`
<div #canvas class="map-canvas" aria-label="DUS karte"></div>
@if(fuel()){<div class="map-legend"><span>lētāk</span><i></i><span>dārgāk</span><b>~ aplēse</b></div>}
@if(admin()){<div class="jiggle-control"><label class="toggle"><input type="checkbox" [ngModel]="wobble()" (ngModelChange)="wobble.set($event)">Šūpošanās</label>
@if(wobble()){<label>Stiprums {{strength()}}<input type="range" min="0" max="100" [ngModel]="strength()" (ngModelChange)="strength.set(+$event)"></label>}</div>}
@if(tileError){<div class="map-warning">Kartes flīzes nav pieejamas. DUS vari izvēlēties sarakstā.</div>}`,
styles:[`:host{display:block;position:relative;height:100%;min-height:420px}.map-canvas{height:100%;min-height:420px}.map-warning{position:absolute;bottom:30px;left:15px;z-index:500;background:white;padding:12px;border-radius:8px}`]})
export class StationMapComponent implements AfterViewInit,OnChanges,OnDestroy {
  @ViewChild('canvas',{static:true}) canvas!:ElementRef<HTMLDivElement>;
  private auth=inject(AuthService);
  stations=input<Station[]>([]); selectedId=input<string|null>(null); fuel=input(''); stationSelected=output<Station>();
  wobble=signal(true); strength=signal(55);
  admin(){return this.auth.user()?.role==='ADMIN';}
  private map?:L.Map; private markers=L.layerGroup(); tileError=false; private fitted=false;
  private bodies=new Map<string,{x:number;y:number;vx:number;vy:number;k:number;d:number}>();
  private anchor=L.latLng(56.95,24.1); private last?:L.Point; private frame=0; private prev=0;
  ngAfterViewInit(){
    this.map=L.map(this.canvas.nativeElement).setView([56.88,24.6],7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).on('tileerror',()=>this.tileError=true).addTo(this.map);
    this.markers.addTo(this.map);
    this.map.on('move',()=>this.kick());
    this.draw();
  }
  ngOnChanges(changes:SimpleChanges){if(this.map)this.draw();}
  private draw(){
    this.markers.clearLayers();
    const fuel=this.fuel();
    const priced=fuel?this.stations().map(s=>s.fuelPrices.find(p=>p.fuelType===fuel)).filter(p=>p!==undefined).map(p=>Number(p.price)):[];
    const min=Math.min(...priced),max=Math.max(...priced);
    for(const s of this.stations()){
      const selected=s.id===this.selectedId();
      const price=fuel?s.fuelPrices.find(p=>p.fuelType===fuel):undefined;
      let marker:L.Marker|L.CircleMarker;
      if(price){
        const estimate=isEstimate(price);
        const colour=this.colour(max>min?(Number(price.price)-min)/(max-min):0);
        const pill=document.createElement('span');
        pill.className='price-pin'+(estimate?' estimate':'')+(selected?' selected':'');
        pill.style.setProperty('--pin',colour);pill.textContent=(estimate?'~':'')+price.price;
        marker=L.marker([s.latitude,s.longitude],{icon:L.divIcon({html:pill,className:'price-pin-wrap',iconSize:[58,26],iconAnchor:[29,13]}),
          zIndexOffset:selected?1000:estimate?0:500});
      }else{
        marker=L.circleMarker([s.latitude,s.longitude],{radius:selected?14:10,color:'#fff',weight:3,
          fillColor:selected?'#f59e0b':'#0d9488',fillOpacity:1});
      }
      const label=document.createElement('span');label.textContent=s.name;
      this.body(s.id,s.latitude);
      marker.on('add',()=>{
        const el=marker.getElement();
        const node=(el?.querySelector('.price-pin') ?? el) as HTMLElement | null;
        if(node) node.dataset['station']=s.id;
      });
      marker.bindTooltip(label).on('click',()=>this.stationSelected.emit(s)).addTo(this.markers);
    }
    const selected=this.stations().find(s=>s.id===this.selectedId());
    if(selected)this.map?.panTo([selected.latitude,selected.longitude]);
    else if(!this.fitted && this.stations().length){
      this.map?.fitBounds(L.latLngBounds(this.stations().map(s=>[s.latitude,s.longitude] as L.LatLngTuple)),{padding:[30,30]});this.fitted=true;}
  }
  private colour(t:number){return `hsl(${Math.round(140-140*t)} 70% 36%)`;}
  private body(id:string,lat:number){
    let b=this.bodies.get(id);
    if(!b){
      const n=(Math.sin(lat*40)+1)/2;
      b={x:0,y:0,vx:0,vy:0,k:0.14+n*0.1,d:0.16+n*0.1};
      this.bodies.set(id,b);
    }
    return b;
  }
  private kick(){
    if(!this.map) return;
    const p=this.map.latLngToContainerPoint(this.anchor);
    const prev=this.last; this.last=p;
    if(!prev) return;
    const dx=Math.max(-48,Math.min(48,p.x-prev.x)), dy=Math.max(-48,Math.min(48,p.y-prev.y));
    if(!dx && !dy) return;
    const gain=this.wobble()?this.strength()/100:0;
    if(!gain) return;
    for(const b of this.bodies.values()){b.vx-=dx*gain; b.vy-=dy*gain;}
    this.wake();
  }
  private wake(){if(!this.frame){this.prev=performance.now(); this.frame=requestAnimationFrame(this.step);}}
  private step=(now:number)=>{
    const dt=Math.min(2,(now-this.prev)/16.67); this.prev=now; let moving=false;
    for(const [id,b] of this.bodies){
      b.vx+= -b.k*b.x*dt; b.vy+= -b.k*b.y*dt;
      const drag=Math.exp(-b.d*dt); b.vx*=drag; b.vy*=drag;
      b.x+=b.vx*dt; b.y+=b.vy*dt;
      if(Math.hypot(b.x,b.y,b.vx,b.vy)>0.2) moving=true;
      const node=this.canvas.nativeElement.querySelector(`[data-station="${id}"]`) as HTMLElement | null;
      if(!node) continue;
      node.style.transformBox='fill-box';
      node.style.transformOrigin=node.classList.contains('price-pin')?'center bottom':'center';
      node.style.transform=`translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px) rotate(${(b.x*0.9).toFixed(2)}deg)`;
    }
    this.frame=moving?requestAnimationFrame(this.step):0;
  };
  ngOnDestroy(){if(this.frame) cancelAnimationFrame(this.frame); this.map?.remove();}
}
