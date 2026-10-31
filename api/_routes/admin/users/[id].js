import { requireAdmin } from '../../../_lib/auth.js'
import { db } from '../../../_lib/db.js'
import { HttpError, body, idParam, route } from '../../../_lib/http.js'

export default route({
  // Change a student's plan and/or admin access.
  async PATCH(req) {
    const admin = await requireAdmin(req)
    const id = idParam(req.query.id)
    const { plan_id, is_admin } = body(req)
    const sql = db()
    const [target] = await sql`SELECT id FROM users WHERE id = ${id}`
    if (!target) throw new HttpError(404, 'Student not found.')

    if (plan_id !== undefined) {
      const [plan] = await sql`SELECT id FROM plans WHERE id = ${Number(plan_id) || 0}`
      if (!plan) throw new HttpError(400, 'Unknown plan.')
      await sql`UPDATE users SET plan_id = ${plan.id} WHERE id = ${id}`
    }
    if (is_admin !== undefined) {
      if (id === admin.id && !is_admin) throw new HttpError(400, 'You can’t remove your own admin access.')
      await sql`UPDATE users SET is_admin = ${!!is_admin} WHERE id = ${id}`
    }
    return { ok: true }
  },

  // Delete a student and all their data (progress, trades, bookings, orders). Frees their session seats.
  async DELETE(req) {
    const admin = await requireAdmin(req)
    const id = idParam(req.query.id)
    if (id === admin.id) throw new HttpError(400, 'You can’t delete your own account here.')
    const sql = db()
    const [, deleted] = await sql.transaction([
      sql`
        UPDATE live_sessions s SET seats_taken = GREATEST(0, s.seats_taken - 1)
        WHERE s.id IN (SELECT session_id FROM session_bookings WHERE user_id = ${id})`,
      sql`DELETE FROM users WHERE id = ${id} RETURNING id`,
    ])
    if (!deleted.length) throw new HttpError(404, 'Student not found.')
    return { ok: true }
  },
})
