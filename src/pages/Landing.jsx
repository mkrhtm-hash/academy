import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, ArrowRight, Award, BookOpen, Calendar, CandlestickChart, ChevronLeft, ChevronRight, Flame, GraduationCap, PlayCircle, Quote, Shield, Sparkles, TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseCard from '../components/CourseCard.jsx'
import InsightCard from '../components/InsightCard.jsx'
import { Footer, MarketingNav } from '../components/Layout.jsx'
import MarketBackground from '../components/MarketBackground.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import StatCounter from '../components/StatCounter.jsx'
import TickerTape from '../components/TickerTape.jsx'
import { Avatar, CardSkeleton, ErrorState, Reveal, Skeleton, Stars } from '../components/ui.jsx'
import { instructorList, partners, testimonials } from '../data/content.js'
import { api, useApi } from '../lib/api.js'
import { changePct, fmtPrice, useMarket } from '../lib/market.js'

// Hero card: server candle history for XAU/USD, with the latest server price folded into the last candle.
function useGoldCandles() {
  const market = useMarket()
  const [candles, setCandles] = useState([])
  useEffect(() => {
    api(`/prices?candles=${encodeURIComponent('XAU/USD')}`).then((r) => setCandles(r.candles.slice(-28))).catch(() => {})
  }, [])
  const gold = market.bySymbol['XAU/USD']
  if (!gold || !candles.length) return { gold, candles }
  const last = candles.at(-1)
  const live = { ...last, close: gold.price, high: Math.max(last.high, gold.price), low: Math.min(last.low, gold.price) }
  return { gold, candles: [...candles.slice(0, -1), live] }
}

function HeroPreview() {
  const { gold, candles } = useGoldCandles()
  const min = Math.min(...candles.map((c) => c.low))
  const max = Math.max(...candles.map((c) => c.high))
  const y = (v) => 110 - ((v - min) / (max - min || 1)) * 100
  const chg = changePct(gold)

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <motion.div initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.9, delay: 0.3 }} className="glass relative rounded-3xl p-5 shadow-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold"><CandlestickChart className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-semibold">XAU/USD</div>
              <div className="text-xs text-muted">Practice mode · 15s</div>
            </div>
          </div>
          <div className="text-right">
            {gold ? (
              <>
                <div className="num text-lg font-semibold">{fmtPrice(gold, gold.price)}</div>
                <div className={`num text-xs ${chg >= 0 ? 'text-up' : 'text-down'}`}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</div>
              </>
            ) : <><Skeleton className="h-6 w-24" /><Skeleton className="ml-auto mt-1 h-3 w-12" /></>}
          </div>
        </div>
        {!candles.length && <Skeleton className="mt-4 h-40 w-full" />}
        <svg viewBox="0 0 290 120" className={`mt-4 h-40 w-full ${candles.length ? '' : 'hidden'}`}>
          {candles.map((c, i) => {
            const up = c.close >= c.open
            const x = 4 + i * 10.3
            const col = up ? 'var(--up)' : 'var(--down)'
            return (
              <g key={c.time}>
                <line x1={x + 3} x2={x + 3} y1={y(c.high)} y2={y(c.low)} stroke={col} strokeWidth="1" />
                <rect x={x} y={y(Math.max(c.open, c.close))} width="6" height={Math.max(1.5, Math.abs(y(c.open) - y(c.close)))} rx="1" fill={col} />
              </g>
            )
          })}
        </svg>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-500/90 py-2.5 text-center text-sm font-semibold text-emerald-950">Buy</div>
          <div className="rounded-xl bg-rose-500/90 py-2.5 text-center text-sm font-semibold text-white">Sell</div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.7 }} className="glass animate-float absolute -bottom-20 -left-4 flex items-center gap-3 rounded-2xl !bg-panel-solid/90 p-3 pr-5 sm:-left-10">
        <ProgressRing value={72} size={56} stroke={6}><span className="num text-xs font-semibold">72%</span></ProgressRing>
        <div>
          <div className="text-xs text-muted">Price Action Mastery</div>
          <div className="text-sm font-semibold">Module 3 of 4</div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }} className="glass absolute -right-2 -top-14 flex items-center gap-2 rounded-2xl !bg-panel-solid/90 px-4 py-3 sm:-right-8" style={{ animation: 'float 7s ease-in-out infinite 1s' }}>
        <Flame className="animate-flicker h-6 w-6 text-orange-400" />
        <div>
          <div className="num text-sm font-semibold">12-day streak</div>
          <div className="text-[0.7rem] text-muted">Keep it going!</div>
        </div>
      </motion.div>
    </div>
  )
}

