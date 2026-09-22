// =====================================================================
// FarmNexa — Secure Mandi Market Price Refresh (Supabase Edge Function)
// =====================================================================
// PURPOSE
//   Fetch the current mandi price feed from the official Government of
//   India Open Data platform (data.gov.in / AGMARKNET), validate it,
//   normalise it into the existing `public.market_prices` schema and
//   upsert it so that Supabase stays the application's source of truth.
//
// WHY MULTIPLE REQUESTS
//   The resource `9ef84268-...` returns a paginated slice of the national
//   feed. A single `limit=500&offset=0` request only returns the first page,
//   which does NOT contain every Karnataka commodity — sparse but
//   commercially critical crops (Arecanut, Coconut, Black Pepper) fall
//   outside that page. This function therefore:
//     1. sweeps Karnataka with pagination (keeps every commodity FarmNexa
//        already supports — nothing is ever removed), and
//     2. runs dedicated, paginated commodity-filtered queries for the
//        commercial crops, trying each known commodity-name spelling the
//        government feed uses until one returns records.
//   Records are also bucketed by a normalised commodity name, so spelling
//   differences ("Arecanut", "Arecanut(Betelnut/Supari)") never hide a crop.
//
// SECURITY
//   The data.gov.in API key is read from the Supabase secret `MARKET_API_KEY`.
//   It is never returned in a response, never logged and never shipped to
//   the browser (the frontend calls this function instead of the gov API).
//   Database writes use the platform-injected SUPABASE_SERVICE_ROLE_KEY.
//
// REQUIRED SUPABASE SECRET
//   MARKET_API_KEY = <api key from https://data.gov.in/my-profile>
//
// OPTIONAL SUPABASE SECRETS (safe defaults built in)
//   MARKET_API_BASE_URL                  (default: https://api.data.gov.in/resource)
//   MARKET_API_RESOURCE_ID               (default: 9ef84268-d588-465a-a308-a864a43d0070)
//   MARKET_API_STATE_FILTER              (default: Karnataka)
//   MARKET_API_PAGE_SIZE                 (default: 500, max 1000)
//   MARKET_API_SWEEP_MAX_PAGES           (default: 4)
//   MARKET_API_CROP_MAX_PAGES            (default: 8)
//   MARKET_API_REQUEST_TIMEOUT_MS        (default: 20000)
//   MARKET_API_TIME_BUDGET_MS            (default: 90000)
//   MARKET_API_INCLUDE_GENERAL           (default: true)
//   MARKET_REFRESH_MIN_INTERVAL_MINUTES  (default: 10)
//
// DEPLOY
//   supabase functions deploy refresh-market-prices
// =====================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ---- Official government data source (AGMARKNET via data.gov.in) ------
const DEFAULT_API_BASE_URL = 'https://api.data.gov.in/resource';
const DEFAULT_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const DEFAULT_STATE_FILTER = 'Karnataka';
const DEFAULT_STATE_NAME = 'Karnataka';

// ---- Pagination, budgets and batching --------------------------------
const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 1000;
const DEFAULT_SWEEP_MAX_PAGES = 4;
const DEFAULT_CROP_MAX_PAGES = 8;
const MAX_PAGES_LIMIT = 40;
const UPSERT_CHUNK_SIZE = 250;
const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;
const DEFAULT_TIME_BUDGET_MS = 90_000;
const REQUEST_SPACING_MS = 120;

// ---- Server-side throttle -------------------------------------------
// Never hammer the government API; Supabase is only refreshed when the
// stored copy is older than this window (or the caller forces a refresh).
const DEFAULT_MIN_INTERVAL_MINUTES = 10;

// ---- Source identity stored on every row -----------------------------
const SOURCE_NAME = 'Government of India - data.gov.in / AGMARKNET';
const SOURCE_URL =
  'https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi';
