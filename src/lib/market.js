// Live prices come from the server (/api/prices), which runs the random walk. This module just polls
// every 2 seconds while something on screen is subscribed, and shares the result.
import { useSyncExternalStore } from 'react'
import { api } from './api.js'

export const POLL_MS = 2000

const store = { ready: false, error: null, list: [], bySymbol: {} }
const listeners = new Set()
let version = 0
let timer = null
let inflight = false

function emit() {
  version++
  listeners.forEach((l) => l())
}

async function refresh() {
  if (inflight || document.hidden) return
  inflight = true
  try {
    const { instruments } = await api('/prices')
    const bySymbol = {}
    for (const i of instruments) {
      const prev = store.bySymbol[i.symbol]?.price ?? i.price
      bySymbol[i.symbol] = { ...i, prev, dayOpen: i.prev_close ?? i.base_price }
    }
    Object.assign(store, { ready: true, error: null, list: instruments.map((i) => bySymbol[i.symbol]), bySymbol })
  } catch (err) {
    store.error = err
  } finally {
    inflight = false
    emit()
  }
}

export function subscribeMarket(cb) {
  listeners.add(cb)
  if (!timer) {
    refresh()
    timer = setInterval(refresh, POLL_MS)
  }
  return () => {
    listeners.delete(cb)
    if (!listeners.size) { clearInterval(timer); timer = null }
  }
}

export const getQuote = (symbol) => store.bySymbol[symbol]

/** Re-renders the caller whenever new server prices arrive. */
export function useMarket() {
  useSyncExternalStore(subscribeMarket, () => version)
  return store
}

// ---------------------------------------------------------------------------
// Display-only estimates for the order ticket and calculators (the server does the real maths).
// ---------------------------------------------------------------------------
export function pipValueUsd(inst, price, lots = 1) {
  const v = inst.pip_size * inst.contract_size * lots
  return inst.quote_is_usd ? v : v / price
}

export function marginUsd(inst, price, lots, leverage) {
  const notional = inst.quote_is_usd ? inst.contract_size * lots * price : inst.contract_size * lots
  return notional / leverage
}

export const fmtPrice = (inst, p) =>
  p == null || Number.isNaN(Number(p)) ? '—' : Number(p).toLocaleString('en-US', { minimumFractionDigits: inst.decimals, maximumFractionDigits: inst.decimals })

/** "Follows live gold-api.com price · 40s ago" / "Market closed · last real price 26 Oct 20:43". */
export function feedLabel(q) {
  if (!q?.ref_source) return 'Simulated prices (no live feed)'
  const t = new Date(q.ref_time)
  if (!q.market_open) return `Market closed · follows last ${q.ref_source} price (${t.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})`
  const secs = Math.max(0, Math.round((Date.now() - t.getTime()) / 1000))
  return `Follows live ${q.ref_source} price · ${secs < 90 ? `${secs}s` : `${Math.round(secs / 60)}m`} ago`
}

export const changePct = (q) => (q ? ((q.price - q.dayOpen) / q.dayOpen) * 100 : 0)
