import { db } from '../_lib/db.js'
import { HttpError, route } from '../_lib/http.js'
import { MAX_LOTS, pipValueUsd, quote } from '../_lib/market.js'

// Position-size calculator: account size × risk % ÷ (stop distance × pip value per lot),
// using each instrument's pip size and contract size from the database.
export default route({
  async GET(req) {
    const { symbol } = req.query
    const account = Number(req.query.account_size)
    const riskPct = Number(req.query.risk_percent)
    const stopPips = Number(req.query.stop_pips)
    if (!(account > 0) || account > 1e9) throw new HttpError(400, 'Enter an account size above 0.')
    if (!(riskPct > 0) || riskPct > 100) throw new HttpError(400, 'Risk per trade must be between 0 and 100%.')
    if (!(stopPips > 0) || stopPips > 1e6) throw new HttpError(400, 'Enter a stop distance above 0 pips.')

    const [inst] = await db()`SELECT * FROM instruments WHERE symbol = ${String(symbol || '')}`
    if (!inst) throw new HttpError(404, 'Unknown instrument.')

    const price = quote(inst).mid
    const riskAmount = account * (riskPct / 100)
    const perLot = pipValueUsd(inst, price, 1)
    const rawLots = riskAmount / (perLot * stopPips)
    const lots = Math.min(MAX_LOTS, Math.floor(rawLots * 100) / 100) // round down so you never exceed your risk

    return {
      symbol: inst.symbol,
      price,
      decimals: inst.decimals,
      pip_size: Number(inst.pip_size),
      contract_size: Number(inst.contract_size),
      risk_amount: Math.round(riskAmount * 100) / 100,
      pip_value_per_lot: Math.round(perLot * 100) / 100,
      lot_size: lots,
      actual_risk: Math.round(lots * perLot * stopPips * 100) / 100,
      too_small: lots < 0.01,
    }
  },
})
