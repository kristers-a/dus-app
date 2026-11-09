import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, SimpleChanges, ViewChild, input, output } from '@angular/core';
import * as L from 'leaflet';
import { Station } from '../../core/models';
@Component({selector:'app-station-map',standalone:true,template:`
<div #canvas class="map-canvas" aria-label="DUS karte"></div>
@if(tileError){<div class="map-warning">Kartes flīzes nav pieejamas. DUS vari izvēlēties sarakstā.</div>}`,
styles:[`:host{display:block;position:relative;height:100%;min-height:420px}.map-canvas{height:100%;min-height:420px}.map-warning{position:absolute;bottom:30px;left:15px;z-index:500;background:white;padding:12px;border-radius:8px}`]})
export class StationMapComponent implements AfterViewInit,OnChanges,OnDestroy {
  @ViewChild('canvas',{static:true}) canvas!:ElementRef<HTMLDivElement>;
  stations=input<Station[]>([]); selectedId=input<string|null>(null); stationSelected=output<Station>();
  private map?:L.Map; private markers=L.layerGroup(); tileError=false;
  ngAfterViewInit(){
    this.map=L.map(this.canvas.nativeElement).setView([56.9496,24.1052],12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).on('tileerror',()=>this.tileError=true).addTo(this.map);
    this.markers.addTo(this.map);this.draw();
  }
  ngOnChanges(changes:SimpleChanges){if(this.map)this.draw();}
  private draw(){
    this.markers.clearLayers();
    for(const s of this.stations()){
      const selected=s.id===this.selectedId();
      const marker=L.circleMarker([s.latitude,s.longitude],{radius:selected?14:10,color:'#fff',weight:3,
        fillColor:selected?'#f59e0b':'#0d9488',fillOpacity:1});
      const label=document.createElement('span');label.textContent=s.name;
      marker.bindTooltip(label).on('click',()=>this.stationSelected.emit(s)).addTo(this.markers);
    }
    const selected=this.stations().find(s=>s.id===this.selectedId());
    if(selected)this.map?.panTo([selected.latitude,selected.longitude]);
  }
  ngOnDestroy(){this.map?.remove();}
}
