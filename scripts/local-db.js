// Runs a real PostgreSQL server on this computer (no install, no account) for local development.
// Data lives in ./.localdb and survives restarts. Only used when DATABASE_URL points at localhost;
// with a Neon DATABASE_URL this script does nothing.
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const LOCAL = { user: 'vaultedge', password: 'vaultedge', port: 5433, database: 'vaultedge' }
export const LOCAL_URL = `postgresql://${LOCAL.user}:${LOCAL.password}@localhost:${LOCAL.port}/${LOCAL.database}`
const dataDir = fileURLToPath(new URL('../.localdb', import.meta.url))

export const isLocalUrl = (url) => {
  try { return ['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname) } catch { return false }
}

export function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1' })
    s.once('connect', () => { s.destroy(); resolve(true) })
    s.once('error', () => resolve(false))
  })
}

/** Starts the local cluster (creating it on first run). Returns { server, fresh } or null if already running. */
export async function startLocalPostgres() {
  if (await portOpen(LOCAL.port)) return null
  const server = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: LOCAL.user,
    password: LOCAL.password,
    port: LOCAL.port,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    onError: (m) => { if (m && !/^\s*$/.test(String(m))) process.env.LOCAL_DB_DEBUG && console.error('[db]', String(m)) },
  })
  const fresh = !existsSync(path.join(dataDir, 'PG_VERSION'))
  if (fresh) await server.initialise()
  await server.start()
  if (fresh) await server.createDatabase(LOCAL.database)
  return { server, fresh }
}

// `node scripts/local-db.js`: keep the local database running alongside `npm run dev`.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!isLocalUrl(process.env.DATABASE_URL || '')) {
    console.log('Using the remote database from DATABASE_URL, so the local database is not needed.')
    process.exit(0)
  }
  try {
    const started = await startLocalPostgres()
    if (!started) {
      console.log(`Local database already running on port ${LOCAL.port}.`)
    } else {
      console.log(`Local PostgreSQL running on port ${LOCAL.port} (data in .localdb).`)
      if (started.fresh) {
        const { runSetup } = await import('./db-setup.js')
        await runSetup(process.env.DATABASE_URL)
      }
      const stop = async () => { await started.server.stop().catch(() => {}); process.exit(0) }
      process.on('SIGINT', stop)
      process.on('SIGTERM', stop)
    }
    setInterval(() => {}, 1 << 30) // stay alive while the dev server runs
  } catch (err) {
    console.error('✖ Could not start the local database:', err?.message || err)
    process.exit(1)
  }
}
