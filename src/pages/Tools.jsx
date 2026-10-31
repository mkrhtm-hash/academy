import { AnimatePresence, motion } from 'framer-motion'
import { BookMarked, Calculator, CalendarDays, Search, SearchX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import InsightCard from '../components/InsightCard.jsx'
import RiskCalculator from '../components/RiskCalculator.jsx'
import { Card, Disclaimer, EmptyState, ErrorState, Page, PageHeader, Skeleton } from '../components/ui.jsx'
import { economicEvents, glossary } from '../data/content.js'
import { fmtPrice, marginUsd, pipValueUsd, useMarket } from '../lib/market.js'
import { usd } from '../lib/utils.js'

const impactStyle = {
  high: { cls: 'bg-rose-500/15 text-rose-400 ring-rose-500/30', bars: 3 },
  medium: { cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/30', bars: 2 },
  low: { cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30', bars: 1 },
}

function Impact({ level }) {
  const s = impactStyle[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold capitalize ring-1 ${s.cls}`}>
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((b) => <span key={b} className={`w-1 rounded-sm ${b <= s.bars ? 'bg-current' : 'bg-current opacity-25'}`} style={{ height: 4 + b * 2 }} />)}
      </span>
      {level}
    </span>
  )
}

function EconomicCalendar() {
  const todayIdx = Math.min(4, Math.max(0, (new Date().getDay() || 7) - 1))
  const [day, setDay] = useState(todayIdx)
  const [impact, setImpact] = useState('all')
  const days = [0, 1, 2, 3, 4].map((d) => economicEvents.find((e) => e.day === d).date)
  const list = economicEvents.filter((e) => e.day === day && (impact === 'all' || e.impact === impact))

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {days.map((d, i) => (
            <button key={i} onClick={() => setDay(i)} className={`shrink-0 rounded-2xl px-4 py-2 text-center transition ${day === i ? 'bg-brand text-emerald-950' : 'bg-soft text-muted hover:text-ink'}`}>
              <div className="text-[0.7rem] font-semibold uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="num text-lg font-semibold leading-tight">{d.getDate()}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-soft p-1">
          {['all', 'high', 'medium', 'low'].map((l) => (
            <button key={l} onClick={() => setImpact(l)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${impact === l ? 'bg-panel-solid text-ink shadow' : 'text-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        {list.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No events match" message="Try a different impact filter or another day." />
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">{['Time', 'Currency', 'Event', 'Impact', 'Actual', 'Forecast', 'Previous'].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="border-b border-line last:border-0 hover:bg-soft">
                  <td className="num px-3 py-3.5 text-muted">{e.time}</td>
                  <td className="px-3 py-3.5"><span className="num rounded-md bg-soft px-2 py-1 text-xs font-semibold ring-1 ring-line">{e.currency}</span></td>
                  <td className="px-3 py-3.5 font-medium">{e.title}</td>
                  <td className="px-3 py-3.5"><Impact level={e.impact} /></td>
                  <td className={`num px-3 py-3.5 font-semibold ${e.actual !== '—' ? 'text-emerald-400' : 'text-muted'}`}>{e.actual}</td>
                  <td className="num px-3 py-3.5 text-muted">{e.forecast}</td>
                  <td className="num px-3 py-3.5 text-muted">{e.previous}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">Times shown are illustrative (GMT). Spreads often widen around high-impact releases.</p>
    </Card>
  )
}

function Glossary() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return glossary.filter((g) => !s || g.term.toLowerCase().includes(s) || g.definition.toLowerCase().includes(s)).sort((a, b) => a.term.localeCompare(b.term))
  }, [q])

  return (
    <Card className="p-5 sm:p-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms: pip, leverage, margin, spread…" className="input !pl-10" aria-label="Search glossary" />
      </div>
      <div className="mt-2 text-xs text-muted"><span className="num">{list.length}</span> terms</div>
      {list.length === 0 ? (
        <div className="mt-4"><EmptyState icon={SearchX} title={`No terms found for “${q}”`} message="Try a shorter keyword like “pip” or “risk”." /></div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <AnimatePresence>
            {list.map((g) => (
              <motion.button layout key={g.term} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(open === g.term ? null : g.term)} className={`rounded-2xl border p-4 text-left transition ${open === g.term ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-line bg-soft hover:border-emerald-500/30'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold">{g.term}</span>
                  <span className="rounded-full bg-panel-solid px-2 py-0.5 text-[0.65rem] font-medium text-muted ring-1 ring-line">{g.group}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{g.definition}</p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  )
}

function Calculators() {
  const market = useMarket()
  const [sym, setSym] = useState('EUR/USD')
  const [lots, setLots] = useState('1')
  const [pips, setPips] = useState('10')
  const [lev, setLev] = useState('30')
  const inst = market.bySymbol[sym]

  if (market.error && !market.ready) return <ErrorState error={market.error} />
  if (!inst) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 !rounded-3xl" /><Skeleton className="h-96 !rounded-3xl" />
      </div>
    )
  }

  const price = inst.price
  const l = parseFloat(lots) || 0
  const pv = pipValueUsd(inst, price, l)
  const margin = marginUsd(inst, price, l, parseFloat(lev) || 1)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2"><RiskCalculator symbol="XAU/USD" /></div>
      <Card className="p-6">
        <h3 className="text-lg font-semibold">Pip value calculator</h3>
        <p className="text-sm text-muted">How much is each pip worth for your trade size?</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="label">Instrument</label>
            <select className="input" value={sym} onChange={(e) => setSym(e.target.value)}>{market.list.map((i) => <option key={i.symbol}>{i.symbol}</option>)}</select>
          </div>
          <div><label className="label">Lots</label><input className="input num" value={lots} onChange={(e) => setLots(e.target.value)} inputMode="decimal" /></div>
          <div><label className="label">Pips moved</label><input className="input num" value={pips} onChange={(e) => setPips(e.target.value)} inputMode="decimal" /></div>
          <div><label className="label">Live price</label><div className="input num !bg-transparent">{fmtPrice(inst, price)}</div></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-transparent p-4 ring-1 ring-emerald-500/20"><div className="text-xs text-muted">Value per pip</div><div className="num text-2xl font-semibold">{usd(pv)}</div></div>
          <div className="rounded-2xl bg-gradient-to-br from-gold/15 to-transparent p-4 ring-1 ring-gold/20"><div className="text-xs text-muted">{pips || 0} pip move</div><div className="num text-2xl font-semibold">{usd(pv * (parseFloat(pips) || 0))}</div></div>
        </div>
        <p className="num mt-3 text-xs text-muted">1 pip = {inst.pip_size} · contract size {inst.contract_size.toLocaleString()}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold">Margin calculator</h3>
        <p className="text-sm text-muted">The deposit needed to open your position.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label">Lots ({sym})</label><input className="input num" value={lots} onChange={(e) => setLots(e.target.value)} inputMode="decimal" /></div>
          <div>
            <label className="label">Leverage</label>
            <select className="input" value={lev} onChange={(e) => setLev(e.target.value)}>{['2', '5', '10', '20', '30', '50', '100'].map((x) => <option key={x} value={x}>1:{x}</option>)}</select>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-soft p-5">
          <div className="text-xs text-muted">Required margin</div>
          <div className="num text-3xl font-semibold text-gradient">{usd(margin)}</div>
          <div className="num mt-2 text-xs text-muted">Notional exposure: {usd(margin * (parseFloat(lev) || 1))}</div>
        </div>
        {parseFloat(lev) > 30 && <p className="mt-3 text-xs text-amber-400">Higher leverage means smaller margin but much larger potential losses relative to your deposit.</p>}
      </Card>
    </div>
  )
}

const TABS = [
  { id: 'calendar', label: 'Economic calendar', icon: CalendarDays },
  { id: 'glossary', label: 'Glossary', icon: BookMarked },
  { id: 'calculators', label: 'Calculators', icon: Calculator },
]

export default function Tools() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState(hash.slice(1) || 'calendar')
  useEffect(() => { if (hash) setTab(hash.slice(1)) }, [hash])
  const select = (id) => { setTab(id); navigate(`/tools#${id}`, { replace: true }) }

  return (
    <Page className="space-y-6">
      <PageHeader eyebrow="Market tools" title="Your trading toolkit" subtitle="Stay ahead of market-moving events, learn the language and do the maths before every trade." />

      <div className="flex gap-1 rounded-2xl border border-line bg-soft p-1 sm:inline-flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => select(id)} className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium sm:flex-none sm:px-5 ${tab === id ? 'text-ink' : 'text-muted hover:text-ink'}`}>
            {tab === id && <motion.span layoutId="tools-tab" className="absolute inset-0 rounded-xl bg-panel-solid shadow ring-1 ring-line" />}
            <Icon className={`relative h-4 w-4 ${tab === id ? 'text-emerald-400' : ''}`} />
            <span className="relative hidden sm:inline">{label}</span>
            <span className="relative sm:hidden">{label.split(' ').at(-1)}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          {tab === 'calendar' && <EconomicCalendar />}
          {tab === 'glossary' && <Glossary />}
          {tab === 'calculators' && <Calculators />}
        </motion.div>
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightCard />
        <Disclaimer className="h-full items-start !p-6 !text-sm" />
      </div>
    </Page>
  )
}
