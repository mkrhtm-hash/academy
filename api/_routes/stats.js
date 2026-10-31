import { db } from '../_lib/db.js'
import { route } from '../_lib/http.js'

// Public landing-page counters, straight from the database.
export default route({
  async GET() {
    const [s] = await db()`
      SELECT
        (SELECT count(*) FROM users)::int AS students,
        (SELECT count(*) FROM lesson_progress WHERE completed)::int AS lessons_completed,
        (SELECT count(*) FROM live_sessions WHERE start_time > now() AND start_time < now() + interval '7 days')::int AS sessions_this_week,
        (SELECT count(*) FROM certificates)::int AS certificates_issued,
        (SELECT count(*) FROM courses)::int AS courses`
    return s
  },
})
