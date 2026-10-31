// Login sessions: a signed JWT (HS256) stored in an httpOnly cookie.
import { createHmac } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { db } from './db.js'
import { HttpError, parseCookies } from './http.js'

const COOKIE = 've_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

let derived
function secret() {
  const s = process.env.JWT_SECRET
  if (s) return new TextEncoder().encode(s)
  // Fallback when JWT_SECRET isn't configured: a key derived from the (secret) database credentials,
  // so login still works after a one-variable deploy. Setting JWT_SECRET is still recommended.
  if (!process.env.DATABASE_URL) throw new HttpError(500, 'JWT_SECRET is not set on the server.')
  if (!derived) {
    console.warn('[auth] JWT_SECRET not set; using a key derived from DATABASE_URL')
    derived = createHmac('sha256', 'vaultedge-session-key').update(process.env.DATABASE_URL).digest()
  }
  return derived
}

function cookie(value, maxAge) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

export async function startSession(res, userId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())
  res.setHeader('Set-Cookie', cookie(token, MAX_AGE))
}

export function endSession(res) {
  res.setHeader('Set-Cookie', cookie('', 0))
}

/** The logged-in user's id, or null. Never throws for bad/expired tokens. */
export async function sessionUserId(req) {
  const token = parseCookies(req)[COOKIE]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    const id = Number(payload.sub)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export async function requireUserId(req) {
  const id = await sessionUserId(req)
  if (!id) throw new HttpError(401, 'Please log in to continue.', 'UNAUTHENTICATED')
  return id
}

export async function loadUser(userId) {
  const sql = db()
  const [u] = await sql`
    SELECT u.id, u.email, u.full_name, u.experience_level, u.created_at, u.is_admin, p.id AS plan_id, p.name AS plan_name
    FROM users u JOIN plans p ON p.id = u.plan_id
    WHERE u.id = ${userId}`
  return u ? publicUser(u) : null
}

export function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    experience_level: u.experience_level,
    created_at: u.created_at,
    is_admin: !!u.is_admin,
    plan: { id: u.plan_id, name: u.plan_name },
  }
}

/** The logged-in user if they are an admin; otherwise 401/403. Checked on every admin API call. */
export async function requireAdmin(req) {
  const user = await loadUser(await requireUserId(req))
  if (!user) throw new HttpError(401, 'Please log in to continue.', 'UNAUTHENTICATED')
  if (!user.is_admin) throw new HttpError(403, 'Admins only.', 'FORBIDDEN')
  return user
}

/** Free-plan users get free courses plus preview lessons; Pro and Elite unlock everything. */
export const hasFullLibrary = (user) => !!user && user.plan.name !== 'Free'
