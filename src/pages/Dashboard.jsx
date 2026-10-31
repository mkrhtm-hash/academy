import { motion } from 'framer-motion'
import { ArrowRight, Award, BookOpen, CalendarClock, CandlestickChart, Clock, Flame, PlayCircle, Radio, Target, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import CourseThumb from '../components/CourseThumb.jsx'
import InsightCard from '../components/InsightCard.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import StatCounter from '../components/StatCounter.jsx'
import { Avatar, Card, EmptyState, ErrorState, Page, PracticeLabel, Skeleton } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { fmtMinutes, person } from '../data/content.js'
import { useApi } from '../lib/api.js'
import { greeting, signedUsd, usd } from '../lib/utils.js'

const localDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }
const when = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long' }) + ' · ' + new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

function ActivityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass rounded-xl !bg-panel-solid px-3 py-2 text-xs">
      <div className="text-muted">{d.full}</div>
      <div className="num mt-0.5 text-sm font-semibold">{d.minutes} min</div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 !rounded-3xl lg:col-span-2" />
        <Skeleton className="h-64 !rounded-3xl" />
      </div>
      <Skeleton className="h-56 !rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 !rounded-3xl lg:col-span-2" />
        <Skeleton className="h-80 !rounded-3xl" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { state, user } = useApp()
  const { data, error, loading, reload } = useApi('/dashboard')

  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const { activity, account, totals, certificates, bookings } = data
  const first = (data.user || user).full_name.split(' ')[0]
  const resume = data.continue
  const week = activity.week.map((d) => {
    const date = localDate(d.date)
    return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }), minutes: d.minutes }
  })
  const dark = state.theme === 'dark'

  return (
    <Page className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm text-muted">{greeting()},</div>
          <h1 className="text-3xl font-bold md:text-4xl">{first} <span className="inline-block origin-[70%_70%] animate-[wave_2s_ease-in-out_1]">👋</span></h1>
          <p className="mt-1 text-muted">You’ve learned <span className="num font-semibold text-ink">{activity.week_minutes} min</span> this week. {activity.week_minutes ? 'Keep the momentum going.' : 'Your first lesson is waiting.'}</p>
        </div>
        <Link to="/courses" className="btn btn-ghost self-start">Browse courses <ArrowRight className="h-4 w-4" /></Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* continue learning */}
        {resume ? (
          <Card className="relative overflow-hidden lg:col-span-2">
            <CourseThumb course={resume.course} className="absolute inset-0 h-full opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-panel-solid via-panel-solid/90 to-panel-solid/30" />
            <div className="relative flex h-full flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400"><PlayCircle className="h-4 w-4" /> {resume.started ? 'Continue learning' : 'Start learning'}</div>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{resume.course.title}</h2>
                <p className="mt-1 text-muted">Module {resume.next_lesson.module_order} of {resume.course.modules_count} · {resume.next_lesson.module_title}</p>
                <p className="mt-1 text-sm text-muted">Up next: <span className="text-ink">{resume.next_lesson.title}</span></p>
                <div className="mt-6 max-w-md">
                  <div className="mb-2 flex justify-between text-sm"><span className="text-muted">{resume.course.progress.done} of {resume.course.progress.total} lessons</span><span className="num font-semibold">{resume.course.progress.pct}%</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-soft">
                    <motion.div className="h-full rounded-full bg-brand shadow-glow" initial={{ width: 0 }} animate={{ width: `${resume.course.progress.pct}%` }} transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }} />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3 sm:mt-auto sm:pt-6">
                  <Link to={`/learn/${resume.course.slug}/${resume.next_lesson.id}`} className="btn btn-primary"><PlayCircle className="h-4 w-4" /> {resume.started ? 'Resume' : 'Start'}</Link>
                  <Link to={`/courses/${resume.course.slug}`} className="btn btn-ghost">Course overview</Link>
                </div>
              </div>
              <div className="hidden justify-center sm:flex">
                <ProgressRing value={resume.course.progress.pct} size={150} stroke={12}>
                  <span className="num text-3xl font-semibold">{resume.course.progress.pct}%</span>
                  <span className="text-xs text-muted">complete</span>
                </ProgressRing>
              </div>
            </div>
          </Card>
        ) : (
          <div className="lg:col-span-2">
            <EmptyState icon={BookOpen} title="You’re all caught up" message="Every course you started is complete. Pick a new one and your next lesson will appear here." action={<Link to="/courses" className="btn btn-primary">Explore courses</Link>} />
          </div>
        )}

        {/* streak */}
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">Learning streak</div>
              <div className="mt-3 flex items-baseline gap-2">
                <StatCounter value={activity.streak} className="text-6xl font-semibold" duration={1.2} />
                <span className="text-lg text-muted">{activity.streak === 1 ? 'day' : 'days'}</span>
              </div>
            </div>
            <Flame className="animate-flicker h-16 w-16 text-orange-400 drop-shadow-[0_0_24px_rgba(251,146,60,0.7)]" />
          </div>
          <div className="relative mt-6 grid grid-cols-7 gap-1.5">
            {activity.week.map((d, i) => {
              const active = d.minutes > 0 || d.trades > 0
              return (
                <div key={d.date} className="text-center">
                  <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-gradient-to-br from-orange-400 to-gold text-orange-950' : 'bg-soft text-muted'}`}>
                    {active ? <Flame className="h-4 w-4" /> : <span className="text-[0.6rem]">·</span>}
                  </div>
                  <div className="mt-1 text-[0.65rem] text-muted">{week[i].day[0]}</div>
                </div>
              )
            })}
          </div>
          <p className="relative mt-4 text-sm text-muted">{activity.studied_today ? 'You were active today. Streak secured! 🔥' : 'Complete a lesson or a practice trade today to keep your streak alive.'}</p>
        </Card>
      </div>

      {/* progress rings */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your progress</h2>
          <Link to="/achievements" className="text-sm font-medium text-emerald-400 hover:underline">View achievements</Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex justify-center">
            <ProgressRing value={(totals.courses_in_progress / Math.max(1, totals.courses_started)) * 100} size={130} label="Courses in progress" sublabel={`${totals.courses_started} started`} colors={['#10b981', '#34d399']}>
              <span className="num text-3xl font-semibold">{totals.courses_in_progress}</span>
            </ProgressRing>
          </div>
          <div className="flex justify-center">
            <ProgressRing value={(totals.lessons_completed / Math.max(1, totals.lessons_in_my_courses)) * 100} size={130} label="Lessons completed" sublabel={`of ${totals.lessons_in_my_courses} in your courses`} colors={['#0ea5e9', '#10b981']}>
              <span className="num text-3xl font-semibold">{totals.lessons_completed}</span>
            </ProgressRing>
          </div>
          <div className="flex justify-center">
            <ProgressRing value={account.win_rate} size={130} label="Practice win rate" sublabel={`${account.closed_trades} closed trades`} colors={['#f2c14e', '#10b981']}>
              <span className="num text-3xl font-semibold">{account.win_rate}%</span>
            </ProgressRing>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* weekly chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Weekly learning activity</h2>
              <p className="text-sm text-muted">Minutes studied over the last 7 days</p>
            </div>
            <div className="text-right">
              <div className="num text-2xl font-semibold">{activity.week_minutes}</div>
              <div className="text-xs text-muted">minutes</div>
            </div>
          </div>
          <div className="mt-6 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f2c14e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={dark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip content={<ActivityTooltip />} cursor={{ fill: 'var(--soft)', radius: 8 }} />
                <Bar dataKey="minutes" fill="url(#barGrad)" radius={[4, 4, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <InsightCard />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* my courses */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My courses</h2>
            <Link to="/courses" className="text-sm font-medium text-emerald-400 hover:underline">Add more</Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.my_courses.length === 0 && <p className="py-6 text-center text-sm text-muted">You haven’t started a course yet. Complete a lesson and it will show up here.</p>}
            {data.my_courses.map((c) => (
              <Link key={c.id} to={`/courses/${c.slug}`} className="flex items-center gap-4 rounded-2xl p-2 transition hover:bg-soft">
                <CourseThumb course={c} className="h-14 w-20 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{c.title}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-brand" style={{ width: `${c.progress.pct}%` }} /></div>
                    <span className="num w-10 text-right text-xs text-muted">{c.progress.pct}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {data.recommended.length > 0 && (
            <>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted"><Target className="h-4 w-4" /> Recommended for you</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {data.recommended.map((c) => (
                  <Link key={c.id} to={`/courses/${c.slug}`} className="card-hover overflow-hidden rounded-2xl border border-line bg-soft">
                    <CourseThumb course={c} className="h-20" />
                    <div className="p-3"><div className="truncate text-sm font-semibold">{c.title}</div><div className="text-xs text-muted">{c.level} · {fmtMinutes(c.duration_minutes)}</div></div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400"><CandlestickChart className="h-4 w-4" /> Practice account</div>
              <PracticeLabel />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Wallet className="h-8 w-8 text-gold" />
              <div>
                <div className="num text-2xl font-semibold">{usd(account.balance)}</div>
                <div className="text-xs text-muted">Balance</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-soft p-3"><div className="text-[0.7rem] text-muted">Equity</div><div className="num font-semibold">{usd(account.equity)}</div></div>
              <div className="rounded-xl bg-soft p-3"><div className="text-[0.7rem] text-muted">Total P&L</div><div className={`num font-semibold ${account.total_pnl >= 0 ? 'text-up' : 'text-down'}`}>{signedUsd(account.total_pnl)}</div></div>
              <div className="rounded-xl bg-soft p-3"><div className="text-[0.7rem] text-muted">Open positions</div><div className="num font-semibold">{account.open_positions}</div></div>
              <div className="rounded-xl bg-soft p-3"><div className="text-[0.7rem] text-muted">Win rate</div><div className="num font-semibold">{account.win_rate}%</div></div>
            </div>
            <Link to="/simulator" className="btn btn-primary mt-5 w-full"><Clock className="h-4 w-4" /> Open simulator</Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-400"><Radio className="h-4 w-4" /> Your booked sessions</div>
            {bookings.length === 0 ? (
              <div className="mt-3">
                <p className="text-sm text-muted">No sessions booked yet.</p>
                {data.next_session && (
                  <div className="mt-3 rounded-2xl bg-soft p-3 text-sm">
                    <div className="text-xs text-muted">Next up</div>
                    <div className="font-semibold">{data.next_session.title}</div>
                    <div className="text-xs text-muted">{when(data.next_session.start_time)} · {data.next_session.seats_left} spots left</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {bookings.slice(0, 3).map((s) => {
                  const host = person(s.mentor_name)
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <Avatar initials={host.initials} hue={host.hue} size={34} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{s.title}</div>
                        <div className="flex items-center gap-1 text-xs text-muted"><CalendarClock className="h-3.5 w-3.5" />{when(s.start_time)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Link to="/live" className="btn btn-ghost mt-5 w-full">{bookings.length ? 'Manage bookings' : 'Book a live session'}</Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"><Award className="h-4 w-4" /> Certificates</div>
            {certificates.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Complete every lesson in a course to earn your first certificate.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {certificates.slice(0, 3).map((c) => (
                  <Link key={c.code} to="/achievements" className="flex items-center gap-3 rounded-xl bg-soft p-3 hover:bg-emerald-500/10">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand"><Award className="h-5 w-5 text-emerald-950" /></div>
                    <div className="min-w-0"><div className="truncate text-sm font-semibold">{c.course.title}</div><div className="num text-[0.7rem] text-muted">{c.code}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Page>
  )
}
