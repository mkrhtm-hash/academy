import bcrypt from 'bcryptjs'
import { loadUser, startSession } from '../_lib/auth.js'
import { db } from '../_lib/db.js'
import { HttpError, body, route } from '../_lib/http.js'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default route({
  async POST(req, res) {
    const { email, password, full_name, experience_level } = body(req)
    const mail = String(email || '').trim().toLowerCase()
    const name = String(full_name || '').trim()
    if (!name || name.length > 60) throw new HttpError(400, 'Please enter your name (up to 60 characters).')
    if (!EMAIL_RE.test(mail) || mail.length > 200) throw new HttpError(400, 'Please enter a valid email address.')
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new HttpError(400, 'Password must be at least 8 characters.')
    if (!LEVELS.includes(experience_level)) throw new HttpError(400, 'Please choose your experience level.')

    const sql = db()
    const hash = await bcrypt.hash(password, 10)
    // New users start on the Free plan with a $10,000 virtual practice account.
    const [created] = await sql`
      WITH u AS (
        INSERT INTO users (email, password_hash, full_name, experience_level, plan_id)
        SELECT ${mail}, ${hash}, ${name}, ${experience_level}, id FROM plans WHERE name = 'Free'
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      ), a AS (
        INSERT INTO demo_accounts (user_id, balance, equity) SELECT id, 10000, 10000 FROM u RETURNING user_id
      )
      SELECT id FROM u`
    if (!created) {
      const [taken] = await sql`SELECT 1 FROM users WHERE email = ${mail}`
      if (taken) throw new HttpError(409, 'An account with this email already exists. Try logging in.')
      throw new HttpError(500, 'Plans are missing from the database. Run "npm run db:setup" first.')
    }

    await startSession(res, created.id)
    return { user: await loadUser(created.id) }
  },
})
