import { TrendingDown, TrendingUp } from 'lucide-react'
import { changePct, fmtPrice, useMarket } from '../lib/market.js'
import { Skeleton } from './ui.jsx'

export default function TickerTape({ className = '' }) {
  const market = useMarket()
  const items = market.list.map((q) => ({ q, chg: changePct(q), dir: q.price > q.prev ? 'up' : q.price < q.prev ? 'down' : '' }))
  const row = [...items, ...items]

  return (
    <div className={`relative overflow-hidden border-y border-line bg-panel/60 backdrop-blur ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />
      {!market.ready ? (
        <div className="flex gap-6 px-6 py-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-5 w-40 shrink-0" />)}</div>
      ) : (
        <div className="animate-ticker flex w-max">
          {row.map(({ q, chg, dir }, i) => {
            const up = chg >= 0
            return (
              <div key={i} className="flex items-center gap-3 border-r border-line px-6 py-3">
                <span className="text-xs font-semibold tracking-wide text-muted">{q.symbol}</span>
                <span key={q.price} className={`num text-sm font-semibold ${dir === 'up' ? 'flash-up' : dir === 'down' ? 'flash-down' : ''}`}>{fmtPrice(q, q.price)}</span>
                <span className={`num flex items-center gap-1 text-xs font-medium ${up ? 'text-up' : 'text-down'}`}>
                  {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {up ? '+' : ''}{chg.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