// Historic labels are still recognised by the refresh throttle lookup.
const LEGACY_SOURCE_NAMES = [
  'AGMARKNET (data.gov.in) — Government of India Mandi Prices',
  'Agmarknet / Open Government Data India',
];
const KNOWN_SOURCE_NAMES = [SOURCE_NAME, ...LEGACY_SOURCE_NAMES];
const PRICE_UNIT = 'Quintal';

// ---- Existing unique constraint (unchanged) --------------------------
// supabase/migrations/20260920120000_market_prices_dedupe_unique_key.sql
const NATURAL_KEY_COLUMNS = 'commodity,market,district,price_date,variety';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RefreshRequest {
  state?: string;
  district?: string;
  commodity?: string;
  /** Page size for every upstream request (legacy alias: `limit`). */
  pageSize?: number;
  limit?: number;
  /** Start offset of the Karnataka sweep (legacy pagination hook). */
  offset?: number;
  /** Override the page cap for both the sweep and the crop queries. */
  maxPages?: number;
  /** Subset of commercial crop keys to query (default: all). */
  crops?: string[];
  /** Set false to skip the general Karnataka sweep. */
  includeGeneral?: boolean;
  /** Echo the per-request diagnostics log in the response (the API key is never included). */
  debug?: boolean;
  /** Bypass the server-side throttle. */
  force?: boolean;
}

interface GovernmentRecord {
  state?: unknown;
  district?: unknown;
  market?: unknown;
  commodity?: unknown;
  variety?: unknown;
  grade?: unknown;
  arrival_date?: unknown;
  min_price?: unknown;
  max_price?: unknown;
  modal_price?: unknown;
}

interface MarketPriceRow {
  commodity: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
  price_date: string;
  source: string;
  source_url: string;
  fetched_at: string;
}

interface CropTarget {
  /** Stable response key, e.g. `black_pepper`. */
  key: string;
  label: string;
  /** Exact commodity values tried with `filters[commodity]=...`. */
  filters: string[];
  /** Tested against the normalised commodity name returned by the feed. */
  matches: (normalised: string) => boolean;
}

// ---- Commercial crops FarmNexa must always carry -----------------------
// The government feed publishes the same crop under several spellings
// ("Arecanut", "Arecanut(Betelnut/Supari)", "Black Pepper", "Black pepper", …),
// so every known variant is attempted and the returned name is also matched
// case/punctuation-insensitively. Nothing is ever invented: if a variant
// returns zero records the crop simply reports 0.
const CROP_TARGETS: CropTarget[] = [
  {
    key: 'arecanut',
    label: 'Arecanut',
    filters: [
      'Arecanut',
      'Arecanut(Betelnut/Supari)',
      'Arecanut (Betelnut/Supari)',
      'Arecanut(Betelnut)',
      'Betelnut',
      'Betel Nut',
      'Supari',
    ],
    matches: (n) => /arecanut|areca ?nut|betelnut|betel ?nut|supari/.test(n),
  },
  {
    key: 'coconut',
    label: 'Coconut',
    filters: [
      'Coconut',
      'Coconut(Copra)',
      'Coconut (Copra)',
      'Copra',
      'Tender Coconut',
    ],
    matches: (n) => /coconut|copra|kobbari/.test(n),
  },
  {
    key: 'black_pepper',
    label: 'Black Pepper',
    filters: [
      'Black Pepper',
      'Black pepper',
      'Blackpepper',
      'Pepper',
      'Pepper(Black)',
      'Pepper (Black)',
    ],
    matches: (n) => /black ?pepper|pepper/.test(n),
  },
];

