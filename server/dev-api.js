// Local stand-in for Vercel's /api functions. It loads the exact same files from /api and maps
// Vercel's file-based routes onto Express (api/courses/[slug].js → /api/courses/:slug),
// so nothing changes at deploy time. Vite proxies /api here (see vite.config.js).
import express from 'express'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PORT = Number(process.env.API_PORT) || 3001
const apiDir = fileURLToPath(new URL('../api', import.meta.url))

function collect(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('_') || e.name.startsWith('.')) return [] // _lib etc. are helpers, not routes (same as Vercel)
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return collect(full)
    return e.name.endsWith('.js') ? [full] : []
  })
}

const routes = collect(apiDir).map((file) => {
  const rel = path.relative(apiDir, file).replace(/\\/g, '/').replace(/\.js$/, '').replace(/(^|\/)index$/, '')
  const segments = rel ? rel.split('/') : []
  const urlPath = '/api' + segments.map((s) => '/' + s.replace(/^\[(\w+)\]$/, ':$1')).join('')
  return { file, urlPath, dynamic: segments.filter((s) => s.startsWith('[')).length }
})
// Static routes win over dynamic ones, like on Vercel (e.g. /api/positions/reset before /api/positions/:id).
routes.sort((a, b) => a.dynamic - b.dynamic || b.urlPath.length - a.urlPath.length)

// With the local database, hold requests until it accepts connections (it starts alongside this server).
const dbUrl = (() => { try { return new URL(process.env.DATABASE_URL) } catch { return null } })()
const dbReady = (async () => {
  if (!dbUrl || !['localhost', '127.0.0.1'].includes(dbUrl.hostname)) return
  const { portOpen } = await import('../scripts/local-db.js')
  for (let i = 0; i < 60 && !(await portOpen(Number(dbUrl.port) || 5432)); i++) await new Promise((r) => setTimeout(r, 500))
  await new Promise((r) => setTimeout(r, 500)) // let Postgres finish starting up after the port opens
})()

const router = express.Router()
const routesReady = (async () => {
  for (const r of routes) {
    const { default: handler } = await import(pathToFileURL(r.file).href)
    router.all(r.urlPath, (req, res) => {
      Object.assign(req.query, req.params) // Vercel exposes dynamic segments on req.query
      return handler(req, res)
    })
  }
})()

const app = express()
app.disable('x-powered-by')
// Listen straight away (so the Vite proxy never sees "connection refused") and hold each request
// until the routes are loaded and the database is reachable.
app.use((req, res, next) => { Promise.all([routesReady, dbReady]).then(() => next(), next) })
app.use(express.json({ limit: '100kb' }))
app.use(router)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))
// Malformed JSON bodies etc.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(err.status || 500).json({ error: err.status === 400 ? 'Invalid request body.' : 'Server error.' })
})

app.listen(PORT, async () => {
  await routesReady
  console.log(`API ready on http://localhost:${PORT} (${routes.length} routes)`)
})
