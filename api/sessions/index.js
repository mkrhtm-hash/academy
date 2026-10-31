import { requireUserId } from '../_lib/auth.js'
import { db } from '../_lib/db.js'
import { route } from '../_lib/http.js'
import { sessionJson } from '../_lib/sessions.js'

// This week's live sessions (now → 7 days ahead) with spots left and the user's own bookings.
export default route({
  async GET(req) {
    const userId = await requireUserId(req)
    const rows = await db()`
      SELECT s.*, (b.id IS NOT NULL) AS booked
      FROM live_sessions s
      LEFT JOIN session_bookings b ON b.session_id = s.id AND b.user_id = ${userId}
      WHERE s.start_time + make_interval(mins => s.duration_minutes) > now()
        AND s.start_time < now() + interval '7 days'
      ORDER BY s.start_time`
    return { sessions: rows.map(sessionJson) }
  },
})