function cropTargetByKey(key: string): CropTarget | undefined {
  const wanted = normalizeCommodity(key).replace(/[^a-z]/g, '');
  return CROP_TARGETS.find((crop) => crop.key.replace(/_/g, '') === wanted);
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function fail(message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return jsonResponse({ ok: false, refreshed: false, error: message, ...extra }, status);
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

/** Coerce government feed values such as "4,250" or "4250.00" into a number. */
function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(asText(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Positive whole number from env/body values, clamped between min and max. */
function asInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

/** "Karnataka"/"Black Pepper" → "karnatakapepper"-style comparison key. */
function normalizeCommodity(value: unknown): string {
  return asText(value).toLowerCase();
}

/** Government feed dates are dd/mm/yyyy — convert to the ISO yyyy-mm-dd used by price_date (DATE). */
function asIsoDate(value: unknown): string | null {
  const raw = asText(value);
  if (!raw) return null;

  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    const valid =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
    if (!valid) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return null;
}

function toTime(value: unknown): number {
  const parsed = Date.parse(asText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Matches the unique index market_prices_natural_key_key (market_prices dedupe migration). */
function naturalKey(row: MarketPriceRow): string {
  return [row.commodity, row.market, row.district, row.price_date, row.variety]
    .join('|')
    .toLowerCase();
}

/** Validate one government record and map it onto the market_prices schema. */
function mapRecord(
  record: GovernmentRecord,
  fallbackState: string,
  fetchedAt: string,
): MarketPriceRow | null {
  const commodity = asText(record.commodity);
  const market = asText(record.market);
  const district = asText(record.district);
  const state = asText(record.state) || fallbackState;
  const priceDate = asIsoDate(record.arrival_date);

  const minPrice = asNumber(record.min_price);
  const maxPrice = asNumber(record.max_price);
  const modalPrice = asNumber(record.modal_price);

  if (!commodity || !market || !district || !priceDate) return null;
  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || !Number.isFinite(modalPrice)) {
    return null;
  }
  if (minPrice < 0 || maxPrice < 0 || modalPrice < 0) return null;
  if (maxPrice < minPrice) return null;

  return {
    commodity,
    // The natural key needs a deterministic value; empty variety means "unspecified".
    variety: asText(record.variety) || asText(record.grade) || 'Other',
    market,
    district,
    state,
    min_price: minPrice,
    max_price: maxPrice,
    modal_price: modalPrice,
    unit: PRICE_UNIT,
    price_date: priceDate,
    source: SOURCE_NAME,
    source_url: SOURCE_URL,
    fetched_at: fetchedAt,
  };
}

// ---------------------------------------------------------------------
// Upstream (server-side only) fetch helpers
// ---------------------------------------------------------------------

interface FeedConfig {
  apiKey: string;
  baseUrl: string;
  resourceId: string;
  timeoutMs: number;
  /** Wall-clock instant after which no new upstream request is started. */
  deadline: number;
}

interface FeedPage {
  /** HTTP status of the upstream call (0 when the request itself failed). */
  status: number;
  records: GovernmentRecord[];
  /** Total matching records reported by data.gov.in for this query, if any. */
  total: number | null;
  error?: string;
}

/** Request log kept for diagnostics — never contains the API key. */
interface FetchLogEntry {
  crop: string;
  commodity: string;
  offset: number;
  limit: number;
  httpStatus: number;
  recordsReceived: number;
  totalAvailable: number | null;
  error?: string;
}

function buildFeedUrl(
  cfg: FeedConfig,
  params: { offset: number; limit: number; state?: string; district?: string; commodity?: string },
): string {
  const url = new URL(`${cfg.baseUrl}/${cfg.resourceId}`);
  // The API key is added here, server-side only, and is never logged or returned.
  url.searchParams.set('api-key', cfg.apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(params.limit));
  url.searchParams.set('offset', String(params.offset));
  if (params.state) url.searchParams.set('filters[state]', params.state);
  if (params.district) url.searchParams.set('filters[district]', params.district);
  if (params.commodity) url.searchParams.set('filters[commodity]', params.commodity);
  return url.toString();
}

async function fetchFeedPage(
  cfg: FeedConfig,
  params: {
    crop: string;
    offset: number;
    limit: number;
    state?: string;
    district?: string;
    commodity?: string;
  },
): Promise<FeedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);
  let status = 0;
  try {
    const response = await fetch(buildFeedUrl(cfg, params), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    status = response.status;

    const text = await response.text();
    let payload: { records?: unknown; total?: unknown; message?: unknown } = {};
    try {
      payload = text ? (JSON.parse(text) as typeof payload) : {};
    } catch {
      return {
        status,
        records: [],
        total: null,
        error: `Upstream returned a non-JSON body (HTTP ${status}).`,
      };
    }

    if (!response.ok) {
      const details = asText(payload?.message).slice(0, 300);
      return {
        status,
        records: [],
        total: null,
        error: `Upstream HTTP ${status}${details ? `: ${details}` : ''}`,
      };
    }
    if (!Array.isArray(payload?.records)) {
      return { status, records: [], total: null, error: 'Upstream payload has no "records" array.' };
    }

    const reportedTotal = Number(asText(payload?.total));
    return {
      status,
      records: payload.records as GovernmentRecord[],
      total: Number.isFinite(reportedTotal) ? reportedTotal : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status, records: [], total: null, error: message };
  } finally {
    clearTimeout(timeout);
  }
}



/** Diagnostics for one crop across every page it fetched. */
interface CropStats {
  label: string;
  /** Commodity filter value that actually produced records. */
  filterUsed: string | null;
  /** Commodity-name variants attempted before one succeeded. */
  filtersTried: string[];
  /** Raw records received across all pages of the successful query. */
  recordsReceived: number;
  /** Records that passed validation and were queued for the upsert. */
  recordsSaved: number;
  pages: number;
  latestPriceDate: string | null;
  /** Commodity names literally returned by the government feed. */
  commodityNamesReturned: string[];
  districts: string[];
  markets: string[];
  errors: string[];
}

function emptyStats(label: string): CropStats {
  return {
    label,
    filterUsed: null,
    filtersTried: [],
    recordsReceived: 0,
    recordsSaved: 0,
    pages: 0,
    latestPriceDate: null,
    commodityNamesReturned: [],
    districts: [],
    markets: [],
    errors: [],
  };
}

/** Outcome of a paginated query for one commodity filter (or the state sweep). */
interface PagedResult {
  records: GovernmentRecord[];
  pagesFetched: number;
  errors: string[];
}

/**
 * Fetch every page of one upstream query until the feed is exhausted, the page
 * cap is reached or the time budget runs out — never just the first page.
 */
async function fetchAllPages(
  cfg: FeedConfig,
  options: {
    cropKey: string;
    commodity?: string;
    state?: string;
    district?: string;
    pageSize: number;
    maxPages: number;
    startOffset?: number;
    logs: FetchLogEntry[];
  },
): Promise<PagedResult> {
  const records: GovernmentRecord[] = [];
  const errors: string[] = [];
  let pagesFetched = 0;
  let offset = options.startOffset ?? 0;
  let total: number | null = null;

  for (let page = 0; page < options.maxPages; page += 1) {
    if (Date.now() >= cfg.deadline) {
      errors.push('Time budget reached before all pages could be fetched.');
      break;
    }

    const result = await fetchFeedPage(cfg, {
      crop: options.cropKey,
      offset,
      limit: options.pageSize,
      state: options.state,
      district: options.district,
      commodity: options.commodity,
    });

    pagesFetched += 1;
    options.logs.push({
      crop: options.cropKey,
      commodity: options.commodity ?? '(all commodities)',
      offset,
      limit: options.pageSize,
      httpStatus: result.status,
      recordsReceived: result.records.length,
      totalAvailable: result.total,
      error: result.error,
    });

    if (result.error) {
      errors.push(result.error);
      break;
    }
    if (result.total !== null) total = result.total;

    records.push(...result.records);
    offset += options.pageSize;

    // Stop when the last page was short or the reported total has been reached.
    if (result.records.length < options.pageSize) break;
    if (total !== null && offset >= total) break;
    if (REQUEST_SPACING_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_SPACING_MS));
    }
  }

  return { records, pagesFetched, errors };
}

/**
 * Query one crop, trying each known commodity-name variant until the feed
 * returns records for it (then paginate that variant fully). An unrecognised
 * variant yields zero records and is simply skipped — never faked.
 */
async function fetchCrop(
  cfg: FeedConfig,
  crop: CropTarget,
  options: {
    state: string;
    district?: string;
    pageSize: number;
    maxPages: number;
    logs: FetchLogEntry[];
    stats: CropStats;
  },
): Promise<GovernmentRecord[]> {
  const collected: GovernmentRecord[] = [];

  for (const variant of crop.filters) {
    const attempt = await fetchAllPages(cfg, {
      cropKey: crop.key,
      commodity: variant,
      state: options.state,
      district: options.district,
      pageSize: options.pageSize,
      maxPages: options.maxPages,
      logs: options.logs,
    });

    options.stats.filtersTried.push(variant);
    options.stats.pages += attempt.pagesFetched;
    options.stats.errors.push(...attempt.errors);

    if (attempt.records.length > 0) {
      options.stats.filterUsed = variant;
      options.stats.recordsReceived = attempt.records.length;
      collected.push(...attempt.records);
      break;
    }

    if (Date.now() >= cfg.deadline) break;
  }

  return collected;
}

// ---------------------------------------------------------------------
// Diagnostics helper (never logs the API key)
// ---------------------------------------------------------------------
function logEvent(event: string, data: Record<string, unknown>): void {
  try {
    console.log(JSON.stringify({ event, ...data }));
  } catch {
    console.log(`[${event}] (unserialisable diagnostics)`);
  }
}

function resolveCropTargets(body: RefreshRequest): CropTarget[] {
  let targets = CROP_TARGETS;

  if (Array.isArray(body.crops) && body.crops.length > 0) {
    const keys = body.crops
      .map((key) => cropTargetByKey(String(key)))
      .filter((crop): crop is CropTarget => Boolean(crop));
    if (keys.length > 0) targets = keys;
  }

  const requested = asText(body.commodity);
  if (requested) {
    const wanted = normalizeCommodity(requested);
    const matched = targets.filter(
      (crop) =>
        normalizeCommodity(crop.label) === wanted ||
        crop.filters.some((variant) => normalizeCommodity(variant) === wanted) ||
        crop.matches(wanted),
    );
    if (matched.length > 0) targets = matched;
  }

  return targets;
}

/** Attach per-crop diagnostics derived from the rows actually queued for upsert. */
function applyRowStats(stats: CropStats, rows: MarketPriceRow[]): void {
  const names = new Set(stats.commodityNamesReturned);
  const districts = new Set(stats.districts);
  const markets = new Set(stats.markets);

  for (const row of rows) {
    stats.recordsSaved += 1;
    names.add(row.commodity);
    districts.add(row.district);
    markets.add(row.market);
    if (!stats.latestPriceDate || row.price_date > stats.latestPriceDate) {
      stats.latestPriceDate = row.price_date;
    }
  }

  stats.commodityNamesReturned = [...names].sort();
  stats.districts = [...districts].sort();
  stats.markets = [...markets].sort();
}


// ---------------------------------------------------------------------
// HTTP entry point
// ---------------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return fail('Only POST requests are supported.', 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('MARKET_API_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return fail('Server configuration error: Supabase service credentials are unavailable.', 500);
  }
  if (!apiKey) {
    return fail(
      'Mandi feed is not configured. Set the MARKET_API_KEY secret on this Supabase project ' +
        '(supabase secrets set MARKET_API_KEY=<data.gov.in key>) and redeploy the function.',
      503,
    );
  }

  let body: RefreshRequest = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw) as RefreshRequest;
  } catch {
    body = {};
  }

  const startedAt = Date.now();
  const logs: FetchLogEntry[] = [];
  const errors: string[] = [];

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---- Resolve runtime configuration --------------------------------
    const stateFilter =
      asText(body.state) || asText(Deno.env.get('MARKET_API_STATE_FILTER')) || DEFAULT_STATE_FILTER;
    const districtFilter = asText(body.district) || undefined;
    const pageSize = asInt(
      body.pageSize ?? body.limit ?? Deno.env.get('MARKET_API_PAGE_SIZE'),
      DEFAULT_PAGE_SIZE,
      1,
      MAX_PAGE_SIZE,
    );
    const overrideMaxPages = asInt(body.maxPages, 0, 0, MAX_PAGES_LIMIT);
    const sweepMaxPages =
      overrideMaxPages ||
      asInt(Deno.env.get('MARKET_API_SWEEP_MAX_PAGES'), DEFAULT_SWEEP_MAX_PAGES, 1, MAX_PAGES_LIMIT);
    const cropMaxPages =
      overrideMaxPages ||
      asInt(Deno.env.get('MARKET_API_CROP_MAX_PAGES'), DEFAULT_CROP_MAX_PAGES, 1, MAX_PAGES_LIMIT);
    const timeoutMs = asInt(
      Deno.env.get('MARKET_API_REQUEST_TIMEOUT_MS'),
      DEFAULT_REQUEST_TIMEOUT_MS,
      1_000,
      30_000,
    );
    const timeBudgetMs = asInt(
      Deno.env.get('MARKET_API_TIME_BUDGET_MS'),
      DEFAULT_TIME_BUDGET_MS,
      5_000,
      140_000,
    );
    const includeGeneral =
      body.includeGeneral !== false && asText(Deno.env.get('MARKET_API_INCLUDE_GENERAL')) !== 'false';
    const force = body.force === true;
    const debug = body.debug === true;
    const cropTargets = resolveCropTargets(body);

    const configuredInterval = Number(Deno.env.get('MARKET_REFRESH_MIN_INTERVAL_MINUTES'));
    const minIntervalMinutes =
      Number.isFinite(configuredInterval) && configuredInterval > 0
        ? configuredInterval
        : DEFAULT_MIN_INTERVAL_MINUTES;

    const cfg: FeedConfig = {
      apiKey,
      baseUrl: (asText(Deno.env.get('MARKET_API_BASE_URL')) || DEFAULT_API_BASE_URL).replace(/\/+$/, ''),
      resourceId: asText(Deno.env.get('MARKET_API_RESOURCE_ID')) || DEFAULT_RESOURCE_ID,
      timeoutMs,
      deadline: startedAt + timeBudgetMs,
    };

    logEvent('refresh_start', {
      state: stateFilter,
      district: districtFilter ?? null,
      crops: cropTargets.map((crop) => crop.key),
      includeGeneral,
      pageSize,
      sweepMaxPages,
      cropMaxPages,
      force,
      hasApiKey: true,
      resourceId: cfg.resourceId,
    });


    // ---- Throttle: never hammer the government API --------------------
    const { data: lastRefresh } = await admin
      .from('market_prices')
      .select('fetched_at,source')
      .in('source', KNOWN_SOURCE_NAMES)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastFetchedAt = asText((lastRefresh as { fetched_at?: unknown } | null)?.fetched_at);
    const lastFetchedMs = toTime(lastFetchedAt);
    if (!force && lastFetchedMs && Date.now() - lastFetchedMs < minIntervalMinutes * 60_000) {
      logEvent('refresh_throttled', {
        lastFetchedAt,
        minIntervalMinutes,
        ageSeconds: Math.round((Date.now() - lastFetchedMs) / 1000),
      });
      return jsonResponse({
        ok: true,
        refreshed: false,
        throttled: true,
        fetchedAt: lastFetchedAt,
        minIntervalMinutes,
        message: `Skipped refresh: Supabase was updated less than ${minIntervalMinutes} minute(s) ago.`,
      });
    }

    // ---- 1. General Karnataka sweep (keeps every existing commodity) --
    const rawRecords: GovernmentRecord[] = [];
    let generalPages = 0;

    if (includeGeneral) {
      const sweep = await fetchAllPages(cfg, {
        cropKey: 'general',
        state: stateFilter || DEFAULT_STATE_NAME,
        district: districtFilter,
        pageSize,
        maxPages: sweepMaxPages,
        startOffset: Math.max(Number(body.offset) || 0, 0),
        logs,
      });
      rawRecords.push(...sweep.records);
      generalPages = sweep.pagesFetched;
      errors.push(...sweep.errors);
    }

    // ---- 2. Dedicated, paginated queries for the commercial crops ------
    const cropStats = new Map<string, CropStats>();
    for (const crop of cropTargets) {
      if (Date.now() >= cfg.deadline) {
        const skipped = emptyStats(crop.label);
        skipped.errors.push('Skipped: global time budget exhausted before this crop was queried.');
        cropStats.set(crop.key, skipped);
        continue;
      }

      const stats = emptyStats(crop.label);
      cropStats.set(crop.key, stats);

      const cropRecords = await fetchCrop(cfg, crop, {
        state: stateFilter || DEFAULT_STATE_NAME,
        district: districtFilter,
        pageSize,
        maxPages: cropMaxPages,
        logs,
        stats,
      });

      if (cropRecords.length === 0 && stats.errors.length === 0) {
        stats.errors.push(
          `No records returned for ${crop.label} for any known commodity spelling (${crop.filters.join(', ')}).`,
        );
      }

      rawRecords.push(...cropRecords);
      errors.push(...stats.errors.filter((message) => !message.startsWith('No records returned')));
    }

    // ---- 3. Validate + map + de-duplicate (natural key) ---------------
    // Only stamped once the government responses have been received.
    const fetchedAt = new Date().toISOString();

    let recordsSkipped = 0;
    const deduped = new Map<string, MarketPriceRow>();
    for (const record of rawRecords) {
      const row = mapRecord(record, stateFilter || DEFAULT_STATE_NAME, fetchedAt);
      if (!row) {
        recordsSkipped += 1;
        continue;
      }
      // Last write wins inside this run, so a bulletin is never queued twice.
      deduped.set(naturalKey(row), row);
    }

    const allRows = [...deduped.values()];
    // Rows that belong to a tracked commercial crop (kept out of the "general" bucket).
    const cropRowKeys = new Set<string>();
    for (const [key, stats] of cropStats) {
      const crop = cropTargets.find((target) => target.key === key);
      if (!crop) continue;
      const cropRows = allRows.filter((row) => crop.matches(normalizeCommodity(row.commodity)));
      for (const row of cropRows) cropRowKeys.add(naturalKey(row));
      applyRowStats(stats, cropRows);
    }


    // ---- 4. Response summary -----------------------------------------
    const counts: Record<string, number> = {};
    for (const crop of CROP_TARGETS) {
      // Crops that were filtered out of this run are not reported at all.
      const stats = cropStats.get(crop.key);
      counts[crop.key] = stats ? stats.recordsSaved : 0;
    }

    const cropDetails: Record<string, unknown> = {};
    for (const [key, stats] of cropStats) {
      cropDetails[key] = {
        label: stats.label,
        count: stats.recordsSaved,
        records_received: stats.recordsReceived,
        filter_used: stats.filterUsed,
        filters_tried: stats.filtersTried,
        requests: stats.pages,
        latest_price_date: stats.latestPriceDate,
        commodity_names_returned: stats.commodityNamesReturned,
        districts: stats.districts,
        markets: stats.markets,
        errors: stats.errors,
      };
    }

    const generalRows = allRows.filter((row) => !cropRowKeys.has(naturalKey(row)));
    const allDates = allRows.map((row) => row.price_date).sort();
    const failedRequests = logs.filter((entry) => Boolean(entry.error));

    logEvent('refresh_fetched', {
      recordsReceived: rawRecords.length,
      recordsValidated: allRows.length,
      recordsSkipped,
      generalRecords: generalRows.length,
      generalPages,
      counts,
      requests: logs.length,
      failedRequests: failedRequests.length,
      httpStatuses: [...new Set(logs.map((entry) => entry.httpStatus))].sort(),
    });
    logEvent('refresh_crop_names', {
      names: [...new Set(allRows.map((row) => row.commodity))].sort(),
    });

    if (allRows.length === 0) {
      logEvent('refresh_no_data', { errors, pageSize, generalPages });
      return jsonResponse({
        ok: true,
        refreshed: false,
        throttled: false,
        fetchedAt,
        total: 0,
        counts,
        crop_details: cropDetails,
        recordsReceived: rawRecords.length,
        recordsValidated: 0,
        recordsSkipped,
        recordsUpserted: 0,
        general: { records: 0, requests: generalPages },
        requests: { total: logs.length, failed: failedRequests.length },
        state: stateFilter || DEFAULT_STATE_NAME,
        source: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        errors,
        note: 'Government API returned no usable records; existing Supabase prices were left untouched.',
        ...(debug ? { request_log: logs } : {}),
      });
    }


    // ---- 5. Upsert (never a plain INSERT: no duplicate bulletins) -----
    let recordsUpserted = 0;
    for (let index = 0; index < allRows.length; index += UPSERT_CHUNK_SIZE) {
      const chunk = allRows.slice(index, index + UPSERT_CHUNK_SIZE);
      const { error: upsertError } = await admin
        .from('market_prices')
        .upsert(chunk, { onConflict: NATURAL_KEY_COLUMNS, ignoreDuplicates: false });

      if (upsertError) {
        const needsIndex = /no unique or exclusion constraint/i.test(upsertError.message);
        logEvent('refresh_upsert_failed', {
          chunkStart: index,
          chunkSize: chunk.length,
          error: upsertError.message,
        });
        return fail(
          `Failed to persist mandi prices: ${upsertError.message}.` +
            (needsIndex
              ? ' Apply supabase/migrations/20260920120000_market_prices_dedupe_unique_key.sql (supabase db push) to create the natural-key index.'
              : ''),
          500,
          { counts, fetchedAt, recordsUpserted },
        );
      }
      recordsUpserted += chunk.length;
    }

    logEvent('refresh_done', {
      total: allRows.length,
      recordsUpserted,
      counts,
      latestPriceDate: allDates[allDates.length - 1],
      durationMs: Date.now() - startedAt,
    });

    return jsonResponse({
      ok: true,
      refreshed: true,
      throttled: false,
      fetchedAt,
      // Requested summary shape.
      total: allRows.length,
      counts,
      crop_details: cropDetails,
      // Fields the FarmNexa frontend already consumes.
      recordsReceived: rawRecords.length,
      recordsValidated: allRows.length,
      recordsSkipped,
      recordsUpserted,
      earliestPriceDate: allDates[0],
      latestPriceDate: allDates[allDates.length - 1],
      general: { records: generalRows.length, requests: generalPages },
      requests: { total: logs.length, failed: failedRequests.length },
      state: stateFilter || DEFAULT_STATE_NAME,
      district: districtFilter ?? null,
      pageSize,
      source: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      errors,
      durationMs: Date.now() - startedAt,
      ...(debug ? { request_log: logs } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logEvent('refresh_exception', { error: message, durationMs: Date.now() - startedAt });
    return fail(`Mandi refresh failed: ${message}`, 500, {
      requests: { total: logs.length, failed: logs.length },
      errors,
    });
  }
});

