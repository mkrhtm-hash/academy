// Browser-side API client. Only talks to our own /api routes (never to the database directly).
import { useCallback, useEffect, useRef, useState } from 'react'

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Lets the app show a "database unreachable" banner from anywhere.
const dbListeners = new Set()
export const onDbStatus = (fn) => { dbListeners.add(fn); return () => dbListeners.delete(fn) }
const reportDb = (down) => dbListeners.forEach((fn) => fn(down))

const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' } })()

export async function api(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: { 'X-Timezone': TZ, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    reportDb(true)
    throw new ApiError(0, 'Can’t reach the VaultEdge server. Is “npm run dev” running?', 'NETWORK')
  }
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  // A 5xx with no JSON body comes from the dev proxy: the API server (port 3001) isn't running.
  if (!data && res.status >= 500) {
    reportDb(true)
    throw new ApiError(res.status, 'Can’t reach the VaultEdge API server. Stop the app and start it again with “npm run dev”.', 'NETWORK')
  }
  if (res.status === 503 && data?.code === 'DB_UNAVAILABLE') reportDb(true)
  else if (res.status < 500) reportDb(false)
  if (!res.ok) throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.code)
  return data
}

/**
 * Loads `path` (or nothing when path is null) and exposes { data, error, loading, reload, setData }.
 * `poll` (ms) re-fetches quietly in the background.
 */
export function useApi(path, { poll } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path })
  const ctrl = useRef(null)

  const load = useCallback(async (quiet = false) => {
    if (!path) return
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await api(path, { signal: c.signal })
      if (!c.signal.aborted) setState({ data, error: null, loading: false })
    } catch (error) {
      if (error.name === 'AbortError') return
      setState((s) => ({ data: quiet ? s.data : null, error, loading: false }))
    }
  }, [path])

  useEffect(() => {
    setState({ data: null, error: null, loading: !!path })
    load()
    return () => ctrl.current?.abort()
  }, [load, path])

  useEffect(() => {
    if (!poll || !path) return
    const t = setInterval(() => { if (!document.hidden) load(true) }, poll)
    return () => clearInterval(t)
  }, [poll, path, load])

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), [])
  return { ...state, reload: load, setData }
}
