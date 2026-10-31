// Local stand-in for Vercel. It serves the exact same function Vercel deploys (api/handler.js,
// which routes to api/_routes/*), so nothing changes at deploy time. Vite proxies /api here.
import express from 'express'
import handler from '../api/handler.js'
import { routeCount } from '../api/_lib/router.js'

const PORT = Number(process.env.API_PORT) || 3001

// With the local database, hold requests until it accepts connections (it starts alongside this server).
const dbUrl = (() => { try { return new URL(process.env.DATABASE_URL) } catch { return null } })()
const dbReady = (async () => {
  if (!dbUrl || !['localhost', '127.0.0.1'].includes(dbUrl.hostname)) return
  const { portOpen } = await import('../scripts/local-db.js')
  for (let i = 0; i < 60 && !(await portOpen(Number(dbUrl.port) || 5432)); i++) await new Promise((r) => setTimeout(r, 500))
  await new Promise((r) => setTimeout(r, 500)) // let Postgres finish starting up after the port opens
})()

const app = express()
app.disable('x-powered-by')
app.use((req, res, next) => { dbReady.then(() => next(), next) })
app.use(express.json({ limit: '100kb' }))
app.all('/api/*', (req, res) => handler(req, res))
// Malformed JSON bodies etc.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(err.status || 500).json({ error: err.status === 400 ? 'Invalid request body.' : 'Server error.' })
})

app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT} (${routeCount} routes, 1 function)`))
