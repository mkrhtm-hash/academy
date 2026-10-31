import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Lightbulb } from 'lucide-react'
import { useEffect, useState } from 'react'
import { insights } from '../data/content.js'

export default function InsightCard({ className = '' }) {
  const start = Math.floor(Date.now() / 86400000) % insights.length // tip of the day
  const [i, setI] = useState(start)

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % insights.length), 9000)
    return () => clearInterval(t)
  }, [])

  const tip = insights[i]
  return (
    <div className={`glass relative overflow-hidden rounded-3xl p-6 ${className}`}>
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          <Lightbulb className="h-4 w-4" /> Market insight of the day
        </div>
        <button onClick={() => setI((x) => (x + 1) % insights.length)} className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink" aria-label="Next insight">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="relative mt-4 min-h-[88px]">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-400">{tip.tag}</span>
            <p className="mt-3 font-display text-lg font-medium leading-snug">“{tip.text}”</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="relative mt-4 flex gap-1.5">
        {insights.map((_, k) => (
          <span key={k} className={`h-1 rounded-full transition-all duration-500 ${k === i ? 'w-6 bg-brand' : 'w-1.5 bg-soft'}`} />
        ))}
      </div>
    </div>
  )
}
