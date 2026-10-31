// Self-setup: the first API request after a deploy creates the tables and loads the sample data
// (db/schema.sql + db/seed.sql, both idempotent), so a fresh Neon database needs no manual step.
// Also re-runs the seed when the live-session schedule has run out, to keep "this week" populated.
import { Pool, neonConfig } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { db } from './db.js'

let ready = null

const sqlFile = (name) => readFileSync(path.join(process.cwd(), 'db', name), 'utf8')

async function runSql(files) {
  neonConfig.webSocketConstructor ??= globalThis.WebSocket ?? (await import('ws')).default
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock(727002)') // one setup at a time across cold starts
    for (const f of files) await client.query(sqlFile(f))
  } finally {
    await client.query('SELECT pg_advisory_unlock(727002)').catch(() => {})
    client.release()
    await pool.end()
  }
}

async function check() {
  const url = process.env.DATABASE_URL
  if (!url || ['localhost', '127.0.0.1'].includes(new URL(url).hostname)) return // local: npm run db:setup / local-db.js
  const [state] = await db()`
    SELECT to_regclass('public.demo_orders') IS NOT NULL
       AND (SELECT count(*) FROM information_schema.columns
            WHERE (table_name = 'instruments' AND column_name = 'ref_checked_at')
               OR (table_name = 'users' AND column_name = 'is_admin')) = 2 AS schema_ok`
  if (!state.schema_ok) {
    console.log('[setup] creating tables and loading sample data…')
    await runSql(['schema.sql', 'seed.sql'])
    return
  }
  const [s] = await db()`SELECT count(*)::int AS upcoming FROM live_sessions WHERE start_time > now()`
  if (s.upcoming === 0) {
    console.log('[setup] live-session schedule ran out; refreshing sample data…')
    await runSql(['seed.sql'])
  }
}

/** Resolves once the database is ready. Retries on the next request if it failed. */
export function ensureDatabase() {
  ready ??= check().catch((err) => { ready = null; throw err })
  return ready
}
