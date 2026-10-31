import { requireAdmin } from '../../../_lib/auth.js'
import { db } from '../../../_lib/db.js'
import { HttpError, idParam, route } from '../../../_lib/http.js'

// Delete a live session (its bookings are removed with it).
export default route({
  async DELETE(req) {
    await requireAdmin(req)
    const rows = await db()`DELETE FROM live_sessions WHERE id = ${idParam(req.query.id)} RETURNING id`
    if (!rows.length) throw new HttpError(404, 'Session not found.')
    return { ok: true }
  },
})
