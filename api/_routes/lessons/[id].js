import { loadUser, requireUserId, sessionUserId } from '../../_lib/auth.js'
import { pct } from '../../_lib/courses.js'
import { db } from '../../_lib/db.js'
import { HttpError, body, idParam, route } from '../../_lib/http.js'
import { activityFor, lessonAccess, logActivity, maybeIssueCertificate } from '../../_lib/learning.js'

async function findLesson(id) {
  const [row] = await db()`
    SELECT l.*, m.title AS module_title, m.order_index AS module_order,
           c.id AS course_id, c.slug AS course_slug, c.title AS course_title, c.is_free
    FROM lessons l JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id
    WHERE l.id = ${id}`
  if (!row) throw new HttpError(404, 'This lesson doesn’t exist or may have been moved.')
  return row
}

function assertAccess(user, l) {
  const access = lessonAccess(user, { is_free: l.is_free }, l.module_order, l.order_index)
  if (access === 'login') throw new HttpError(401, 'Create a free account or log in to watch this lesson.', 'LOGIN_REQUIRED')
  if (access === 'upgrade') throw new HttpError(403, 'This lesson is part of the Pro library. Switch plan to unlock it.', 'UPGRADE_REQUIRED')
}

export default route({
  // Free lessons can be previewed logged out; everything else needs an account (and Pro for paid courses).
  async GET(req) {
    const l = await findLesson(idParam(req.query.id))
    const userId = await sessionUserId(req)
    const user = userId ? await loadUser(userId) : null
    assertAccess(user, l)
    const [done] = user
      ? await db()`SELECT 1 FROM lesson_progress WHERE user_id = ${user.id} AND lesson_id = ${l.id} AND completed`
      : []
    return {
      lesson: {
        id: l.id,
        title: l.title,
        duration_minutes: l.duration_minutes,
        content: l.content,
        video_url: l.video_url,
        order_index: l.order_index,
        module: { title: l.module_title, order_index: l.module_order },
        course: { slug: l.course_slug, title: l.course_title },
        completed: !!done,
      },
    }
  },

  // Mark complete / incomplete. Completing logs the lesson's minutes to today's activity
  // and issues a certificate once every lesson in the course is done.
  async POST(req) {
    const userId = await requireUserId(req)
    const user = await loadUser(userId)
    const l = await findLesson(idParam(req.query.id))
    assertAccess(user, l)
    const completed = body(req).completed !== false
    const sql = db()

    let certificate = null
    if (completed) {
      const fresh = await sql`
        INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
        VALUES (${userId}, ${l.id}, TRUE, now())
        ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = TRUE, completed_at = now()
        WHERE lesson_progress.completed = FALSE
        RETURNING id`
      if (fresh.length) await logActivity(req, userId, { minutes: l.duration_minutes })
      certificate = await maybeIssueCertificate(userId, l.course_id)
    } else {
      await sql`UPDATE lesson_progress SET completed = FALSE WHERE user_id = ${userId} AND lesson_id = ${l.id}`
    }

    const [p] = await sql`
      SELECT count(l.id)::int AS total, count(lp.id)::int AS done
      FROM modules m JOIN lessons l ON l.module_id = m.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ${userId} AND lp.completed
      WHERE m.course_id = ${l.course_id}`
    const { streak, studied_today } = await activityFor(req, userId)

    return {
      lesson_id: l.id,
      completed,
      progress: { done: p.done, total: p.total, pct: pct(p.done, p.total) },
      certificate: certificate && { ...certificate, course: { slug: l.course_slug, title: l.course_title } },
      streak,
      studied_today,
    }
  },
})
