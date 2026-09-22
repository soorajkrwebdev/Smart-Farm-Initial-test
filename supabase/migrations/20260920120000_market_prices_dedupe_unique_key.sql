-- =====================================================================
-- FarmNexa — market_prices: de-duplicate & add natural unique key
-- =====================================================================
-- WHY
--   The refresh Edge Function (`refresh-market-prices`) writes the
--   AGMARKNET / data.gov.in mandi feed with an UPSERT. Postgres requires a
--   unique index matching the conflict target for that to work, and the
--   index is what guarantees that repeated refreshes never create
--   duplicate rows for the same mandi bulletin.
--
--   Natural key = commodity + market + district + price_date + variety
--   (price_date comes from the government feed and is preserved as-is).
--
-- SAFETY
--   * No table is dropped and no price row is discarded for any other
--     reason than being an exact duplicate of a newer row.
--   * Existing rows are preserved; duplicates (same mandi bulletin stored
--     more than once) keep the most recently fetched copy.
-- =====================================================================

-- 1. Remove exact duplicates of the same mandi bulletin, keeping the row
--    with the newest fetched_at (ties broken deterministically by id).
DELETE FROM public.market_prices AS stale
USING public.market_prices AS fresh
WHERE stale.id <> fresh.id
  AND stale.commodity = fresh.commodity
  AND stale.market = fresh.market
  AND stale.district = fresh.district
  AND stale.price_date = fresh.price_date
  AND COALESCE(stale.variety, '') = COALESCE(fresh.variety, '')
  AND (stale.fetched_at, stale.id) < (fresh.fetched_at, fresh.id);

-- 2. Normalise NULL varieties so the natural key is deterministic for the
--    UPSERT (NULL vs '' would otherwise create two distinct keys).
UPDATE public.market_prices
SET variety = 'Other'
WHERE variety IS NULL OR btrim(variety) = '';

ALTER TABLE public.market_prices
  ALTER COLUMN variety SET DEFAULT 'Other';

-- 3. Natural unique key used by the Edge Function's upsert (onConflict).
CREATE UNIQUE INDEX IF NOT EXISTS market_prices_natural_key_key
  ON public.market_prices (commodity, market, district, price_date, variety);

-- 4. Read path: latest mandi bulletin first, newest sync as tie-breaker.
CREATE INDEX IF NOT EXISTS market_prices_price_date_fetched_at_idx
  ON public.market_prices (price_date DESC, fetched_at DESC);

COMMENT ON INDEX public.market_prices_natural_key_key IS
  'Natural key for AGMARKNET mandi bulletins; used by refresh-market-prices Edge Function upsert.';
