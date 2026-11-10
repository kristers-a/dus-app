export interface CurrentUser { username: string; role: 'USER'|'MODERATOR'|'ADMIN'; }
export type PriceKind = 'listed'|'estimated_group'|'estimated_chain'|'estimated_market';
export interface FuelPrice { fuelType: string; price: string; updatedAt: string; kind?: PriceKind|null;
  source?: string|null; sourceUrl?: string|null; effectiveDate?: string|null; }
export interface HistoryPoint { fuelType: string; price: string; date: string; }
export interface Station { id: string; name: string; address: string; latitude: number;
  longitude: number; description: string; fuelPrices: FuelPrice[]; chain?: string|null;
  stationType?: string|null; demo?: boolean; fuels?: string[]|null; priceHistory?: HistoryPoint[]|null; }
export interface PriceSource { chain: string; label: string; updatedAt?: string|null; url?: string|null; note?: string|null; }
export interface PriceSuggestion { id: string; stationId: string; fuelType: string;
  proposedPrice: string; submittedBy: string; submittedAt: string; status: string; }
export const fuelLabels: Record<string,string> = {
  PETROL_95:'95 benzīns', PETROL_98:'98 benzīns', DIESEL:'Dīzelis', LPG:'Autogāze'
};
export const chainLabels: Record<string,string> = {
  circlek:'Circle K', virsi:'Virši', neste:'Neste', viada:'Viada', straujupite:'Straujupīte', kool:'Kool', other:'Citi'
};
export const kindLabels: Record<PriceKind,string> = {
  listed:'publicēta cena', estimated_group:'aplēse pēc līdzīgām tīkla stacijām',
  estimated_chain:'aplēse pēc tīkla cenām', estimated_market:'aplēse pēc visu tīklu cenām'
};
export function isEstimate(p: FuelPrice): boolean { return !!p.kind && p.kind !== 'listed'; }
export function apiError(error: any): string {
  return error.status === 401 ? 'Sesija beigusies vai nepareizs lietotājvārds/parole.'
    : error.error?.message ?? (error.status === 403 ? 'Nav piekļuves vai nederīgs drošības tokens. Mēģini vēlreiz.'
    : 'Pieprasījums neizdevās. Pārbaudi backend savienojumu.');
}
