import { MarketPrice } from '../types';
import { repository } from './storageService';

export interface MarketPriceResult {
  data: MarketPrice[];
  isLive: boolean;
  source: string;
  lastUpdated: string;
  note?: string;
}

export const marketPriceService = {
  async getMarketPrices(commodity?: string, district?: string): Promise<MarketPriceResult> {
    const marketApiUrl = import.meta.env.VITE_MARKET_API_BASE_URL;
    const marketApiKey = import.meta.env.VITE_MARKET_API_KEY;

    // Check if live API is configured
    if (marketApiUrl && marketApiKey) {
      try {
        const url = `${marketApiUrl}?api-key=${marketApiKey}&format=json&limit=50${
          commodity ? `&filters[commodity]=${encodeURIComponent(commodity)}` : ''
        }`;
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          if (json.records && Array.isArray(json.records)) {
            const mapped: MarketPrice[] = json.records.map((r: any, index: number) => ({
              id: `api-mp-${index}`,
              commodity: r.commodity || commodity || 'Agri Commodity',
              variety: r.variety || 'Standard',
              market: r.market || 'APMC Mandi',
              district: r.district || 'Karnataka',
              state: r.state || 'Karnataka',
              min_price: Number(r.min_price) || 0,
              max_price: Number(r.max_price) || 0,
              modal_price: Number(r.modal_price) || 0,
              unit: 'Quintal',
              price_date: r.arrival_date || new Date().toISOString().slice(0, 10),
              source: 'Government of India Agmarknet Live Portal',
              source_url: 'https://agmarknet.gov.in',
              fetched_at: new Date().toISOString(),
            }));
            repository.saveMarketPrices(mapped);
            return {
              data: mapped,
              isLive: true,
              source: 'Government of India Agmarknet Live Portal',
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('Live Agmarknet API sync unavailable, falling back to verified cached dataset:', err);
      }
    }

    // Fallback to verified cached mandi data
    let prices = repository.getMarketPrices();
    if (commodity && commodity !== 'all') {
      prices = prices.filter((p) => p.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    if (district && district !== 'all') {
      prices = prices.filter((p) => p.district.toLowerCase() === district.toLowerCase());
    }

    return {
      data: prices,
      isLive: false,
      source: 'Verified Mandi Reference Records (CAMPCO & AGMARKNET Karnataka)',
      lastUpdated: prices[0]?.fetched_at || new Date().toISOString(),
      note: 'Showing latest verified mandi bulletin data. Reference prices may vary by grade, variety, moisture content, and market arrival.',
    };
  },

  // Mandi reference comparison helper for a specific farmer product
  async getReferenceForProduct(commodityName: string): Promise<MarketPrice | undefined> {
    const { data } = await this.getMarketPrices();
    return data.find((p) =>
      p.commodity.toLowerCase().includes(commodityName.toLowerCase()) ||
      commodityName.toLowerCase().includes(p.commodity.toLowerCase())
    );
  },
};