function Testimonials() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % testimonials.length), 6000)
    return () => clearInterval(t)
  }, [i])
  const t = testimonials[i]
  return (
    <div className="glass relative overflow-hidden rounded-[2rem] p-8 md:p-12">
      <Quote className="absolute right-8 top-8 h-24 w-24 text-emerald-500/10" />
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
          <Stars value={t.rating} size={18} />
          <p className="mt-5 max-w-3xl font-display text-xl font-medium leading-relaxed md:text-2xl">“{t.text}”</p>
          <div className="mt-8 flex items-center gap-3">
            <Avatar initials={t.initials} size={48} hue={['#10b981', '#f2c14e']} />
            <div>
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-muted">{t.role}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-2">
          {testimonials.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Testimonial ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? 'w-8 bg-brand' : 'w-2 bg-muted/30'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setI((i - 1 + testimonials.length) % testimonials.length)} className="btn btn-ghost !h-10 !w-10 !p-0" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => setI((i + 1) % testimonials.length)} className="btn btn-ghost !h-10 !w-10 !p-0" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  )
}

const features = [
  { icon: BookOpen, title: 'Structured courses', text: 'Eight expert-built paths across forex, gold, indices, crypto, risk and psychology.', to: '/courses', span: 'md:col-span-2' },
  { icon: CandlestickChart, title: 'Risk-free simulator', text: 'Practise with $10,000 of virtual funds and live-style prices.', to: '/simulator' },
  { icon: Calendar, title: 'Live sessions', text: 'Weekly briefings, live charting and mentor Q&A.', to: '/live' },
  { icon: Activity, title: 'Progress that motivates', text: 'Streaks, progress rings and weekly activity insights.', to: '/dashboard' },
  { icon: Award, title: 'Certificates & badges', text: 'Earn shareable certificates as you complete each course.', to: '/achievements' },
  { icon: Shield, title: 'Risk-first by design', text: 'Calculators, a glossary and an economic calendar keep risk front and centre.', to: '/tools', span: 'md:col-span-2' },
]

