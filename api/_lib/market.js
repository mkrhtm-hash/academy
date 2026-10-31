// Server-side market simulation and trading maths. The browser only ever displays these numbers.
import { db, money, num } from './db.js'
import { refreshReferences } from './feed.js'
import { HttpError } from './http.js'

export const MIN_LOTS = 0.01
export const MAX_LOTS = 50
export const START_BALANCE = 10000

const round = (n, decimals) => Number(Number(n).toFixed(decimals))

/** Bid/ask around the server's mid price using the instrument's spread. */
export function quote(inst) {
  const mid = num(inst.current_price)
  const half = (num(inst.spread_pips) * num(inst.pip_size)) / 2
  return { mid, bid: round(mid - half, inst.decimals), ask: round(mid + half, inst.decimals) }
}

/** P&L in USD. For USD/JPY the raw P&L is in yen, so it is converted at the exit price. */
export function pnlUsd(inst, side, lots, entry, exit) {
  const dir = side === 'buy' ? 1 : -1
  const raw = (exit - entry) * dir * num(inst.contract_size) * lots
  return inst.quote_is_usd ? raw : raw / exit
}

export function marginUsd(inst, price, lots, leverage) {
  const notional = inst.quote_is_usd ? num(inst.contract_size) * lots * price : num(inst.contract_size) * lots
  return notional / leverage
}

export function pipValueUsd(inst, price, lots = 1) {
  const v = num(inst.pip_size) * num(inst.contract_size) * lots
  return inst.quote_is_usd ? v : v / price
}

/** Price a position would close at right now (sell at bid for buys, buy at ask for sells). */
export const exitPrice = (inst, side) => (side === 'buy' ? quote(inst).bid : quote(inst).ask)

export function publicInstrument(i) {
  const q = quote(i)
  return {
    id: i.id,
    symbol: i.symbol,
    name: i.name,
    asset_class: i.asset_class,
    base_price: num(i.base_price),
    pip_size: num(i.pip_size),
    contract_size: num(i.contract_size),
    decimals: i.decimals,
    quote_is_usd: i.quote_is_usd,
    spread_pips: num(i.spread_pips),
    price: q.mid,
    bid: q.bid,
    ask: q.ask,
    updated_at: i.price_updated_at,
    // real-market reference this price follows
    prev_close: num(i.ref_prev_close) ?? num(i.base_price),
    ref_price: num(i.ref_price),
    ref_source: i.ref_source,
    ref_time: i.ref_time,
    market_open: i.ref_time ? Date.now() - new Date(i.ref_time).getTime() < 20 * 60000 : true,
  }
}

/**
 * Advances every instrument's random walk (at most once per second, however many clients poll),
 * records a tick for the chart, closes any positions whose stop-loss / take-profit was hit,
 * and returns the fresh instrument rows.
 */
export async function tick() {
  const sql = db()
  // Pull in real-market reference prices (about once a minute; never blocks trading if a source is down).
  await refreshReferences().catch((err) => console.warn('[feed] refresh failed:', err.message))

  // Markets whose real price hasn't changed for 20+ minutes are closed (indices overnight, FX at
  // weekends): the simulated price then only drifts very slightly around the last real price.
  const [, , instruments] = await sql.transaction([
    // Chart history: if an instrument has no recent ticks (fresh database, idle, or just snapped to the
    // real price), backfill 40 minutes of walk that ends at the current price.
    sql`
      WITH need AS (
        SELECT i.* FROM instruments i
        WHERE pg_try_advisory_xact_lock(727001)
          AND NOT EXISTS (SELECT 1 FROM price_ticks t WHERE t.instrument_id = i.id AND t.ts > now() - interval '10 minutes')
      ), steps AS (
        SELECT n.id, n.current_price, n.decimals, g.k,
               n.volatility * CASE WHEN n.ref_time < now() - interval '20 minutes' THEN 0.15 ELSE 1 END
                 * sqrt(5) * sqrt(-2 * ln(1 - random())) * cos(2 * pi() * random()) AS z
        FROM need n CROSS JOIN generate_series(1, 480) AS g(k)
      )
      INSERT INTO price_ticks (instrument_id, ts, price)
      SELECT id, now() - k * interval '5 seconds',
             round((current_price * exp(sum(z) OVER (PARTITION BY id ORDER BY k)))::numeric, decimals)
      FROM steps`,
    // One random-walk step per instrument, scaled by the time since the last step, pulled towards the
    // real reference price (about 10% of the gap every 2 seconds), or towards base_price if no feed.
    sql`
      WITH moved AS (
        UPDATE instruments i SET
          current_price = round(GREATEST(COALESCE(i.ref_price, i.base_price) * 0.8, LEAST(COALESCE(i.ref_price, i.base_price) * 1.2,
            (i.current_price * exp(i.volatility
               * CASE WHEN i.ref_time < now() - interval '20 minutes' THEN 0.15 ELSE 1 END
               * sqrt(LEAST(extract(epoch FROM now() - i.price_updated_at), 3600))
               * sqrt(-2 * ln(1 - random())) * cos(2 * pi() * random())))::numeric
            + (COALESCE(i.ref_price, i.base_price) - i.current_price)
              * LEAST(1, CASE WHEN i.ref_price IS NULL THEN 0.0005 ELSE 0.05 END * extract(epoch FROM now() - i.price_updated_at))
          )), i.decimals),
          price_updated_at = now()
        WHERE i.price_updated_at <= now() - interval '1 second'
        RETURNING i.id, i.current_price
      )
      INSERT INTO price_ticks (instrument_id, price) SELECT id, current_price FROM moved`,
    sql`SELECT * FROM instruments ORDER BY id`,
  ])

  if (Math.random() < 0.05) await sql`DELETE FROM price_ticks WHERE ts < now() - interval '2 hours'`
  await closeTriggered(instruments)
  return instruments
}

