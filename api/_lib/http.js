// Tiny helpers shared by every /api route. Handlers use the Vercel/Express (req, res) signature,
// so the same files run under the local Express dev server and on Vercel unchanged.

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const DB_DOWN = /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|connect|password authentication|endpoint .* (is disabled|could not be found)|Couldn't connect/i

/**
 * Wraps a map of { GET, POST, ... } handlers with method checks, JSON errors and a
 * friendly "database unreachable" response.
 */
export function route(methods) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    const fn = methods[req.method]
    if (!fn) {
      res.setHeader('Allow', Object.keys(methods).join(', '))
      return res.status(405).json({ error: 'Method not allowed' })
    }
    try {
      const out = await fn(req, res)
      if (!res.headersSent) res.status(200).json(out ?? { ok: true })
    } catch (err) {
      if (res.headersSent) return
      if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code })
      if (DB_DOWN.test(err?.message || '') && !err?.code?.match?.(/^[0-9A-Z]{5}$/)) {
        console.error('[api] database unreachable:', err.message)
        return res.status(503).json({ error: 'We can’t reach the database right now. Please try again in a moment.', code: 'DB_UNAVAILABLE' })
      }
      console.error(`[api] ${req.method} ${req.url} failed:`, err)
      return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
    }
  }
}

export function body(req) {
  const b = req.body
  if (!b) return {}
  if (typeof b === 'string') {
    try { return JSON.parse(b) } catch { throw new HttpError(400, 'Invalid JSON body') }
  }
  return b
}

export function parseCookies(req) {
  const out = {}
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

/** Positive integer from a route/query param, or a 404. */
export function idParam(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(404, 'Not found')
  return n
}

/** Today's date (YYYY-MM-DD) in the browser's timezone, sent as X-Timezone. Falls back to UTC. */
export function localToday(req, offsetDays = 0) {
  let tz = req.headers['x-timezone']
  try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }) } catch { tz = 'UTC' }
  const d = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
