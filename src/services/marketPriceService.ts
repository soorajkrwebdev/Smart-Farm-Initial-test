import { MarketPrice } from '../types';
import { repository } from './storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

    if (marketApiUrl && marketApiKey && !marketApiKey.includes('your-data-gov-in-api-key')) {
      try {
        const url = `${marketApiUrl}?api-key=${marketApiKey}&format=json&limit=50${
          commodity ? `&filters[commodity]=${encodeURIComponent(commodity)}` : ''
        }`;
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          if (json.records && Array.isArray(json.records)) {
            const mapped: MarketPrice[] = json.records.map((r: any, index: number) => ({
              id: `api-mp-${Date.now()}-${index}`,
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
            if (isSupabaseConfigured && supabase) {
              try {
                const toUpsert = mapped.slice(0, 50).map(({ id: _id, ...rest }) => ({ ...rest }));
                await supabase.from('market_prices').insert(toUpsert as any);
              } catch { /* ignore cache write errors */ }
            } else {
              repository.saveMarketPrices(mapped);
            }
            return {
              data: mapped,
              isLive: true,
              source: 'Government of India Agmarknet Live Portal (Real-time)',
              lastUpdated: new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('Live Agmarknet API sync unavailable, falling back to cached dataset:', err);
      }
    }

    let prices: MarketPrice[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('market_prices').select('*').order('fetched_at', { ascending: false }).limit(100);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          prices = data as MarketPrice[];
        }
      } catch (e) {
        console.warn('Supabase market_prices fetch failed, using localStorage fallback:', e);
      }
    }

    if (prices.length === 0) {
      prices = repository.getMarketPrices();
    }

    if (commodity && commodity !== 'all') {
      prices = prices.filter((p) => p.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    if (district && district !== 'all') {
      prices = prices.filter((p) => p.district.toLowerCase() === district.toLowerCase());
    }

    const lastUpdate = prices[0]?.fetched_at || new Date().toISOString();
    return {
      data: prices,
      isLive: false,
      source: 'Supabase PostgreSQL Cache / Verified Mandi Reference Records (CAMPCO & AGMARKNET Karnataka)',
      lastUpdated: lastUpdate,
      note: '[CACHED REFERENCE DATA] Showing latest verified mandi bulletin reference prices. These may vary by grade, variety, moisture content, and market arrival. To enable live API sync, configure VITE_MARKET_API_BASE_URL and VITE_MARKET_API_KEY.',
    };
  },

  async getReferenceForProduct(commodityName: string): Promise<MarketPrice | undefined> {
    const { data } = await this.getMarketPrices();
    return data.find((p) =>
      p.commodity.toLowerCase().includes(commodityName.toLowerCase()) ||
      commodityName.toLowerCase().includes(p.commodity.toLowerCase())
    );
  },
};
