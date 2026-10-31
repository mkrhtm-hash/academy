import { CandlestickSeries, ColorType, CrosshairMode, LineStyle, createChart } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { api } from '../lib/api.js'
import { getQuote, subscribeMarket } from '../lib/market.js'

const palette = (dark) => ({
  text: dark ? '#8a97ab' : '#5a6779',
  grid: dark ? 'rgba(148,163,184,0.07)' : 'rgba(15,23,42,0.06)',
  border: dark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)',
  up: dark ? '#34d399' : '#059669',
  down: dark ? '#fb7185' : '#e11d48',
})

// History comes from the server's recorded ticks; new server prices are folded into the latest candle.
export default function CandleChart({ symbol, decimals = 2, dark = true, positions = [], height = 420 }) {
  const box = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const linesRef = useRef([])

  // create chart once
  useEffect(() => {
    const p = palette(dark)
    const chart = createChart(box.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: p.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
      grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
      rightPriceScale: { borderColor: p.border, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderColor: p.border, timeVisible: true, secondsVisible: true, rightOffset: 6, barSpacing: 9 },
      crosshair: { mode: CrosshairMode.Normal },
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: p.up, downColor: p.down, borderUpColor: p.up, borderDownColor: p.down, wickUpColor: p.up, wickDownColor: p.down,
    })
    chartRef.current = chart
    seriesRef.current = series
    return () => { chart.remove(); chartRef.current = null; seriesRef.current = null; linesRef.current = [] }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // theme updates
  useEffect(() => {
    const p = palette(dark)
    chartRef.current?.applyOptions({
      layout: { textColor: p.text },
      grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
      rightPriceScale: { borderColor: p.border },
      timeScale: { borderColor: p.border },
    })
    seriesRef.current?.applyOptions({ upColor: p.up, downColor: p.down, borderUpColor: p.up, borderDownColor: p.down, wickUpColor: p.up, wickDownColor: p.down })
  }, [dark])

  // history + live updates for the selected symbol
  useEffect(() => {
    const series = seriesRef.current
    let cancelled = false
    let last = null
    let bucketSecs = 15
    series.setData([])
    series.applyOptions({ priceFormat: { type: 'price', precision: decimals, minMove: 1 / 10 ** decimals } })

    api(`/prices?candles=${encodeURIComponent(symbol)}`).then((res) => {
      if (cancelled || !seriesRef.current) return
      bucketSecs = res.candle_seconds || 15
      series.setData(res.candles)
      last = res.candles.at(-1) ? { ...res.candles.at(-1) } : null
      chartRef.current.timeScale().scrollToRealTime()
    }).catch(() => { /* the page shows its own error state */ })

    const unsub = subscribeMarket(() => {
      const q = getQuote(symbol)
      if (!q || !last) return
      const t = Math.floor(Date.parse(q.updated_at) / 1000 / bucketSecs) * bucketSecs
      if (!Number.isFinite(t) || t < last.time) return
      last = t > last.time
        ? { time: t, open: last.close, high: Math.max(last.close, q.price), low: Math.min(last.close, q.price), close: q.price }
        : { ...last, high: Math.max(last.high, q.price), low: Math.min(last.low, q.price), close: q.price }
      try { series.update({ ...last }) } catch { /* ignore out-of-order */ }
    })
    return () => { cancelled = true; unsub() }
  }, [symbol, decimals])

  // price lines for open positions
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return
    linesRef.current.forEach((l) => series.removePriceLine(l))
    linesRef.current = []
    positions.filter((t) => t.symbol === symbol).forEach((t) => {
      linesRef.current.push(series.createPriceLine({ price: t.entry_price, color: t.side === 'buy' ? '#10b981' : '#f43f5e', lineWidth: 1, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: `${t.side.toUpperCase()} ${t.lot_size}` }))
      if (t.stop_loss) linesRef.current.push(series.createPriceLine({ price: t.stop_loss, color: '#fb7185', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'SL' }))
      if (t.take_profit) linesRef.current.push(series.createPriceLine({ price: t.take_profit, color: '#f2c14e', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'TP' }))
    })
  }, [positions, symbol])

  return <div ref={box} style={{ height }} className="w-full" />
}
