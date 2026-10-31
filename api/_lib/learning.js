// Learning progress helpers: streaks, weekly minutes, lesson access and certificates.
import { randomBytes } from 'node:crypto'
import { db } from './db.js'
import { hasFullLibrary } from './auth.js'
import { localToday } from './http.js'

const dayMs = 86400000
const shift = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * dayMs).toISOString().slice(0, 10)

/** Consecutive days (ending today, or yesterday if nothing yet today) with a row in activity_log. */
export function streakFrom(dates, today) {
  const set = new Set(dates)
  let day = set.has(today) ? today : shift(today, -1)
  let streak = 0
  while (set.has(day)) { streak++; day = shift(day, -1) }
  return streak
}

export async function activityFor(req, userId) {
  const sql = db()
  const today = localToday(req)
  const rows = await sql`
    SELECT activity_date::text AS d, minutes_learned AS m, trades_placed AS t FROM activity_log
    WHERE user_id = ${userId} AND activity_date > ${shift(today, -400)}::date
      AND (minutes_learned > 0 OR trades_placed > 0)
    ORDER BY activity_date DESC`
  const byDay = new Map(rows.map((r) => [r.d, r]))
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = shift(today, i - 6)
    return { date: d, minutes: byDay.get(d)?.m ?? 0, trades: byDay.get(d)?.t ?? 0 }
  })
  return {
    today,
    streak: streakFrom(rows.map((r) => r.d), today),
    studied_today: byDay.has(today),
    week,
    week_minutes: week.reduce((n, d) => n + d.minutes, 0),
  }
}

export async function logActivity(req, userId, { minutes = 0, trades = 0 }) {
  const sql = db()
  const today = localToday(req)
  return sql`
    INSERT INTO activity_log (user_id, activity_date, minutes_learned, trades_placed)
    VALUES (${userId}, ${today}, ${minutes}, ${trades})
    ON CONFLICT (user_id, activity_date) DO UPDATE SET
      minutes_learned = activity_log.minutes_learned + EXCLUDED.minutes_learned,
      trades_placed = activity_log.trades_placed + EXCLUDED.trades_placed`
}

/** Free courses are open to everyone; the first lesson of every course is a free preview. */
export const isPreview = (course, moduleOrder, lessonOrder) => course.is_free || (moduleOrder === 1 && lessonOrder === 1)

/** 'ok' | 'login' (needs an account) | 'upgrade' (needs Pro/Elite). */
export function lessonAccess(user, course, moduleOrder, lessonOrder) {
  if (isPreview(course, moduleOrder, lessonOrder)) return 'ok'
  if (!user) return 'login'
  return hasFullLibrary(user) ? 'ok' : 'upgrade'
}

export function certificateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('')
  return `VE-${chars.slice(0, 4)}-${chars.slice(4)}`
}

/** Issues a certificate if every lesson in the course is complete. Returns it only when newly issued. */
export async function maybeIssueCertificate(userId, courseId) {
  const sql = db()
  const [p] = await sql`
    SELECT count(l.id)::int AS total, count(lp.id)::int AS done
    FROM modules m JOIN lessons l ON l.module_id = m.id
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ${userId} AND lp.completed
    WHERE m.course_id = ${courseId}`
  if (!p.total || p.done < p.total) return null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [cert] = await sql`
        INSERT INTO certificates (user_id, course_id, certificate_code)
        VALUES (${userId}, ${courseId}, ${certificateCode()})
        ON CONFLICT (user_id, course_id) DO NOTHING
        RETURNING certificate_code, issued_at`
      return cert || null
    } catch (err) {
      if (err.code !== '23505') throw err // code collision: try another
    }
  }
  return null
}
