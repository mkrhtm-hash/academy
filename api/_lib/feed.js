// Real-market reference prices. The simulator's 2-second random walk is pulled towards these,
// so practice prices track the real market. Free sources, no API keys:
//   gold-api.com (spot gold/silver), Yahoo Finance chart API (FX, indices, metal futures for the
//   previous close), Coinbase (crypto spot + 24h open). Any source that fails is simply skipped.
import { db } from './db.js'

const TIMEOUT_MS = 4000
export const REFRESH_SECONDS = 60

const get = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 VaultEdge-Academy' }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json()
}

async function yahoo(symbol) {
  const j = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`)
  const m = j.chart.result[0].meta
  return { price: m.regularMarketPrice, prevClose: m.chartPreviousClose ?? m.previousClose ?? null, time: new Date(m.regularMarketTime * 1000) }
}

async function goldApi(code) {
  const j = await get(`https://api.gold-api.com/price/${code}`)
  return { price: j.price, time: new Date(j.updatedAt) }
}

// Coinbase Exchange 24h stats: last trade price plus the 24h open (used as the "previous close").
// Falls back to gold-api.com, which also quotes BTC and ETH.
async function crypto(pair, code) {
  try {
    const s = await get(`https://api.exchange.coinbase.com/products/${pair}/stats`)
    return { price: Number(s.last), prevClose: Number(s.open), time: new Date(), source: 'Coinbase' }
  } catch {
    return { ...(await goldApi(code)), source: 'gold-api.com' }
  }
}

// Spot metals: price from gold-api; previous close estimated from the futures' daily change.
async function metal(code, future) {
  const [spot, fut] = await Promise.all([goldApi(code), yahoo(future).catch(() => null)])
  const prevClose = fut?.prevClose ? spot.price / (fut.price / fut.prevClose) : null
  return { ...spot, prevClose }
}

const SOURCES = {
  'XAU/USD': { label: 'gold-api.com', load: () => metal('XAU', 'GC=F') },
  'XAG/USD': { label: 'gold-api.com', load: () => metal('XAG', 'SI=F') },
  'EUR/USD': { label: 'Yahoo Finance', load: () => yahoo('EURUSD=X') },
  'GBP/USD': { label: 'Yahoo Finance', load: () => yahoo('GBPUSD=X') },
  'USD/JPY': { label: 'Yahoo Finance', load: () => yahoo('JPY=X') },
  'AUD/USD': { label: 'Yahoo Finance', load: () => yahoo('AUDUSD=X') },
  US30: { label: 'Yahoo Finance', load: () => yahoo('^DJI') },
  NAS100: { label: 'Yahoo Finance', load: () => yahoo('^NDX') },
  'BTC/USD': { label: 'Coinbase', load: () => crypto('BTC-USD', 'BTC') },
  'ETH/USD': { label: 'Coinbase', load: () => crypto('ETH-USD', 'ETH') },
}

/**
 * Refreshes reference prices at most once per REFRESH_SECONDS across all servers: one request
 * "claims" the refresh in the database, fetches every source in parallel and stores the results.
 * When the simulated price is far from reality (e.g. first run), it jumps to the real price and the
 * chart history for that instrument is rebuilt around it.
 */
export async function refreshReferences() {
  const sql = db()
  const [claim] = await sql`
    UPDATE instruments SET ref_checked_at = now()
    WHERE id = (SELECT min(id) FROM instruments)
      AND (ref_checked_at IS NULL OR ref_checked_at < now() - make_interval(secs => ${REFRESH_SECONDS}))
    RETURNING id`
  if (!claim) return

  const symbols = Object.keys(SOURCES)
  const results = await Promise.allSettled(symbols.map((s) => SOURCES[s].load()))
  const updates = []
  results.forEach((r, i) => {
    const symbol = symbols[i]
    if (r.status !== 'fulfilled' || !(r.value.price > 0)) {
      console.warn(`[feed] ${symbol}: ${r.reason?.message || 'no price'} (keeping last reference)`)
      return
    }
    const { price, prevClose = null, time, source } = r.value
    updates.push(sql`
      WITH old AS (
        SELECT id, abs(current_price - ${price}::numeric) / ${price}::numeric > 0.005 AS far
        FROM instruments WHERE symbol = ${symbol}
      ), upd AS (
        UPDATE instruments i SET
          ref_price = round(${price}::numeric, i.decimals),
          ref_prev_close = COALESCE(round(${prevClose}::numeric, i.decimals), i.ref_prev_close),
          ref_time = ${time.toISOString()}::timestamptz,
          ref_source = ${source || SOURCES[symbol].label},
          -- far from reality (first run / long idle): snap to the real price
          current_price = CASE WHEN old.far THEN round(${price}::numeric, i.decimals) ELSE i.current_price END
        FROM old WHERE i.id = old.id
        RETURNING i.id, old.far
      )
      -- after a snap, drop the old chart history so it is rebuilt around the real price
      DELETE FROM price_ticks t USING upd WHERE t.instrument_id = upd.id AND upd.far`)
  })
  if (updates.length) await sql.transaction(updates)
}