/** Closes open positions (for every user) whose stop-loss or take-profit has been reached. */
async function closeTriggered(instruments) {
  const sql = db()
  const byId = new Map(instruments.map((i) => [i.id, i]))
  const hits = await sql`
    SELECT p.* FROM positions p JOIN instruments i ON i.id = p.instrument_id
    WHERE p.status = 'open' AND (p.stop_loss IS NOT NULL OR p.take_profit IS NOT NULL)
      AND (
        (p.side = 'buy'  AND (i.current_price - i.spread_pips * i.pip_size / 2 <= p.stop_loss
                           OR i.current_price - i.spread_pips * i.pip_size / 2 >= p.take_profit))
     OR (p.side = 'sell' AND (i.current_price + i.spread_pips * i.pip_size / 2 >= p.stop_loss
                           OR i.current_price + i.spread_pips * i.pip_size / 2 <= p.take_profit))
      )`
  for (const p of hits) {
    const inst = byId.get(p.instrument_id)
    const px = exitPrice(inst, p.side)
    const sl = num(p.stop_loss)
    const hitSl = sl != null && (p.side === 'buy' ? px <= sl : px >= sl)
    await closePosition(p, inst, hitSl ? sl : num(p.take_profit), hitSl ? 'Stop-loss' : 'Take-profit')
  }
}

/**
 * Closes one position at `price`, realising P&L into the balance in a single statement.
 * Returns { pnl, balance } or null if the position was already closed.
 */
export async function closePosition(p, inst, price, reason) {
  const sql = db()
  const pnl = money(pnlUsd(inst, p.side, num(p.lot_size), num(p.entry_price), price))
  const [row] = await sql`
    WITH closed AS (
      UPDATE positions
      SET status = 'closed', closed_at = now(), close_price = ${price}, realized_pnl = ${pnl}, close_reason = ${reason}
      WHERE id = ${p.id} AND status = 'open'
      RETURNING user_id, realized_pnl
    )
    UPDATE demo_accounts d SET balance = d.balance + closed.realized_pnl
    FROM closed WHERE d.user_id = closed.user_id
    RETURNING d.balance`
  return row ? { pnl, balance: num(row.balance) } : null
}

/** Full practice-account picture for one user, with floating P&L at the current server prices. */
export async function accountSummary(userId, instruments) {
  const sql = db()
  const byId = new Map(instruments.map((i) => [i.id, i]))
  const [[account], open, [stats], history] = await sql.transaction([
    sql`SELECT * FROM demo_accounts WHERE user_id = ${userId}`,
    sql`SELECT * FROM positions WHERE user_id = ${userId} AND status = 'open' ORDER BY opened_at DESC`,
    sql`SELECT count(*)::int AS closed, count(*) FILTER (WHERE realized_pnl > 0)::int AS wins, COALESCE(sum(realized_pnl), 0) AS realized
        FROM positions WHERE user_id = ${userId} AND status = 'closed'`,
    sql`SELECT p.*, i.symbol FROM positions p JOIN instruments i ON i.id = p.instrument_id
        WHERE p.user_id = ${userId} AND p.status = 'closed' ORDER BY p.closed_at DESC LIMIT 50`,
  ], { readOnly: true })
  if (!account) throw new HttpError(404, 'No practice account found for this user.')

  const leverage = account.leverage
  const positions = open.map((p) => {
    const inst = byId.get(p.instrument_id)
    const lots = num(p.lot_size)
    const current = exitPrice(inst, p.side)
    return {
      id: p.id,
      symbol: inst.symbol,
      decimals: inst.decimals,
      side: p.side,
      lot_size: lots,
      entry_price: num(p.entry_price),
      stop_loss: num(p.stop_loss),
      take_profit: num(p.take_profit),
      current_price: current,
      floating_pnl: money(pnlUsd(inst, p.side, lots, num(p.entry_price), current)),
      margin: money(marginUsd(inst, quote(inst).mid, lots, leverage)),
      opened_at: p.opened_at,
    }
  })

  const balance = num(account.balance)
  const floating = money(positions.reduce((n, p) => n + p.floating_pnl, 0))
  const equity = money(balance + floating)
  const usedMargin = money(positions.reduce((n, p) => n + p.margin, 0))
  if (num(account.equity) !== equity) await sql`UPDATE demo_accounts SET equity = ${equity} WHERE user_id = ${userId}`

  return {
    account: {
      balance,
      equity,
      currency: account.currency,
      leverage,
      floating_pnl: floating,
      used_margin: usedMargin,
      free_margin: money(equity - usedMargin),
      realized_pnl: money(num(stats.realized)),
      total_pnl: money(equity - START_BALANCE),
      open_positions: positions.length,
      closed_trades: stats.closed,
      win_rate: stats.closed ? Math.round((stats.wins / stats.closed) * 100) : 0,
      practice_mode: true,
    },
    positions,
    history: history.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      side: p.side,
      lot_size: num(p.lot_size),
      entry_price: num(p.entry_price),
      close_price: num(p.close_price),
      realized_pnl: num(p.realized_pnl),
      close_reason: p.close_reason,
      opened_at: p.opened_at,
      closed_at: p.closed_at,
    })),
  }
}
