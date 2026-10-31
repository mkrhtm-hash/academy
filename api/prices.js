import { db, num } from './_lib/db.js'
import { HttpError, route } from './_lib/http.js'
import { publicInstrument, tick } from './_lib/market.js'

export const CANDLE_SECONDS = 15

// Public: live (simulated) prices. Prices are generated here on the server so the browser can't fake them.
// ?candles=XAU/USD also returns 15-second candles for that instrument's last 40 minutes.
export default route({
  async GET(req) {
    const instruments = await tick()
    const out = { instruments: instruments.map(publicInstrument), server_time: new Date().toISOString(), practice_mode: true }

    if (req.query.candles) {
      const inst = instruments.find((i) => i.symbol === req.query.candles)
      if (!inst) throw new HttpError(404, 'Unknown instrument.')
      const rows = await db()`
        SELECT (floor(extract(epoch FROM ts) / ${CANDLE_SECONDS}) * ${CANDLE_SECONDS})::bigint AS t,
               (array_agg(price ORDER BY ts))[1] AS open, max(price) AS high, min(price) AS low,
               (array_agg(price ORDER BY ts DESC))[1] AS close
        FROM price_ticks
        WHERE instrument_id = ${inst.id} AND ts > now() - interval '40 minutes'
        GROUP BY 1 ORDER BY 1`
      out.candles = rows.map((r) => ({ time: Number(r.t), open: num(r.open), high: num(r.high), low: num(r.low), close: num(r.close) }))
      out.candle_seconds = CANDLE_SECONDS
    }
    return out
  },
})
