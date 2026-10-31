import { useEffect, useRef } from 'react'

// Animated, low-opacity candlestick field that drifts slowly to the left.
export default function MarketBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w, h, dpr, raf
    let candles = []
    let offset = 0
    const W = 14, GAP = 8

    const gen = (prev) => {
      const o = prev
      const c = Math.max(0.15, Math.min(0.85, o + (Math.random() - 0.46) * 0.08))
      return { o, c, hi: Math.max(o, c) + Math.random() * 0.04, lo: Math.min(o, c) - Math.random() * 0.04 }
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const need = Math.ceil(w / (W + GAP)) + 4
      let last = candles.length ? candles[candles.length - 1].c : 0.5
      while (candles.length < need) { const k = gen(last); candles.push(k); last = k.c }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const dark = document.documentElement.classList.contains('dark')
      const upCol = dark ? 'rgba(52,211,153,' : 'rgba(5,150,105,'
      const dnCol = dark ? 'rgba(242,193,78,' : 'rgba(201,149,42,'
      const narrow = w < 1024
      const y = (v) => h * (narrow ? 0.55 : 0.42) + (1 - v) * h * (narrow ? 0.4 : 0.5)

      // trend line
      ctx.beginPath()
      candles.forEach((k, i) => {
        const x = i * (W + GAP) - offset + W / 2
        i ? ctx.lineTo(x, y(k.c)) : ctx.moveTo(x, y(k.c))
      })
      const grad = ctx.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, 'rgba(16,185,129,0)')
      grad.addColorStop(0.5, 'rgba(16,185,129,0.35)')
      grad.addColorStop(1, 'rgba(242,193,78,0.5)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.stroke()

      candles.forEach((k, i) => {
        const x = i * (W + GAP) - offset
        const fade = Math.min(1, Math.max(0, (x - w * 0.2) / (w * 0.4))) // fade out behind the headline
        const a = (0.04 + 0.24 * fade).toFixed(3)
        const up = k.c >= k.o
        const col = (up ? upCol : dnCol) + a + ')'
        ctx.strokeStyle = col
        ctx.fillStyle = col
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x + W / 2, y(k.hi))
        ctx.lineTo(x + W / 2, y(k.lo))
        ctx.stroke()
        const top = y(Math.max(k.o, k.c))
        ctx.beginPath()
        ctx.roundRect(x, top, W, Math.max(2, Math.abs(y(k.o) - y(k.c))), 3)
        ctx.fill()
      })
    }

    const loop = () => {
      offset += 0.35
      if (offset >= W + GAP) {
        offset -= W + GAP
        candles.shift()
        candles.push(gen(candles[candles.length - 1].c))
      }
      draw()
      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    reduce ? draw() : loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
