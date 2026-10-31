import { AnimatePresence, motion } from 'framer-motion'
import { CandlestickChart, History, Loader2, RotateCcw, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import CandleChart from '../components/CandleChart.jsx'
import Modal from '../components/Modal.jsx'
import RiskCalculator, { NumberField } from '../components/RiskCalculator.jsx'
import { Card, Disclaimer, EmptyState, ErrorState, Page, PageHeader, PracticeLabel, RowsSkeleton, SimulatedBadge, Skeleton } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { api, useApi } from '../lib/api.js'
import { POLL_MS, changePct, feedLabel, fmtPrice, marginUsd, pipValueUsd, useMarket } from '../lib/market.js'
import { signedUsd, usd } from '../lib/utils.js'

export default function Simulator() {
  const market = useMarket()
  const { state, toast } = useApp()
  const acct = useApi('/positions', { poll: POLL_MS })
  const [symbol, setSymbol] = useState('XAU/USD')
  const [lots, setLots] = useState('0.10')
  const [slPips, setSlPips] = useState('20')
  const [tpPips, setTpPips] = useState('40')
  const [confirmReset, setConfirmReset] = useState(false)
  const [busy, setBusy] = useState(null) // 'buy' | 'sell' | 'reset' | position id
  const seenHistory = useRef(null)

  const data = acct.data
  const account = data?.account
  const positions = data?.positions || []
  const history = data?.history || []

  // Toast when the server closes a trade by stop-loss / take-profit.
  useEffect(() => {
    if (!data) return
    const ids = new Set(history.map((h) => h.id))
    if (seenHistory.current) {
      history.filter((h) => !seenHistory.current.has(h.id) && h.close_reason !== 'Manual').forEach((h) => {
        const sl = h.close_reason === 'Stop-loss'
        toast({ type: sl ? 'error' : 'success', title: `${h.close_reason} hit on ${h.symbol}`, message: `Closed ${h.side.toUpperCase()} ${h.lot_size} lots at ${signedUsd(h.realized_pnl)}` })
      })
    }
    seenHistory.current = ids
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = market.bySymbol[symbol]
  if (market.error && !market.ready) return <ErrorState error={market.error} />
  if (acct.error && !data) return <ErrorState error={acct.error} onRetry={acct.reload} />

  const lotNum = parseFloat(lots) || 0
  const sl = parseFloat(slPips) || 0
  const tp = parseFloat(tpPips) || 0
  const pipVal = q ? pipValueUsd(q, q.price, lotNum) : 0
  const reqMargin = q && account ? marginUsd(q, q.price, lotNum, account.leverage) : 0
  const chg = changePct(q)

  // Convert the pip distances into price levels; the server re-checks they're on the correct side.
  const levels = (side) => {
    const dir = side === 'buy' ? 1 : -1
    const entry = side === 'buy' ? q.ask : q.bid
    return {
      stop_loss: sl ? Number((entry - dir * sl * q.pip_size).toFixed(q.decimals)) : null,
      take_profit: tp ? Number((entry + dir * tp * q.pip_size).toFixed(q.decimals)) : null,
    }
  }

  const place = async (side) => {
    if (!q) return
    setBusy(side)
    try {
      const res = await api('/positions', { method: 'POST', body: { symbol, side, lot_size: lotNum, ...levels(side) } })
      const { position: p, ...summary } = res
      acct.setData(summary)
      toast({ title: `${side === 'buy' ? 'Bought' : 'Sold'} ${p.lot_size} ${p.symbol}`, message: `Filled at ${fmtPrice(q, p.entry_price)}${p.stop_loss ? ` · SL ${fmtPrice(q, p.stop_loss)}` : ' · No stop-loss set!'}` })
    } catch (err) {
      toast({ type: 'error', title: 'Trade not placed', message: err.message })
    } finally {
      setBusy(null)
    }
  }

  const close = async (p) => {
    setBusy(p.id)
    try {
      const res = await api(`/positions/${p.id}`, { method: 'DELETE' })
      const { closed, ...summary } = res
      seenHistory.current?.add(closed.id)
      acct.setData(summary)
      toast({ type: closed.realized_pnl >= 0 ? 'success' : 'info', title: `Closed ${p.symbol}`, message: `Realised ${signedUsd(closed.realized_pnl)} · balance ${usd(summary.account.balance)}` })
    } catch (err) {
      toast({ type: 'error', title: 'Couldn’t close position', message: err.message })
      acct.reload(true)
    } finally {
      setBusy(null)
    }
  }

  const reset = async () => {
    setBusy('reset')
    try {
      acct.setData(await api('/positions/reset', { method: 'POST' }))
      seenHistory.current = new Set()
      setConfirmReset(false)
      toast({ title: 'Account reset', message: 'Your $10,000 virtual balance is restored.' })
    } catch (err) {
      toast({ type: 'error', title: 'Reset failed', message: err.message })
    } finally {
      setBusy(null)
    }
  }

  const stats = account && [
    { label: 'Balance', value: usd(account.balance), icon: Wallet },
    { label: 'Equity', value: usd(account.equity) },
    { label: 'Open P&L', value: signedUsd(account.floating_pnl), color: account.floating_pnl >= 0 ? 'text-up' : 'text-down' },
    { label: 'Free margin', value: usd(account.free_margin), sub: `Used ${usd(account.used_margin)} · 1:${account.leverage}` },
  ]

  return (
    <Page className="space-y-6">
      <PageHeader
        eyebrow="Practice mode"
        title={<span className="flex flex-wrap items-center gap-3">Trading Simulator <SimulatedBadge /></span>}
        subtitle="Practise with $10,000 of virtual funds. Prices follow the real market (refreshed every minute) and are filled by our server. Build habits here before you ever risk real money."
        actions={<button onClick={() => setConfirmReset(true)} className="btn btn-ghost"><RotateCcw className="h-4 w-4" /> Reset demo account</button>}
      />

      <div>
        <div className="mb-2 flex justify-end"><PracticeLabel /></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats ? stats.map((s) => (
            <Card key={s.label} className="p-4 sm:p-5">
              <div className="text-xs text-muted">{s.label}</div>
              <div className={`num mt-1 text-lg font-semibold sm:text-2xl ${s.color || ''}`}>{s.value}</div>
              {s.sub && <div className="num mt-0.5 text-[0.7rem] text-muted">{s.sub}</div>}
            </Card>
          )) : [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 !rounded-3xl" />)}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {market.ready ? market.list.map((i) => {
          const c = changePct(i)
          const active = i.symbol === symbol
          return (
            <button key={i.symbol} onClick={() => setSymbol(i.symbol)} className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition ${active ? 'border-emerald-500/50 bg-emerald-500/10 shadow-glow' : 'border-line bg-soft hover:border-emerald-500/30'}`}>
              <div className="text-xs font-semibold">{i.symbol}</div>
              <div className="flex items-center gap-2">
                <span className="num text-sm">{fmtPrice(i, i.price)}</span>
                <span className={`num text-[0.7rem] ${c >= 0 ? 'text-up' : 'text-down'}`}>{c >= 0 ? '+' : ''}{c.toFixed(2)}%</span>
              </div>
            </button>
          )
        }) : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-32 shrink-0 !rounded-2xl" />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15"><CandlestickChart className="h-5 w-5 text-emerald-400" /></div>
              <div>
                <div className="font-semibold">{symbol} {q && <span className="text-xs font-normal text-muted">· {q.name}</span>}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${q?.market_open === false ? 'bg-amber-400' : 'pulse-dot bg-emerald-400'}`} />
                  15-second candles · {feedLabel(q)}
                </div>
              </div>
            </div>
            {q && (
              <div className="flex items-baseline gap-3">
                <span className="num text-2xl font-semibold">{fmtPrice(q, q.price)}</span>
                <span className={`num flex items-center gap-1 text-sm ${chg >= 0 ? 'text-up' : 'text-down'}`}>{chg >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
              </div>
            )}
          </div>
          <div className="p-2 sm:p-3">
            <CandleChart symbol={symbol} decimals={q?.decimals ?? 2} dark={state.theme === 'dark'} positions={positions} height={420} />
          </div>
        </Card>

        {/* order ticket */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Order ticket</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => place('sell')} disabled={!q || !!busy} className="btn btn-sell flex-col !gap-0 !py-3">
              <span className="text-xs font-medium opacity-80">{busy === 'sell' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'SELL'}</span>
              <span className="num text-base">{q ? fmtPrice(q, q.bid) : '—'}</span>
            </button>
            <button onClick={() => place('buy')} disabled={!q || !!busy} className="btn btn-buy flex-col !gap-0 !py-3">
              <span className="text-xs font-medium opacity-80">{busy === 'buy' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'BUY'}</span>
              <span className="num text-base">{q ? fmtPrice(q, q.ask) : '—'}</span>
            </button>
          </div>
          {q && <div className="num mt-2 text-center text-[0.7rem] text-muted">Spread {q.spread_pips.toFixed(1)} pips · filled at the server’s price</div>}

          <div className="mt-5 space-y-4">
            <NumberField label="Lot size" value={lots} onChange={setLots} step={0.01} min={0.01} hint={q ? `${usd(pipVal)} per pip · margin ≈ ${usd(reqMargin)}` : ''} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Stop-loss" value={slPips} onChange={setSlPips} suffix="pips" hint={sl ? `Risk ≈ ${usd(sl * pipVal)}` : 'Not set'} />
              <NumberField label="Take-profit" value={tpPips} onChange={setTpPips} suffix="pips" hint={tp ? `Target ≈ ${usd(tp * pipVal)}` : 'Not set'} />
            </div>
            {sl > 0 && tp > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-soft px-3 py-2 text-xs">
                <span className="text-muted">Risk : reward</span>
                <span className={`num font-semibold ${tp / sl >= 1.5 ? 'text-up' : 'text-amber-400'}`}>1 : {(tp / sl).toFixed(1)}</span>
              </div>
            )}
            {!sl && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">No stop-loss. In real markets that’s how accounts get wiped out.</p>}
          </div>
        </Card>
      </div>

      {/* positions */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="text-lg font-semibold">Open positions <span className="num ml-1 text-sm font-normal text-muted">({positions.length})</span></h2>
          {account && <span className={`num text-sm font-semibold ${account.floating_pnl >= 0 ? 'text-up' : 'text-down'}`}>{signedUsd(account.floating_pnl)}</span>}
        </div>
        {!data ? (
          <div className="p-5"><RowsSkeleton rows={2} /></div>
        ) : positions.length === 0 ? (
          <div className="p-5"><EmptyState icon={CandlestickChart} title="No open trades yet" message="Try a practice trade on XAU/USD! Always start with a stop-loss." action={<button onClick={() => setSymbol('XAU/USD')} className="btn btn-primary">Trade XAU/USD</button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  {['Instrument', 'Side', 'Lots', 'Entry', 'Current', 'SL', 'TP', 'P&L', ''].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {positions.map((p) => {
                    const f = { decimals: p.decimals }
                    return (
                      <motion.tr key={p.id} initial={{ opacity: 0, backgroundColor: 'rgba(16,185,129,0.15)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }} exit={{ opacity: 0 }} className="border-b border-line last:border-0">
                        <td className="px-5 py-3 font-semibold">{p.symbol}</td>
                        <td className="px-5 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-bold ${p.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>{p.side.toUpperCase()}</span></td>
                        <td className="num px-5 py-3">{p.lot_size.toFixed(2)}</td>
                        <td className="num px-5 py-3">{fmtPrice(f, p.entry_price)}</td>
                        <td className="num px-5 py-3">{fmtPrice(f, p.current_price)}</td>
                        <td className="num px-5 py-3 text-muted">{p.stop_loss ? fmtPrice(f, p.stop_loss) : '—'}</td>
                        <td className="num px-5 py-3 text-muted">{p.take_profit ? fmtPrice(f, p.take_profit) : '—'}</td>
                        <td className={`num px-5 py-3 font-semibold ${p.floating_pnl >= 0 ? 'text-up' : 'text-down'}`}>{signedUsd(p.floating_pnl)}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => close(p)} disabled={busy === p.id} className="btn btn-ghost btn-sm">{busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Close</button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <RiskCalculator balance={account?.balance ?? 10000} symbol={symbol} onApply={(s, l, stop) => { setSymbol(s); setLots(l.toFixed(2)); setSlPips(String(stop)); toast({ type: 'info', title: 'Order ticket updated', message: `${l.toFixed(2)} lots on ${s} with a ${stop}-pip stop.` }) }} />
        <Card className="p-6">
          <div className="flex items-center gap-2"><History className="h-5 w-5 text-emerald-400" /><h2 className="text-lg font-semibold">Trade history</h2></div>
          {!data ? (
            <div className="mt-4"><RowsSkeleton rows={3} /></div>
          ) : history.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-soft p-6 text-center text-sm text-muted">No closed trades yet. Closed trades will appear here so you can review what worked and what didn’t.</p>
          ) : (
            <div className="mt-4 max-h-80 overflow-auto pr-1">
              <table className="w-full min-w-[460px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted">
                  <tr className="border-b border-line">{['Instrument', 'Side', 'Entry → Exit', 'Closed', 'P&L'].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {history.map((t) => {
                    const f = { decimals: market.bySymbol[t.symbol]?.decimals ?? 2 }
                    return (
                      <tr key={t.id} className="border-b border-line last:border-0">
                        <td className="px-2 py-2.5 font-semibold">{t.symbol}</td>
                        <td className={`px-2 py-2.5 text-xs font-semibold ${t.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.side.toUpperCase()} {t.lot_size.toFixed(2)}</td>
                        <td className="num px-2 py-2.5 text-xs">{fmtPrice(f, t.entry_price)} → {fmtPrice(f, t.close_price)}</td>
                        <td className="px-2 py-2.5 text-xs text-muted">{t.close_reason} · {new Date(t.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className={`num px-2 py-2.5 text-right font-semibold ${t.realized_pnl >= 0 ? 'text-up' : 'text-down'}`}>{signedUsd(t.realized_pnl)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Disclaimer />

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo account?">
        <p className="text-sm text-muted">This removes all open positions and trade history and restores your $10,000 virtual balance. Practice mode only, so no real money is involved.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={busy === 'reset'} onClick={reset}>{busy === 'reset' && <Loader2 className="h-4 w-4 animate-spin" />} Reset account</button>
        </div>
      </Modal>
    </Page>
  )
}
