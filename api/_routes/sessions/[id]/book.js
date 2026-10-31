import { requireUserId } from '../../../_lib/auth.js'
import { db } from '../../../_lib/db.js'
import { HttpError, idParam, route } from '../../../_lib/http.js'
import { sessionJson } from '../../../_lib/sessions.js'

async function load(userId, id) {
  const [s] = await db()`
    SELECT s.*, (b.id IS NOT NULL) AS booked FROM live_sessions s
    LEFT JOIN session_bookings b ON b.session_id = s.id AND b.user_id = ${userId}
    WHERE s.id = ${id}`
  if (!s) throw new HttpError(404, 'Session not found.')
  return s
}

export default route({
  // Book a seat. The seat counter only increments while seats_taken < capacity, so a session
  // can never be overbooked, even with simultaneous requests.
  async POST(req) {
    const userId = await requireUserId(req)
    const id = idParam(req.query.id)
    let booked
    try {
      booked = await db()`
        WITH seat AS (
          UPDATE live_sessions SET seats_taken = seats_taken + 1
          WHERE id = ${id} AND seats_taken < capacity AND start_time > now()
            AND NOT EXISTS (SELECT 1 FROM session_bookings WHERE user_id = ${userId} AND session_id = ${id})
          RETURNING id
        )
        INSERT INTO session_bookings (user_id, session_id) SELECT ${userId}, id FROM seat RETURNING id`
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'You’re already booked on this session.')
      throw err
    }
    if (!booked.length) {
      const s = await load(userId, id)
      if (s.booked) throw new HttpError(409, 'You’re already booked on this session.')
      if (new Date(s.start_time) <= new Date()) throw new HttpError(409, 'This session has already started.')
      throw new HttpError(409, 'Sorry, this session is full.')
    }
    return { session: sessionJson(await load(userId, id)) }
  },

  // Cancel the user's booking and free the seat.
  async DELETE(req) {
    const userId = await requireUserId(req)
    const id = idParam(req.query.id)
    const freed = await db()`
      WITH del AS (DELETE FROM session_bookings WHERE user_id = ${userId} AND session_id = ${id} RETURNING session_id)
      UPDATE live_sessions s SET seats_taken = GREATEST(0, s.seats_taken - 1) FROM del WHERE s.id = del.session_id
      RETURNING s.id`
    if (!freed.length) throw new HttpError(404, 'You don’t have a booking for this session.')
    return { session: sessionJson(await load(userId, id)) }
  },
})
