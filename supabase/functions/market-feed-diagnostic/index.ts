// =====================================================================
// TEMPORARY — Market feed diagnostic endpoint (data.gov.in probe)
// =====================================================================
// Used once to diagnose why commercial crops (Arecanut/Coconut/Black
// Pepper) are missing from the official mandi resource, then REMOVED.
//
// SECURITY
//   Reads the MARKET_API_KEY Supabase secret server-side. The key is added
//   to the upstream request only, is never logged and never returned.
//   Only data.gov.in hosts may be probed (no SSRF passthrough).
//
// USAGE
//   POST /functions/v1/market-feed-diagnostic
//   { "probes": [ { "label": "karnataka-arecanut",
//                   "path": "resource/9ef84268-...",
//                   "params": { "filters[state]": "Karnataka", "limit": "5" } } ] }
// =====================================================================

const ALLOWED_HOSTS = new Set(['api.data.gov.in']);
const MAX_PROBES = 40;
const MAX_SAMPLE_RECORDS = 5;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ProbeSpec {
  label?: string;
  /** Path appended to https://api.data.gov.in, e.g. "resource/<id>" or "lists". */
  path?: string;
  /** Absolute URL override (data.gov.in only). */
  url?: string;
  params?: Record<string, unknown>;
  /** Which fields to summarise distinct values for. */
  groupBy?: string[];
  sampleLimit?: number;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function distinct(records: Record<string, unknown>[], field: string, top: number) {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = text(record?.[field]);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([value, count]) => ({ value, count }));
}

/** Summarise a government API payload without dumping the whole feed. */
function summarise(payload: unknown, probe: ProbeSpec) {
  const body = isRecord(payload) ? payload : {};
  const records = Array.isArray(body.records) ? (body.records as unknown[]) : null;
  const arrayPayload = Array.isArray(payload) ? (payload as unknown[]) : null;

  const base = {
    keys: Object.keys(body).slice(0, 30),
    status: body.status ?? null,
    count: body.count ?? null,
    total: body.total ?? null,
    limit: body.limit ?? null,
    offset: body.offset ?? null,
    message: typeof body.message === 'string' ? body.message.slice(0, 300) : null,
  };

  if (arrayPayload) {
    const items = arrayPayload.filter(isRecord);
    return {
      ...base,
      arrayLength: items.length,
      itemKeys: items.length > 0 ? Object.keys(items[0]).slice(0, 40) : [],
      items: items.slice(0, 3),
    };
  }

  if (!records) return base;

  const rows = records.filter(isRecord);
  const groupBy = probe.groupBy ?? ['state', 'commodity'];
  const sampleLimit = Math.min(Math.max(probe.sampleLimit ?? MAX_SAMPLE_RECORDS, 0), 20);

  return {
    ...base,
    recordsReceived: rows.length,
    recordFields: rows.length > 0 ? Object.keys(rows[0]).slice(0, 40) : [],
    distinct: Object.fromEntries(groupBy.map((field) => [field, distinct(rows, field, 25)])),
    sample: rows.slice(0, sampleLimit),
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  const apiKey = Deno.env.get('MARKET_API_KEY');
  if (!apiKey) return json({ ok: false, error: 'MARKET_API_KEY secret is not set' }, 503);

  let body: { probes?: ProbeSpec[] } = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const probes = (body.probes ?? []).slice(0, MAX_PROBES);
  if (probes.length === 0) return json({ ok: false, error: 'No probes supplied' }, 400);

  const results: unknown[] = [];
  for (const probe of probes) {
    const label = probe.label ?? probe.path ?? probe.url ?? 'probe';
    let target: URL;
    try {
      target = new URL(probe.url ?? `https://api.data.gov.in/${text(probe.path).replace(/^\/+/, '')}`);
    } catch {
      results.push({ label, error: `Invalid probe URL for ${label}` });
      continue;
    }

    if (!ALLOWED_HOSTS.has(target.hostname)) {
      results.push({ label, error: `Host not allowed: ${target.hostname}` });
      continue;
    }

    for (const [key, value] of Object.entries(probe.params ?? {})) {
      if (value === null || value === undefined || value === '') continue;
      target.searchParams.set(key, String(value));
    }
    // Key added server-side only — never echoed in the response.
    target.searchParams.set('api-key', apiKey);
    if (!target.searchParams.has('format')) target.searchParams.set('format', 'json');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    const startedAt = Date.now();
    try {
      const response = await fetch(target, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      const rawBody = await response.text();
      let payload: unknown;
      try {
        payload = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        payload = { message: `non-JSON body (${rawBody.length} chars)` };
      }
      console.log(
        JSON.stringify({
          event: 'market_probe',
          label,
          httpStatus: response.status,
          ms: Date.now() - startedAt,
        }),
      );
      results.push({
        label,
        // Query echo with the key redacted so it is safe to paste around.
        query: decodeURIComponent(target.searchParams.toString().replace(apiKey, '***')),
        httpStatus: response.status,
        elapsedMs: Date.now() - startedAt,
        summary: summarise(payload, probe),
      });
    } catch (error) {
      results.push({ label, error: error instanceof Error ? error.message : String(error) });
    } finally {
      clearTimeout(timeout);
    }
  }

  return json({ ok: true, apiKeyPresent: true, probesRun: results.length, results });
});

