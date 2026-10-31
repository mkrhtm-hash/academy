import bcrypt from 'bcryptjs'
import { loadUser, startSession } from '../_lib/auth.js'
import { db } from '../_lib/db.js'
import { HttpError, body, route } from '../_lib/http.js'

// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.6Tq5bQZ1hDlA0a9iVvJpG5Qy3Z1e'

export default route({
  async POST(req, res) {
    const { email, password } = body(req)
    const mail = String(email || '').trim().toLowerCase()
    if (!mail || typeof password !== 'string' || !password) throw new HttpError(400, 'Please enter your email and password.')

    const sql = db()
    const [row] = await sql`SELECT id, password_hash FROM users WHERE email = ${mail}`
    const ok = await bcrypt.compare(password, row?.password_hash || DUMMY_HASH)
    if (!row || !ok) throw new HttpError(401, 'That email and password combination didn’t work.')

    await startSession(res, row.id)
    return { user: await loadUser(row.id) }
  },
})
