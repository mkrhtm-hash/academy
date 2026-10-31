import { sessionUserId } from '../../_lib/auth.js'
import { CATEGORIES, LEVELS, courseRows, publicCourse } from '../../_lib/courses.js'
import { route } from '../../_lib/http.js'

// Public: the catalog is visible to everyone. Progress is included when logged in.
export default route({
  async GET(req) {
    const userId = await sessionUserId(req)
    const category = CATEGORIES.includes(req.query.category) ? req.query.category : null
    const level = LEVELS.includes(req.query.level) ? req.query.level : null
    const rows = await courseRows(userId, { category, level })
    return { courses: rows.map((c) => publicCourse(c, !!userId)), categories: CATEGORIES, levels: LEVELS }
  },
})
