import { loadUser, requireUserId } from './_lib/auth.js'
import { courseRows, publicCourse } from './_lib/courses.js'
import { db } from './_lib/db.js'
import { HttpError, route } from './_lib/http.js'
import { activityFor } from './_lib/learning.js'
import { accountSummary, tick } from './_lib/market.js'
import { sessionJson } from './_lib/sessions.js'

// Everything the Dashboard (and Achievements/Profile) need, for the logged-in user only.
export default route({
  async GET(req) {
    const userId = await requireUserId(req)
    const user = await loadUser(userId)
    if (!user) throw new HttpError(401, 'Please log in to continue.', 'UNAUTHENTICATED')
    const sql = db()

    const [courses, nextLessons, certificates, bookings, [nextSession], [trading]] = await sql.transaction([
      courseRows(userId),
      // first not-yet-completed lesson of every course
      sql`
        SELECT DISTINCT ON (m.course_id) m.course_id, l.id, l.title, m.title AS module_title, m.order_index AS module_order
        FROM lessons l JOIN modules m ON m.id = l.module_id
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ${userId} AND lp.completed
        WHERE lp.id IS NULL
        ORDER BY m.course_id, m.order_index, l.order_index`,
      sql`
        SELECT ce.certificate_code, ce.issued_at, c.slug, c.title, c.level, c.instructor_name, c.duration_minutes, c.thumbnail,
               (SELECT count(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id)::int AS lessons_count
        FROM certificates ce JOIN courses c ON c.id = ce.course_id
        WHERE ce.user_id = ${userId} ORDER BY ce.issued_at DESC`,
      sql`
        SELECT s.*, TRUE AS booked FROM session_bookings b JOIN live_sessions s ON s.id = b.session_id
        WHERE b.user_id = ${userId} AND s.start_time + make_interval(mins => s.duration_minutes) > now()
        ORDER BY s.start_time`,
      sql`
        SELECT s.*, EXISTS (SELECT 1 FROM session_bookings b WHERE b.session_id = s.id AND b.user_id = ${userId}) AS booked
        FROM live_sessions s WHERE s.start_time > now() ORDER BY s.start_time LIMIT 1`,
      sql`
        SELECT count(*)::int AS trades, count(*) FILTER (WHERE stop_loss IS NOT NULL)::int AS with_stop
        FROM positions WHERE user_id = ${userId}`,
    ], { readOnly: true })

    const activity = await activityFor(req, userId)
    const { account } = await accountSummary(userId, await tick())

    const list = courses.map((c) => publicCourse(c, true))
    const next = new Map(nextLessons.map((n) => [n.course_id, n]))
    const lastAt = new Map(courses.map((c) => [c.id, c.last_completed_at ? new Date(c.last_completed_at).getTime() : 0]))
    const mine = list.filter((c) => c.progress.done > 0)
    const inProgress = mine.filter((c) => c.progress.pct < 100).sort((a, b) => lastAt.get(b.id) - lastAt.get(a.id))

    // "Continue learning": the course you touched most recently, else a free course to start.
    const resume = inProgress[0] || (mine.length ? null : list.find((c) => c.is_free))
    const resumeNext = resume && next.get(resume.id)
    const lessonsDone = mine.reduce((n, c) => n + c.progress.done, 0)

    const badges = []
    if (lessonsDone > 0) badges.push('first-lesson')
    if (activity.streak >= 7) badges.push('streak-7')
    if (trading.with_stop > 0) badges.push('risk-manager')
    if (trading.trades > 0) badges.push('first-trade')
    if (certificates.length > 0) badges.push('graduate')

    return {
      user,
      continue: resume && resumeNext
        ? {
            course: resume,
            started: resume.progress.done > 0,
            next_lesson: { id: resumeNext.id, title: resumeNext.title, module_title: resumeNext.module_title, module_order: resumeNext.module_order },
          }
        : null,
      my_courses: mine,
      recommended: list.filter((c) => c.progress.done === 0).slice(0, 3),
      totals: {
        courses_in_progress: inProgress.length,
        courses_started: mine.length,
        lessons_completed: lessonsDone,
        lessons_in_my_courses: mine.reduce((n, c) => n + c.progress.total, 0),
      },
      activity,
      account,
      bookings: bookings.map(sessionJson),
      next_session: nextSession ? sessionJson(nextSession) : null,
      certificates: certificates.map((c) => ({
        code: c.certificate_code,
        issued_at: c.issued_at,
        course: { slug: c.slug, title: c.title, level: c.level, instructor_name: c.instructor_name, duration_minutes: c.duration_minutes, lessons_count: c.lessons_count, hue: c.thumbnail.split(',') },
      })),
      badges,
    }
  },
})
