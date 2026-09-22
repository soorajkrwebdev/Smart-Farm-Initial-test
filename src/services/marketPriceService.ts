import { MarketPrice } from '../types';
import { repository } from './storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * How the returned market-price payload was produced:
 *  - 'live'   → the secure Edge Function refreshed Supabase during this call
 *               (or the server deliberately reused a copy that is inside the
 *               freshness window and reported it as still current).
 *  - 'cached' → Supabase rows that were NOT freshly fetched by this call.
 *  - 'local'  → no Supabase rows available; on-device previously stored records.
 */
export type MarketDataStatus = 'live' | 'cached' | 'local';

export interface MarketRefreshResult {
  /** Whether the secure Edge Function was actually called. */
  attempted: boolean;
  /** Whether the refresh pipeline completed without error. */
  ok: boolean;
  /** Whether Supabase was actually updated with new mandi records. */
  refreshed: boolean;
  /** Server-side rate limit skipped the upstream fetch (data already current). */
  throttled: boolean;
  /** Real time of the successful upstream fetch (from the Edge Function). */
  fetchedAt?: string | null;
  /** Newest price_date returned by the government feed. */
  priceDate?: string | null;
  recordsUpserted?: number;
  recordsReceived?: number;
  error?: string;
  message?: string;
}

export interface MarketPriceResult {
  data: MarketPrice[];
  /** True only when the displayed rows were freshly fetched by this call. */
  isLive: boolean;
  status: MarketDataStatus;
  source: string;
  /** fetched_at of the newest displayed record — the real last sync time. */
  lastUpdated: string;
  /** price_date published by the government feed for the newest record. */
  priceDate?: string;
  refresh: MarketRefreshResult;
  note?: string;
}

export interface MarketPriceOptions {
  /**
   * `'auto'` (default) asks the Edge Function on every load — the function
   * itself throttles how often the government API is actually called.
   * `true` asks and bypasses that throttle, `false` never asks.
   */
  refresh?: boolean | 'auto';
  /** Bypass the Edge Function's server-side throttle (manual refresh button). */
  force?: boolean;
}

const EDGE_FUNCTION_NAME = 'refresh-market-prices';
/**
 * Only used for wording: how old a stored copy has to be before the CACHED
 * notice calls it out as notably old. Freshness itself is decided by the
 * server-side throttle inside the Edge Function.
 */
export const MARKET_DATA_STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_ROWS = 300;

const LIVE_SOURCE =
  'LIVE — AGMARKNET (data.gov.in) mandi feed, refreshed server-side by the secure Supabase Edge Function';
const CACHED_SOURCE = 'CACHED — Supabase market_prices cache (AGMARKNET / Open Government Data India)';
const LOCAL_SOURCE = 'CACHED (device) — previously stored reference records';

