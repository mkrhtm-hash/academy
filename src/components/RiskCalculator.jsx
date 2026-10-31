import { Calculator, Loader2, Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useMarket } from '../lib/market.js'
import { usd } from '../lib/utils.js'
import { Card } from './ui.jsx'

export function NumberField({ label, value, onChange, step = 1, min = 0, suffix, hint }) {
  const v = parseFloat(value) || 0
  const fix = (n) => Number(Math.max(min, n).toFixed(step < 1 ? 2 : 0))
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-1 rounded-xl border border-line bg-soft p-1 focus-within:border-emerald-500/60">
        <button type="button" onClick={() => onChange(String(fix(v - step)))} className="rounded-lg p-2 text-muted hover:bg-soft hover:text-ink" aria-label={`Decrease ${label}`}><Minus className="h-3.5 w-3.5" /></button>
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" className="num w-full min-w-0 bg-transparent text-center text-sm font-semibold outline-none" placeholder="—" aria-label={label} />
        {suffix && <span className="text-xs text-muted">{suffix}</span>}
        <button type="button" onClick={() => onChange(String(fix(v + step)))} className="rounded-lg p-2 text-muted hover:bg-soft hover:text-ink" aria-label={`Increase ${label}`}><Plus className="h-3.5 w-3.5" /></button>
      </div>
      {hint && <div className="num mt-1 text-[0.7rem] text-muted">{hint}</div>}
    </div>
  )
}

/** Position-size calculator. The maths runs on the server (/api/tools/risk) using DB pip & contract sizes. */
export default function RiskCalculator({ balance = 10000, symbol = 'XAU/USD', onApply }) {
  const market = useMarket()
  const [sym, setSym] = useState(symbol)
  const [bal, setBal] = useState(String(Math.round(balance)))
  const [risk, setRisk] = useState('1')
  const [stop, setStop] = useState('20')
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setSym(symbol), [symbol])

  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        const qs = new URLSearchParams({ symbol: sym, account_size: bal || '0', risk_percent: risk || '0', stop_pips: stop || '0' })
        setRes(await api(`/tools/risk?${qs}`, { signal: ctrl.signal }))
        setErr('')
      } catch (e) {
        if (e.name !== 'AbortError') { setErr(e.message); setRes(null) }
      } finally {
        if (!ctrl.signal.aborted) setBusy(false)
      }
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [sym, bal, risk, stop])

  const riskNum = parseFloat(risk) || 0

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-gold" /><h2 className="text-lg font-semibold">Risk calculator</h2>{busy && <Loader2 className="h-4 w-4 animate-spin text-muted" />}</div>
      <p className="mt-1 text-sm text-muted">Size every trade from your stop-loss, not your gut.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Instrument</label>
          <select value={sym} onChange={(e) => setSym(e.target.value)} className="input">
            {(market.list.length ? market.list : [{ symbol: sym }]).map((i) => <option key={i.symbol}>{i.symbol}</option>)}
          </select>
        </div>
        <NumberField label="Account size" value={bal} onChange={setBal} step={500} suffix="$" />
        <NumberField label="Risk per trade" value={risk} onChange={setRisk} step={0.25} suffix="%" />
        <NumberField label="Stop distance" value={stop} onChange={setStop} step={1} suffix="pips" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-gold/10 p-4 ring-1 ring-emerald-500/20">
        <div><div className="text-[0.7rem] text-muted">Amount at risk</div><div className="num text-lg font-semibold">{res ? usd(res.risk_amount) : '—'}</div></div>
        <div><div className="text-[0.7rem] text-muted">Position size</div><div className="num text-lg font-semibold text-gradient">{res ? `${res.lot_size.toFixed(2)} lots` : '—'}</div></div>
        <div><div className="text-[0.7rem] text-muted">Pip value / lot</div><div className="num text-lg font-semibold">{res ? usd(res.pip_value_per_lot) : '—'}</div></div>
      </div>
      {res && <p className="num mt-2 text-[0.7rem] text-muted">1 pip = {res.pip_size} · contract size {res.contract_size.toLocaleString()} · rounded down to 0.01 lots</p>}
      {err && <p className="mt-3 text-xs text-rose-400">{err}</p>}
      {res?.too_small && <p className="mt-3 text-xs text-amber-400">That risk is smaller than the minimum 0.01 lot. Widen your risk or tighten your stop.</p>}
      {riskNum > 2 && <p className="mt-3 text-xs text-amber-400">Heads up: most professionals risk 2% or less per trade.</p>}
      {onApply && (
        <button disabled={!res || res.too_small} onClick={() => onApply(sym, res.lot_size, parseFloat(stop) || 0)} className="btn btn-ghost mt-4 w-full">Use in order ticket</button>
      )}
    </Card>
  )
}
