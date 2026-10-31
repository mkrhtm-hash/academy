import { motion } from 'framer-motion'
import { Calendar, CalendarCheck, CalendarX, Clock, Loader2, Play, Radio, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import CourseThumb from '../components/CourseThumb.jsx'
import Modal from '../components/Modal.jsx'
import { Avatar, Card, EmptyState, ErrorState, Page, PageHeader, Reveal, Skeleton } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { person, recordings } from '../data/content.js'
import { api, useApi } from '../lib/api.js'

function Countdown({ date }) {
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t) }, [])
  const diff = Math.max(0, date - Date.now())
  if (!diff) return <span className="num">Live now</span>
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return <span className="num">{d > 0 ? `${d}d ` : ''}{h}h {m}m</span>
}

function SessionCard({ s, i, onChange }) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const date = new Date(s.start_time)
  const host = person(s.mentor_name)
  const taken = s.capacity - s.seats_left
  const pct = (taken / s.capacity) * 100
  const full = s.seats_left <= 0 && !s.booked
  const started = date <= new Date()

  const onClick = async () => {
    setBusy(true)
    try {
      const { session } = await api(`/sessions/${s.id}/book`, { method: s.booked ? 'DELETE' : 'POST' })
      onChange(session)
      toast(s.booked
        ? { type: 'info', title: 'Booking cancelled', message: `Your seat for ${s.title} has been released.` }
        : { title: 'You’re booked! 🎟️', message: `${s.title} · ${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.` })
    } catch (err) {
      toast({ type: 'error', title: s.booked ? 'Couldn’t cancel' : 'Couldn’t book', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Reveal delay={i * 0.06}>
      <Card hover className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-gold/15 ring-1 ring-emerald-500/25">
              <span className="text-[0.65rem] font-semibold uppercase text-emerald-400">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="num text-lg font-semibold leading-none">{date.getDate()}</span>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">{s.level}</div>
              <h3 className="text-lg font-semibold leading-tight">{s.title}</h3>
            </div>
          </div>
          {s.booked && <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-400"><CalendarCheck className="h-3.5 w-3.5" /> Booked</span>}
        </div>
        <p className="mt-4 text-sm text-muted">{s.topic}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {s.duration_minutes} min</span>
          <span className="flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" />{started ? 'In progress' : <>Starts in <Countdown date={date} /></>}</span>
        </div>
        <div className="mt-5 flex items-center gap-2.5">
          <Avatar initials={host.initials} hue={host.hue} size={32} />
          <div className="text-sm"><div className="font-medium">{host.name}</div><div className="text-xs text-muted">{host.role}</div></div>
        </div>
        <div className="mt-auto pt-6">
          <div className="mb-2 flex justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted"><Users className="h-3.5 w-3.5" /> {s.capacity} seats</span>
            <span className={`num font-semibold ${s.seats_left <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>{s.seats_left} {s.seats_left === 1 ? 'spot' : 'spots'} left</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-soft">
            <motion.div className={`h-full rounded-full ${s.seats_left <= 5 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-brand'}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
          </div>
          <button onClick={onClick} disabled={busy || full || (started && !s.booked)} className={`btn mt-4 w-full ${s.booked ? 'btn-ghost' : 'btn-primary'}`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : full ? 'Session full' : started && !s.booked ? 'Already started' : s.booked ? 'Cancel booking' : 'Book free seat'}
          </button>
        </div>
      </Card>
    </Reveal>
  )
}

export default function LiveSessions() {
  const [playing, setPlaying] = useState(null)
  const { data, error, loading, reload, setData } = useApi('/sessions')
  const sessions = data?.sessions || []
  const next = sessions.find((s) => new Date(s.start_time) > new Date()) || sessions[0]
  const update = (session) => setData((d) => ({ sessions: d.sessions.map((x) => (x.id === session.id ? session : x)) }))
  const booked = sessions.filter((s) => s.booked).length

  return (
    <Page className="space-y-10">
      <PageHeader eyebrow="Live sessions & webinars" title="Learn live with mentors" subtitle="Join this week’s sessions with VaultEdge mentors. Ask questions, watch live analysis and learn alongside other students." />

      {loading ? (
        <>
          <Skeleton className="h-36 !rounded-3xl" />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 !rounded-3xl" />)}</div>
        </>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : sessions.length === 0 ? (
        <EmptyState icon={CalendarX} title="No sessions scheduled this week" message="New mentor sessions are added every week. Check back soon." />
      ) : (
        <>
          {next && (
            <Card className="relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-gold/10" />
              <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-400"><span className="pulse-dot h-2 w-2 rounded-full bg-rose-500" /> Up next</div>
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{next.title}</h2>
                  <p className="mt-1 text-muted">with {next.mentor_name} · {new Date(next.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(next.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                  <p className="mt-2 text-sm text-muted">{booked ? `You’re booked on ${booked} session${booked === 1 ? '' : 's'} this week.` : 'No sessions booked yet. Grab a seat below.'}</p>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-xs text-muted">Starts in</div>
                  <div className="text-3xl font-semibold text-gradient"><Countdown date={new Date(next.start_time)} /></div>
                </div>
              </div>
            </Card>
          )}

          <section>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><Calendar className="h-5 w-5 text-emerald-400" /> This week’s schedule</h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sessions.map((s, i) => <SessionCard key={s.id} s={s} i={i} onChange={update} />)}
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><Play className="h-5 w-5 text-gold" /> Past recordings</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {recordings.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.05}>
              <button onClick={() => setPlaying(r)} className="glass card-hover group w-full overflow-hidden rounded-3xl text-left">
                <div className="relative">
                  <CourseThumb course={{ id: r.id, hue: r.hue }} className="h-40" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:scale-110 group-hover:bg-white/25"><Play className="ml-0.5 h-6 w-6 fill-white text-white" /></span>
                  </span>
                  <span className="num absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">{r.length}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold leading-snug">{r.title}</h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-2"><Avatar initials={r.hostData.initials} hue={r.hostData.hue} size={22} />{r.hostData.name}</span>
                    <span>{r.ago}</span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <Modal open={!!playing} onClose={() => setPlaying(null)} title={playing?.title} size="max-w-3xl">
        {playing && (
          <div>
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              <CourseThumb course={{ id: playing.id, hue: playing.hue }} className="absolute inset-0 h-full" />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                <Play className="h-12 w-12 fill-white" />
                <p className="mt-3 text-sm text-white/80">Recording playback is a placeholder in this demo.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted">
              <Avatar initials={playing.hostData.initials} hue={playing.hostData.hue} size={32} /> {playing.hostData.name} · {playing.length}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