function timeValue(value?: string | null): number {
  if (!value) return NaN;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** One row per commodity + mandi (+ variety), i.e. per published bulletin. */
function bulletinKey(price: MarketPrice): string {
  return [price.commodity, price.market, price.district, price.variety ?? '']
    .join('|')
    .toLowerCase();
}

/** Newest bulletin date first, newest sync as the tie-breaker, then collapse duplicates. */
function sortAndCollapse(rows: MarketPrice[]): MarketPrice[] {
  const sorted = [...rows].sort((a, b) => {
    const byDate = String(b.price_date || '').localeCompare(String(a.price_date || ''));
    if (byDate !== 0) return byDate;
    return (timeValue(b.fetched_at) || 0) - (timeValue(a.fetched_at) || 0);
  });

  const seen = new Set<string>();
  const collapsed: MarketPrice[] = [];
  for (const row of sorted) {
    const key = bulletinKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    collapsed.push(row);
  }
  return collapsed;
}

function newestFetchedAt(rows: MarketPrice[]): string | undefined {
  let newest: string | undefined;
  let newestMs = -Infinity;
  for (const row of rows) {
    const ms = timeValue(row.fetched_at);
    if (Number.isFinite(ms) && ms > newestMs) {
      newestMs = ms;
      newest = row.fetched_at;
    }
  }
  return newest;
}

function newestPriceDate(rows: MarketPrice[]): string | undefined {
  let newest: string | undefined;
  for (const row of rows) {
    if (!row.price_date) continue;
    if (!newest || row.price_date > newest) newest = row.price_date;
  }
  return newest;
}

function matches(price: MarketPrice, commodity?: string, district?: string): boolean {
  if (commodity && commodity !== 'all' && !price.commodity.toLowerCase().includes(commodity.toLowerCase())) {
    return false;
  }
  if (district && district !== 'all' && (price.district || '').toLowerCase() !== district.toLowerCase()) {
    return false;
  }
  return true;
}

/** Supabase is the application's source of truth for market prices. */
async function readSupabasePrices(): Promise<{ rows: MarketPrice[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { rows: [] };

  const { data, error } = await supabase
    .from('market_prices')
    .select('*')
    .order('price_date', { ascending: false })
    .order('fetched_at', { ascending: false })
    .limit(MAX_ROWS);

  if (error) return { rows: [], error: error.message };
  return { rows: (data || []) as MarketPrice[] };
}

/** Pull a readable message out of a failed `functions.invoke` call. */
async function describeFunctionError(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : String(error);
  const context = (error as { context?: unknown } | null)?.context;
  if (context && typeof (context as Response).json === 'function') {
    try {
      const body = (await (context as Response).json()) as { error?: string; message?: string };
      const detail = body?.error || body?.message;
      if (detail) return detail;
    } catch {
      /* response body was not JSON */
    }
  }
  return fallback;
}

/**
 * Ask the secure Edge Function to refresh the mandi feed.
 * The data.gov.in API key never reaches the browser — it lives only in the
 * `MARKET_API_KEY` Supabase secret used by the Edge Function.
 */
export async function refreshMarketPrices(
  params: { force?: boolean; commodity?: string; district?: string; state?: string } = {}
): Promise<MarketRefreshResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      attempted: false,
      ok: false,
      refreshed: false,
      throttled: false,
      error:
        'Supabase is not configured, so the secure mandi refresh service is unavailable.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
      body: {
        state: params.state,
        district: params.district,
        commodity: params.commodity,
        force: params.force === true,
      },
    });

    if (error) {
      return {
        attempted: true,
        ok: false,
        refreshed: false,
        throttled: false,
        error: await describeFunctionError(error),
      };
    }

    const payload = (data || {}) as Record<string, unknown>;
    const numeric = (value: unknown): number | undefined =>
      typeof value === 'number' && Number.isFinite(value) ? value : undefined;

    return {
      attempted: true,
      ok: payload.ok === true,
      refreshed: payload.refreshed === true,
      throttled: payload.throttled === true,
      fetchedAt: typeof payload.fetchedAt === 'string' ? payload.fetchedAt : null,
      priceDate: typeof payload.latestPriceDate === 'string' ? payload.latestPriceDate : null,
      recordsUpserted: numeric(payload.recordsUpserted),
      recordsReceived: numeric(payload.recordsReceived),
      message: typeof payload.message === 'string' ? payload.message : undefined,
      error:
        payload.ok === true
          ? undefined
          : typeof payload.error === 'string'
            ? payload.error
            : undefined,
    };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      refreshed: false,
      throttled: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}


/** Human phrasing for how long ago a timestamp was, used in cache notices. */
function ageText(iso?: string | null): string {
  const ms = timeValue(iso);
  if (!Number.isFinite(ms)) return 'unknown age';
  const minutes = Math.max(Math.floor((Date.now() - ms) / 60_000), 0);
  if (minutes < 60) return `${minutes} minute(s) ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hour(s) ago`;
  return `${Math.floor(hours / 24)} day(s) ago`;
}

