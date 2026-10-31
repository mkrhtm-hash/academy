import { endSession, loadUser, requireUserId, sessionUserId } from '../_lib/auth.js'
import { db } from '../_lib/db.js'
import { HttpError, body, route } from '../_lib/http.js'
import { activityFor } from '../_lib/learning.js'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default route({
  // Returns { user: null } when logged out (not an error), so the app can render public pages.
  async GET(req, res) {
    const id = await sessionUserId(req)
    if (!id) return { user: null }
    const user = await loadUser(id)
    if (!user) { endSession(res); return { user: null } }
    const { streak, studied_today } = await activityFor(req, id)
    return { user, streak, studied_today }
  },

  async PATCH(req) {
    const id = await requireUserId(req)
    const { full_name, experience_level } = body(req)
    const name = full_name === undefined ? undefined : String(full_name).trim()
    if (name !== undefined && (!name || name.length > 60)) throw new HttpError(400, 'Please enter your name (up to 60 characters).')
    if (experience_level !== undefined && !LEVELS.includes(experience_level)) throw new HttpError(400, 'Invalid experience level.')
    await db()`
      UPDATE users SET
        full_name = COALESCE(${name ?? null}, full_name),
        experience_level = COALESCE(${experience_level ?? null}, experience_level)
      WHERE id = ${id}`
    return { user: await loadUser(id) }
  },
})
