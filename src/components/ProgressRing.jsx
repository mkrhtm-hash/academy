import { motion } from 'framer-motion'
import { useId } from 'react'

export default function ProgressRing({ value = 0, size = 120, stroke = 10, label, sublabel, children, colors = ['#10b981', '#f2c14e'] }) {
  const id = useId()
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={colors[0]} />
              <stop offset="1" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--soft)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c - (pct / 100) * c }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${colors[0]}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children ?? <span className="num text-2xl font-semibold">{Math.round(pct)}%</span>}
        </div>
      </div>
      {label && <div className="mt-3 text-sm font-semibold">{label}</div>}
      {sublabel && <div className="text-xs text-muted">{sublabel}</div>}
    </div>
  )
}