export default function Landing() {
  const { data: courseData, loading: coursesLoading, error: coursesError, reload: reloadCourses } = useApi('/courses')
  const { data: stats } = useApi('/stats')
  const courses = courseData?.courses || []
  const top = [...courses].sort((a, b) => b.students - a.students || b.is_free - a.is_free).slice(0, 3)
  const firstFree = courses.find((c) => c.is_free)?.slug || 'forex-foundations'
  const freeLesson = `/learn/${firstFree}/start`
  const heroStats = [
    { label: 'Students enrolled', value: stats?.students ?? 0 },
    { label: 'Lessons completed', value: stats?.lessons_completed ?? 0 },
    { label: 'Live sessions this week', value: stats?.sessions_this_week ?? 0 },
    { label: 'Certificates issued', value: stats?.certificates_issued ?? 0 },
  ]
  return (
    <div className="overflow-x-hidden">
      <MarketingNav />

      {/* HERO */}
      <section className="relative isolate pt-16">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="grid-bg absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <MarketBackground />
          <div className="absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
          <div className="absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-gold/15 blur-[100px]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-32">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" /> New: Trading Simulator 2.0 with risk calculator
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }} className="mt-6 text-[2.6rem] font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              <span className="mb-4 block font-sans text-sm font-semibold uppercase tracking-[0.3em] text-muted">VaultEdge Academy</span>
              Master the markets.<br />
              <span className="text-gradient">Trade with confidence.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }} className="mt-6 max-w-xl text-lg text-muted">
              Structured courses from real market professionals, a risk-free trading simulator, live mentor sessions and certificates that prove your progress.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/courses" className="btn btn-primary !px-6 !py-3.5 !text-base">Explore Courses <ArrowRight className="h-4 w-4" /></Link>
              <Link to={freeLesson} className="btn btn-ghost !px-6 !py-3.5 !text-base"><PlayCircle className="h-5 w-5 text-emerald-400" /> Start Free Lesson</Link>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {instructorList.slice(0, 5).map((ins) => <span key={ins.name} className="rounded-full ring-2 ring-canvas"><Avatar initials={ins.initials} hue={ins.hue} size={36} /></span>)}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1.5"><Stars value={5} size={13} /><span className="font-semibold">Expert mentors</span></div>
                <div className="text-muted">{stats ? `Join ${stats.students.toLocaleString()} ${stats.students === 1 ? 'student' : 'students'} practising risk-free` : 'Practise risk-free with virtual funds'}</div>
              </div>
            </motion.div>
          </div>
          <div className="px-4 pb-8 sm:px-10"><HeroPreview /></div>
        </div>
      </section>

      <TickerTape />

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {heroStats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="glass card-hover rounded-3xl p-6">
                <div className="text-3xl font-semibold md:text-4xl">{stats ? <StatCounter value={s.value} compact={s.value >= 100000} className="text-gradient" /> : <Skeleton className="h-10 w-24" />}</div>
                <div className="mt-2 text-sm text-muted">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-16">
          <div className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted">As featured in</div>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
            <div className="animate-marquee flex w-max gap-14">
              {[...partners, ...partners].map((p, i) => (
                <span key={i} className="flex items-center gap-2 font-display text-xl font-bold text-muted/70 grayscale transition hover:text-ink">
                  <TrendingUp className="h-5 w-5" />{p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Everything in one place</div>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">Learn it. Practise it. <span className="text-gradient">Own it.</span></h2>
          <p className="mt-4 text-muted">A complete learning loop built around discipline and risk management, so you build skill instead of collecting tips.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06} className={f.span || 'md:col-span-1'}>
              <Link to={f.to} className="glass card-hover group relative flex h-full flex-col overflow-hidden rounded-3xl p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition group-hover:bg-gold/20" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-gold/15 ring-1 ring-emerald-500/30">
                  <f.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="relative mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="relative mt-1.5 text-sm text-muted">{f.text}</p>
                <span className="relative mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-emerald-400 opacity-0 transition group-hover:opacity-100">Explore <ArrowRight className="h-4 w-4" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COURSES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Most popular</div>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Start with the students’ favourites</h2>
          </Reveal>
          <Link to="/courses" className="btn btn-ghost self-start sm:self-auto">View all courses <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {coursesError ? <div className="mt-10"><ErrorState error={coursesError} onRetry={reloadCourses} /></div> : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coursesLoading ? [0, 1, 2].map((i) => <CardSkeleton key={i} />) : top.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
        )}
      </section>

      {/* TESTIMONIALS + INSIGHT */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal className="mb-10 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Student stories</div>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Confidence, earned one lesson at a time</h2>
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <Reveal><Testimonials /></Reveal>
          <Reveal delay={0.1}><InsightCard className="h-full" /></Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/30 p-10 text-center md:p-16">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600/30 via-canvas-2 to-gold/20" />
            <div className="grid-bg absolute inset-0 -z-10 opacity-40" />
            <GraduationCap className="mx-auto h-12 w-12 text-gold" />
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold md:text-5xl">Your first certificate is closer than you think.</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">Start free with Forex Foundations and Risk Management Essentials. No credit card, no hype, just a better way to learn.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={freeLesson} className="btn btn-primary !px-6 !py-3.5">Start Free Lesson <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/pricing" className="btn btn-ghost !px-6 !py-3.5">See plans</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  )
}