function cachedNote(refresh: MarketRefreshResult, lastUpdated?: string): string {
  let reason = '';
  if (!refresh.attempted) {
    reason = 'The live mandi refresh was not requested for this request. ';
  } else if (!refresh.ok) {
    reason = `Live refresh failed (${refresh.error || 'unknown error'}). `;
  } else if (!refresh.refreshed) {
    reason = `${refresh.message || 'The live refresh returned no new records.'} `;
  }

  const age =
    lastUpdated && Date.now() - timeValue(lastUpdated) > MARKET_DATA_STALE_AFTER_MS
      ? `The stored copy was last synced ${ageText(lastUpdated)}. `
      : '';
  return (
    `[CACHED DATA] ${reason}${age}Showing the most recently fetched mandi bulletins already stored in ` +
    'Supabase. Check "Last updated" and "Market data date" below — these are previously fetched prices, ' +
    'not real-time quotes.'
  );
}

export const marketPriceService = {
  refreshMarketPrices,

  async getMarketPrices(
    commodity?: string,
    district?: string,
    options: MarketPriceOptions = {}
  ): Promise<MarketPriceResult> {
    const refreshMode = options.refresh ?? 'auto';

    // 1. Supabase is the application's source of truth — always read it first.
    let read = await readSupabasePrices();
    let rows = sortAndCollapse(read.rows);

    let refresh: MarketRefreshResult = {
      attempted: false,
      ok: false,
      refreshed: false,
      throttled: false,
    };

    // 2. Ask the secure Edge Function to refresh. The function throttles the
    //    government API itself, so 'auto' is cheap: requests inside the
    //    freshness window only re-confirm the stored copy.
    if (refreshMode !== false) {
      refresh = await refreshMarketPrices({ force: options.force === true || refreshMode === true });
      if (refresh.ok) {
        const reread = await readSupabasePrices();
        if (reread.rows.length > 0) {
          read = reread;
          rows = sortAndCollapse(reread.rows);
        }
      }
    }

    const usingSupabase = rows.length > 0 && !read.error;
    const syncedAt = usingSupabase ? newestFetchedAt(rows) : undefined;

    let status: MarketDataStatus;
    if (usingSupabase && refresh.ok && (refresh.refreshed || refresh.throttled)) {
      // Either new bulletin rows were written, or the server confirmed that the
      // stored copy is still inside its freshness window (never old data).
      status = 'live';
    } else if (usingSupabase) {
      status = 'cached';
    } else {
      status = 'local';
    }

    let data = rows.filter((price) => matches(price, commodity, district));
    if (!usingSupabase) {
      data = sortAndCollapse(repository.getMarketPrices()).filter((price) =>
        matches(price, commodity, district)
      );
    }

    if (status === 'live') {
      return {
        data,
        isLive: true,
        status,
        source: LIVE_SOURCE,
        lastUpdated: syncedAt || refresh.fetchedAt || new Date().toISOString(),
        priceDate: newestPriceDate(data) || refresh.priceDate || undefined,
        refresh,
        note: refresh.refreshed ? undefined : refresh.message,
      };
    }

    if (status === 'cached') {
      const cachedAt = syncedAt || refresh.fetchedAt || '';
      return {
        data,
        isLive: false,
        status,
        source: CACHED_SOURCE,
        lastUpdated: cachedAt,
        priceDate: newestPriceDate(data),
        refresh,
        note: cachedNote(refresh, cachedAt),
      };
    }

    return {
      data,
      isLive: false,
      status,
      source: LOCAL_SOURCE,
      lastUpdated: newestFetchedAt(data) || '',
      priceDate: newestPriceDate(data),
      refresh,
      note:
        '[ON-DEVICE CACHE] Supabase market_prices has no rows available right now, so previously stored ' +
        'reference records are shown. Deploy/refresh the secure mandi service to load current bulletins.',
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

