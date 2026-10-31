import { randomBytes } from 'node:crypto'
import { requireAdmin } from '../../../_lib/auth.js'
import { db } from '../../../_lib/db.js'
import { HttpError, body, route } from '../../../_lib/http.js'

const LEVELS = ['All levels', 'Beginner', 'Intermediate', 'Advanced']

// Add a live mentor session.
export default route({
  async POST(req) {
    await requireAdmin(req)
    const b = body(req)
    const title = String(b.title || '').trim()
    const mentor = String(b.mentor_name || '').trim()
    const start = new Date(b.start_time)
    const duration = Number(b.duration_minutes)
    const capacity = Number(b.capacity)
    if (!title || title.length > 120) throw new HttpError(400, 'Enter a session title.')
    if (!mentor || mentor.length > 80) throw new HttpError(400, 'Enter the mentor’s name.')
    if (Number.isNaN(start.getTime()) || start < new Date()) throw new HttpError(400, 'Choose a start time in the future.')
    if (!Number.isInteger(duration) || duration < 10 || duration > 480) throw new HttpError(400, 'Duration must be 10–480 minutes.')
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) throw new HttpError(400, 'Capacity must be at least 1.')
    const level = LEVELS.includes(b.level) ? b.level : 'All levels'

    const [s] = await db()`
      INSERT INTO live_sessions (slug, title, mentor_name, start_time, duration_minutes, capacity, topic, level)
      VALUES (${`custom-${randomBytes(4).toString('hex')}`}, ${title}, ${mentor}, ${start.toISOString()}, ${duration},
              ${capacity}, ${String(b.topic || '').trim().slice(0, 300)}, ${level})
      RETURNING id`
    return { id: s.id }
  },
})
