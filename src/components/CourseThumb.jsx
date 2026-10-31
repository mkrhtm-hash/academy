import { useMemo } from 'react'
import { seeded } from '../data/content.js'

// Generative course artwork: gradient field + seeded candlestick silhouette (colours from courses.thumbnail)
export default function CourseThumb({ course, className = 'h-40' }) {
  const key = String(course.slug || course.id)
  const candles = useMemo(() => {
    const rnd = seeded(key + 'thumb')
    let p = 50
    return Array.from({ length: 18 }, (_, i) => {
      const o = p
      p += (rnd() - 0.42) * 14
      p = Math.max(15, Math.min(85, p))
      const hi = Math.max(o, p) + rnd() * 8
      const lo = Math.min(o, p) - rnd() * 8
      return { x: 6 + i * 11, o, c: p, hi, lo }
    })
  }, [key])

  const [a, b] = course.hue || ['#10b981', '#f2c14e']
  const y = (v) => 100 - v
  const path = candles.map((k, i) => `${i ? 'L' : 'M'}${k.x + 3},${y(k.c)}`).join(' ')

  return (
    <div className={`${className.includes('absolute') ? '' : 'relative'} overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${a}33, ${b}22), var(--base-2)` }}>
      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full blur-3xl" style={{ background: `${b}55` }} />
      <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full blur-3xl" style={{ background: `${a}55` }} />
      <div className="grid-bg absolute inset-0 opacity-40" />
      <svg viewBox="0 0 206 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`area-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={a} stopOpacity="0.35" />
            <stop offset="1" stopColor={a} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L${candles.at(-1).x + 3},100 L9,100 Z`} fill={`url(#area-${key})`} />
        {candles.map((k, i) => {
          const up = k.c >= k.o
          const col = up ? a : b
          return (
            <g key={i} opacity="0.9">
              <line x1={k.x + 3} x2={k.x + 3} y1={y(k.hi)} y2={y(k.lo)} stroke={col} strokeWidth="1" />
              <rect x={k.x} y={y(Math.max(k.o, k.c))} width="6" height={Math.max(1.5, Math.abs(k.c - k.o))} rx="1" fill={col} />
            </g>
          )
        })}
        <path d={path} fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="0.8" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  )
}
