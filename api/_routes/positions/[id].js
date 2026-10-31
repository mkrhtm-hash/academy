import { requireUserId } from '../../_lib/auth.js'
import { db } from '../../_lib/db.js'
import { HttpError, idParam, route } from '../../_lib/http.js'
import { accountSummary, closePosition, exitPrice, tick } from '../../_lib/market.js'

// Close one of the logged-in user's open positions at the server's current price.
export default route({
  async DELETE(req) {
    const userId = await requireUserId(req)
    const id = idParam(req.query.id)
    const [pos] = await db()`SELECT * FROM positions WHERE id = ${id} AND user_id = ${userId}`
    if (!pos) throw new HttpError(404, 'Position not found.')
    if (pos.status !== 'open') throw new HttpError(409, 'This position is already closed.')

    const instruments = await tick()
    const inst = instruments.find((i) => i.id === pos.instrument_id)
    const result = await closePosition(pos, inst, exitPrice(inst, pos.side), 'Manual')
    if (!result) throw new HttpError(409, 'This position was just closed (stop-loss or take-profit).')

    return { closed: { id, realized_pnl: result.pnl }, ...(await accountSummary(userId, instruments)) }
  },
})
