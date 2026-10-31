// All API routes, served by ONE function (api/[...path].js) so the app fits Vercel's Hobby-plan
// limit of 12 functions. Route handlers live in api/_routes/ (folders starting with "_" are not
// turned into functions by Vercel). Static imports so Vercel bundles every route.
import login from '../_routes/auth/login.js'
import logout from '../_routes/auth/logout.js'
import me from '../_routes/auth/me.js'
import signup from '../_routes/auth/signup.js'
import courseBySlug from '../_routes/courses/[slug].js'
import courses from '../_routes/courses/index.js'
import dashboard from '../_routes/dashboard.js'
import lesson from '../_routes/lessons/[id].js'
import plans from '../_routes/plans.js'
import positionById from '../_routes/positions/[id].js'
import positions from '../_routes/positions/index.js'
import positionsReset from '../_routes/positions/reset.js'
import prices from '../_routes/prices.js'
import bookSession from '../_routes/sessions/[id]/book.js'
import sessions from '../_routes/sessions/index.js'
import stats from '../_routes/stats.js'
import risk from '../_routes/tools/risk.js'

// Same paths as before; fixed paths are listed before ":param" ones that could also match.
const table = [
  ['/api/auth/login', login],
  ['/api/auth/logout', logout],
  ['/api/auth/me', me],
  ['/api/auth/signup', signup],
  ['/api/courses', courses],
  ['/api/courses/:slug', courseBySlug],
  ['/api/dashboard', dashboard],
  ['/api/lessons/:id', lesson],
  ['/api/plans', plans],
  ['/api/positions', positions],
  ['/api/positions/reset', positionsReset],
  ['/api/positions/:id', positionById],
  ['/api/prices', prices],
  ['/api/sessions', sessions],
  ['/api/sessions/:id/book', bookSession],
  ['/api/stats', stats],
  ['/api/tools/risk', risk],
].map(([pattern, handler]) => ({ parts: pattern.split('/').filter(Boolean), handler }))

export const routeCount = table.length

function match(pathname) {
  const segs = pathname.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s) } catch { return s } })
  for (const { parts, handler } of table) {
    if (parts.length !== segs.length) continue
    const params = {}
    if (parts.every((p, i) => (p.startsWith(':') ? ((params[p.slice(1)] = segs[i]), true) : p === segs[i]))) return { handler, params }
  }
  return null
}

/** (req, res) handler for every /api/* request, on Vercel and in the local dev server. */
export default async function dispatch(req, res) {
  const url = new URL(req.url, 'http://localhost')
  // On Vercel, vercel.json rewrites /api/<path> to /api/handler?__path=<path>; locally the URL is untouched.
  const rewritten = url.searchParams.get('__path')
  url.searchParams.delete('__path')
  const pathname = rewritten !== null ? `/api/${rewritten}` : url.pathname
  const found = match(pathname.replace(/\/+$/, '') || '/')
  if (!found) return res.status(404).json({ error: 'Not found' })
  // Handlers read query-string values and path params (e.g. :slug, :id) from req.query.
  const query = { ...Object.fromEntries(url.searchParams), ...found.params }
  try { req.query = query } catch { Object.assign(req.query, query) }
  return found.handler(req, res)
}
