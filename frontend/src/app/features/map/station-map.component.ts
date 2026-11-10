import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, SimpleChanges, ViewChild, input, output } from '@angular/core';
import * as L from 'leaflet';
import { Station, isEstimate } from '../../core/models';
@Component({selector:'app-station-map',standalone:true,template:`
<div #canvas class="map-canvas" aria-label="DUS karte"></div>
@if(fuel()){<div class="map-legend"><span>lētāk</span><i></i><span>dārgāk</span><b>~ aplēse</b></div>}
@if(tileError){<div class="map-warning">Kartes flīzes nav pieejamas. DUS vari izvēlēties sarakstā.</div>}`,
styles:[`:host{display:block;position:relative;height:100%;min-height:420px}.map-canvas{height:100%;min-height:420px}.map-warning{position:absolute;bottom:30px;left:15px;z-index:500;background:white;padding:12px;border-radius:8px}`]})
export class StationMapComponent implements AfterViewInit,OnChanges,OnDestroy {
  @ViewChild('canvas',{static:true}) canvas!:ElementRef<HTMLDivElement>;
  stations=input<Station[]>([]); selectedId=input<string|null>(null); fuel=input(''); stationSelected=output<Station>();
  private map?:L.Map; private markers=L.layerGroup(); tileError=false; private fitted=false;
  ngAfterViewInit(){
    this.map=L.map(this.canvas.nativeElement).setView([56.88,24.6],7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).on('tileerror',()=>this.tileError=true).addTo(this.map);
    this.markers.addTo(this.map);this.draw();
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
      marker.bindTooltip(label).on('click',()=>this.stationSelected.emit(s)).addTo(this.markers);
    }
    const selected=this.stations().find(s=>s.id===this.selectedId());
    if(selected)this.map?.panTo([selected.latitude,selected.longitude]);
    else if(!this.fitted && this.stations().length){
      this.map?.fitBounds(L.latLngBounds(this.stations().map(s=>[s.latitude,s.longitude] as L.LatLngTuple)),{padding:[30,30]});this.fitted=true;}
  }
  private colour(t:number){return `hsl(${Math.round(140-140*t)} 70% 36%)`;}
  ngOnDestroy(){this.map?.remove();}
}
