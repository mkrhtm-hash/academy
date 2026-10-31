// Small shared UI primitives
import { motion } from 'framer-motion'
import {
  Award, BookOpen, CandlestickChart, FlaskConical, Flame, GraduationCap, Inbox, Shield, ShieldAlert, Star, Trophy,
} from 'lucide-react'

const Icons = { Award, BookOpen, CandlestickChart, FlaskConical, Flame, GraduationCap, Inbox, Shield, ShieldAlert, Trophy }

export function Page({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{eyebrow}</div>}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '', hover = false, ...rest }) {
  return <div className={`glass rounded-3xl ${hover ? 'card-hover' : ''} ${className}`} {...rest}>{children}</div>
}

export function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Stars({ value, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-gold text-gold' : 'text-muted/40'} />
      ))}
    </span>
  )
}

export function LevelBadge({ level }) {
  const map = {
    Beginner: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    Intermediate: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
    Advanced: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  }
  return <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ring-1 ${map[level]}`}>{level}</span>
}

export function Avatar({ initials, hue = ['#10b981', '#f2c14e'], size = 40, ring = false }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${ring ? 'ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-canvas' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, ${hue[0]}, ${hue[1]})` }}
    >
      {initials}
    </span>
  )
}

export function DynamicIcon({ name, ...props }) {
  const Icon = Icons[name] || Icons.Award
  return <Icon {...props} />
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <Skeleton className="h-40 !rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-2"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-16" /></div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon = Icons.Inbox, title, message, action }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-400/10 p-4 ring-1 ring-emerald-500/20">
        <Icon className="h-8 w-8 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SimulatedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-400/30">
      <Icons.FlaskConical className="h-3.5 w-3.5" /> Simulated – no real money
    </span>
  )
}

/** Shown wherever a balance appears: this is a practice platform with virtual funds only. */
export function PracticeLabel({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-400 ring-1 ring-amber-400/25 ${className}`}>
      <Icons.FlaskConical className="h-3 w-3" /> Practice mode · virtual funds
    </span>
  )
}

/** Friendly error card with a retry button (used when an API call fails). */
export function ErrorState({ error, onRetry, title }) {
  const offline = error?.code === 'DB_UNAVAILABLE' || error?.code === 'NETWORK'
  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-rose-500/15 p-4 ring-1 ring-rose-500/25">
        <Icons.ShieldAlert className="h-8 w-8 text-rose-400" />
      </div>
      <h3 className="text-lg font-semibold">{title || (offline ? 'We can’t reach the database' : 'Something went wrong')}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{error?.message || 'Please try again.'}</p>
      {onRetry && <button onClick={() => onRetry()} className="btn btn-primary mt-5">Try again</button>}
    </div>
  )
}

export function RowsSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-14" />)}
    </div>
  )
}

export const RISK_DISCLAIMER =
  'Trading leveraged products such as Forex and CFDs carries a high level of risk and may not be suitable for all investors. Content is for educational purposes only and is not investment advice.'

export function Disclaimer({ className = '' }) {
  return (
    <div className={`flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-xs leading-relaxed text-muted ${className}`}>
      <Icons.ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
      <p><span className="font-semibold text-ink">Risk warning: </span>{RISK_DISCLAIMER}</p>
    </div>
  )
}
