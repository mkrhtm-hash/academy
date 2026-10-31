// Runs db/schema.sql then db/seed.sql against DATABASE_URL and prints row counts.
// Both files are idempotent, so this is safe to run as often as you like.
// Works with Neon (over WebSockets) and with the local database from scripts/local-db.js.
import { Pool, neonConfig } from '@neondatabase/serverless'
import pg from 'pg'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isLocalUrl, startLocalPostgres } from './local-db.js'

neonConfig.webSocketConstructor = globalThis.WebSocket

const file = (name) => readFileSync(fileURLToPath(new URL(`../db/${name}`, import.meta.url)), 'utf8')

export async function runSetup(url) {
  const pool = isLocalUrl(url) ? new pg.Pool({ connectionString: url }) : new Pool({ connectionString: url })
  try {
    console.log('→ Applying db/schema.sql …')
    await pool.query(file('schema.sql'))
    console.log('→ Applying db/seed.sql …')
    await pool.query(file('seed.sql'))
    const { rows } = await pool.query(`
      SELECT 'plans' AS "table", count(*)::int AS rows FROM plans
      UNION ALL SELECT 'courses', count(*)::int FROM courses
      UNION ALL SELECT 'modules', count(*)::int FROM modules
      UNION ALL SELECT 'lessons', count(*)::int FROM lessons
      UNION ALL SELECT 'instruments', count(*)::int FROM instruments
      UNION ALL SELECT 'live_sessions', count(*)::int FROM live_sessions
      UNION ALL SELECT 'users', count(*)::int FROM users`)
    console.log('\n✔ Database ready. Row counts:')
    console.table(rows)
  } finally {
    await pool.end()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('✖ DATABASE_URL is not set. Add it to .env (see .env.example).')
    process.exit(1)
  }
  let local = null
  try {
    // If the local database isn't running yet (npm run dev not started), start it just for this.
    if (isLocalUrl(url)) local = await startLocalPostgres()
    await runSetup(url)
  } catch (err) {
    console.error('\n✖ Database setup failed:', err.message)
    if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed|WebSocket/i.test(err.message)) {
      console.error('  Could not reach the database. Check DATABASE_URL in .env and your internet connection.')
    }
    process.exitCode = 1
  } finally {
    if (local) await local.server.stop()
  }
}
