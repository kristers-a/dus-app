import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Station, PriceSuggestion, PriceSource } from './models';
@Injectable({providedIn:'root'})
export class StationService {
  private http=inject(HttpClient);
  all() { return this.http.get<Station[]>('/api/stations'); }
  sources() { return this.http.get<PriceSource[]>('/api/stations/sources'); }
  suggest(stationId:string,fuelType:string,price:string) {
    return this.http.post('/api/price-suggestions',{stationId,fuelType,price});
  }
  update(stationId:string,fuelType:string,price:string) {
    return this.http.put('/api/moderation/prices',{stationId,fuelType,price});
  }
  pending() { return this.http.get<PriceSuggestion[]>('/api/moderation/suggestions'); }
  review(id:string,decision:string,reason='') {
    return this.http.post(`/api/moderation/suggestions/${id}/review`,{decision,reason});
  }
}
