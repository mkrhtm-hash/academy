// Server-only database access. DATABASE_URL never leaves the /api folder.
// Neon (production / Vercel) uses Neon's serverless HTTP driver. A localhost DATABASE_URL (the local
// database from scripts/local-db.js) uses node-postgres behind the same `sql` interface, so route
// code is identical in both places.
import { neon } from '@neondatabase/serverless'
import pg from 'pg'
import { HttpError } from './http.js'

let sql

const isLocal = (url) => {
  try { return ['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname) } catch { return false }
}

/** node-postgres adapter matching the parts of Neon's API we use: sql`...`, sql.query(), sql.transaction(). */
function localSql(url) {
  const pool = new pg.Pool({ connectionString: url, max: 10 })
  pool.on('error', (err) => console.error('[db] idle client error:', err.message))

  // Query objects run when awaited, or can be handed to transaction() unexecuted, like Neon's.
  const query = (text, values = []) => ({
    text,
    values,
    then: (resolve, reject) => pool.query(text, values).then((r) => r.rows).then(resolve, reject),
  })
  const tag = (strings, ...values) => query(strings.reduce((acc, s, i) => acc + (i ? `$${i}` : '') + s, ''), values)
  tag.query = query
  tag.transaction = async (queries, opts = {}) => {
    const client = await pool.connect()
    try {
      await client.query(opts.readOnly ? 'BEGIN READ ONLY' : 'BEGIN')
      const out = []
      for (const q of queries) out.push((await client.query(q.text, q.values)).rows)
      await client.query('COMMIT')
      return out
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  }
  return tag
}

export function db() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new HttpError(503, 'The database isn’t configured yet (DATABASE_URL is missing).', 'DB_UNAVAILABLE')
  }
  sql ??= isLocal(url) ? localSql(url) : neon(url)
  return sql
}

export const num = (v) => (v == null ? null : Number(v))
export const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
