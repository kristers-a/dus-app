export interface CurrentUser { username: string; role: 'USER'|'MODERATOR'|'ADMIN'; }
export interface FuelPrice { fuelType: string; price: string; updatedAt: string; }
export interface Station { id: string; name: string; address: string; latitude: number;
  longitude: number; description: string; fuelPrices: FuelPrice[]; }
export interface PriceSuggestion { id: string; stationId: string; fuelType: string;
  proposedPrice: string; submittedBy: string; submittedAt: string; status: string; }
export const fuelLabels: Record<string,string> = {
  PETROL_95:'95 benzīns', PETROL_98:'98 benzīns', DIESEL:'Dīzelis', LPG:'Autogāze'
};
export function apiError(error: any): string {
  return error.status === 401 ? 'Sesija beigusies vai nepareizs lietotājvārds/parole.'
    : error.error?.message ?? (error.status === 403 ? 'Nav piekļuves vai nederīgs drošības tokens. Mēģini vēlreiz.'
    : 'Pieprasījums neizdevās. Pārbaudi backend savienojumu.');
}
