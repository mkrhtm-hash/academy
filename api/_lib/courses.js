// Shared course queries and the JSON shape the frontend receives.
import { db } from './db.js'

export const CATEGORIES = ['Forex', 'Gold', 'Indices', 'Crypto', 'Risk Management', 'Psychology']
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0)

/** All courses (optionally filtered) with lesson counts, real student counts and this user's progress. */
export function courseRows(userId, { category = null, level = null, slug = null } = {}) {
  return db()`
    SELECT c.*,
      (SELECT count(*) FROM modules m WHERE m.course_id = c.id)::int AS modules_count,
      (SELECT count(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id)::int AS lessons_count,
      (SELECT count(DISTINCT lp.user_id) FROM lesson_progress lp
         JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
        WHERE m.course_id = c.id)::int AS students,
      (SELECT count(*) FROM lesson_progress lp
         JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
        WHERE m.course_id = c.id AND lp.user_id = ${userId} AND lp.completed)::int AS done,
      (SELECT max(lp.completed_at) FROM lesson_progress lp
         JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
        WHERE m.course_id = c.id AND lp.user_id = ${userId} AND lp.completed) AS last_completed_at
    FROM courses c
    WHERE (${category}::text IS NULL OR c.category = ${category})
      AND (${level}::text IS NULL OR c.level = ${level})
      AND (${slug}::text IS NULL OR c.slug = ${slug})
    ORDER BY c.id`
}

export function publicCourse(c, signedIn) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    level: c.level,
    category: c.category,
    instructor_name: c.instructor_name,
    duration_minutes: c.duration_minutes,
    hue: String(c.thumbnail || '#10b981,#f2c14e').split(',').map((s) => s.trim()),
    description: c.description,
    outcomes: c.outcomes || [],
    is_free: c.is_free,
    modules_count: c.modules_count,
    lessons_count: c.lessons_count,
    students: c.students,
    progress: signedIn ? { done: c.done, total: c.lessons_count, pct: pct(c.done, c.lessons_count) } : null,
  }
}
