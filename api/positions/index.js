import { requireUserId } from '../_lib/auth.js'
import { db, money } from '../_lib/db.js'
import { HttpError, body, route } from '../_lib/http.js'
import { logActivity } from '../_lib/learning.js'
import { MAX_LOTS, MIN_LOTS, accountSummary, marginUsd, quote, tick } from '../_lib/market.js'

export default route({
  // The user's practice account, open positions (with live floating P&L) and trade history.
  async GET(req) {
    const userId = await requireUserId(req)
    return accountSummary(userId, await tick())
  },

  // Open a position at the server's current price. The browser only sends intent:
  // symbol, side, lot size and optional SL/TP levels. Everything else is decided here.
  async POST(req) {
    const userId = await requireUserId(req)
    const { symbol, side, lot_size, stop_loss, take_profit } = body(req)

    if (side !== 'buy' && side !== 'sell') throw new HttpError(400, 'Choose Buy or Sell.')
    const lots = Number(lot_size)
    if (!Number.isFinite(lots) || lots < MIN_LOTS || lots > MAX_LOTS || Math.abs(lots * 100 - Math.round(lots * 100)) > 1e-9) {
      throw new HttpError(400, `Lot size must be between ${MIN_LOTS} and ${MAX_LOTS}, in steps of 0.01.`)
    }

    const instruments = await tick()
    const inst = instruments.find((i) => i.symbol === symbol)
    if (!inst) throw new HttpError(400, 'Unknown instrument.')
    const { bid, ask, mid } = quote(inst)
    const entry = side === 'buy' ? ask : bid

    const level = (v, label) => {
      if (v === null || v === undefined || v === '') return null
      const n = Number(v)
      if (!Number.isFinite(n) || n <= 0) throw new HttpError(400, `${label} must be a positive price.`)
      return Number(n.toFixed(inst.decimals))
    }
    const sl = level(stop_loss, 'Stop-loss')
    const tp = level(take_profit, 'Take-profit')
    const fmt = (n) => n.toFixed(inst.decimals)
    if (side === 'buy') {
      if (sl !== null && sl >= bid) throw new HttpError(400, `For a buy, the stop-loss must be below the current bid (${fmt(bid)}).`)
      if (tp !== null && tp <= ask) throw new HttpError(400, `For a buy, the take-profit must be above the current ask (${fmt(ask)}).`)
    } else {
      if (sl !== null && sl <= ask) throw new HttpError(400, `For a sell, the stop-loss must be above the current ask (${fmt(ask)}).`)
      if (tp !== null && tp >= bid) throw new HttpError(400, `For a sell, the take-profit must be below the current bid (${fmt(bid)}).`)
    }

    const summary = await accountSummary(userId, instruments)
    const required = money(marginUsd(inst, mid, lots, summary.account.leverage))
    if (required > summary.account.free_margin) {
      throw new HttpError(400, `Not enough free margin: this trade needs $${required.toFixed(2)} but you have $${Math.max(0, summary.account.free_margin).toFixed(2)} free. Try a smaller lot size.`)
    }

    const [pos] = await db()`
      INSERT INTO positions (user_id, instrument_id, side, lot_size, entry_price, stop_loss, take_profit)
      VALUES (${userId}, ${inst.id}, ${side}, ${lots}, ${entry}, ${sl}, ${tp})
      RETURNING id, entry_price`
    await logActivity(req, userId, { trades: 1 })

    return {
      position: { id: pos.id, symbol: inst.symbol, side, lot_size: lots, entry_price: Number(pos.entry_price), stop_loss: sl, take_profit: tp },
      ...(await accountSummary(userId, instruments)),
    }
  },
})
