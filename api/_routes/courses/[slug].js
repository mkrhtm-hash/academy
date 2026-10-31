import { hasFullLibrary, loadUser, sessionUserId } from '../../_lib/auth.js'
import { courseRows, publicCourse } from '../../_lib/courses.js'
import { db } from '../../_lib/db.js'
import { HttpError, route } from '../../_lib/http.js'
import { isPreview, lessonAccess } from '../../_lib/learning.js'

// Public course page: modules and lesson titles for everyone; ticks and locks per user.
export default route({
  async GET(req) {
    const sql = db()
    const userId = await sessionUserId(req)
    const user = userId ? await loadUser(userId) : null
    const [row] = await courseRows(user?.id ?? null, { slug: String(req.query.slug || '') })
    if (!row) throw new HttpError(404, 'We couldn’t find that course.')

    const [lessons, [cert]] = await sql.transaction([
      sql`
        SELECT m.id AS module_id, m.title AS module_title, m.order_index AS module_order,
               l.id, l.title, l.duration_minutes, l.order_index, (lp.id IS NOT NULL) AS completed
        FROM modules m JOIN lessons l ON l.module_id = m.id
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ${user?.id ?? null} AND lp.completed
        WHERE m.course_id = ${row.id}
        ORDER BY m.order_index, l.order_index`,
      sql`SELECT certificate_code, issued_at FROM certificates WHERE user_id = ${user?.id ?? null} AND course_id = ${row.id}`,
    ], { readOnly: true })

    const modules = []
    for (const l of lessons) {
      let m = modules.at(-1)
      if (!m || m.id !== l.module_id) modules.push((m = { id: l.module_id, title: l.module_title, order_index: l.module_order, lessons: [] }))
      m.lessons.push({
        id: l.id,
        title: l.title,
        duration_minutes: l.duration_minutes,
        order_index: l.order_index,
        free: isPreview(row, l.module_order, l.order_index),
        locked: lessonAccess(user, row, l.module_order, l.order_index) !== 'ok',
        completed: l.completed,
      })
    }

    return {
      course: {
        ...publicCourse(row, !!user),
        modules,
        unlocked: row.is_free || hasFullLibrary(user),
        certificate: cert || null,
      },
    }
  },
})
