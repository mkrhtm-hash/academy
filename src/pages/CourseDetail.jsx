import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, Award, BookOpen, Check, CheckCircle2, ChevronDown, Clock, Crown, FileQuestion, Globe, Lock, PlayCircle, Unlock, Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CourseThumb from '../components/CourseThumb.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import { Avatar, Card, EmptyState, ErrorState, LevelBadge, Page, PageSkeleton, Reveal } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { fmtMinutes, person } from '../data/content.js'
import { useApi } from '../lib/api.js'

function Curriculum({ course, signedIn }) {
  const { state } = useApp()
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-3">
      {course.modules.map((m, mi) => {
        const doneCount = m.lessons.filter((l) => l.completed).length
        const isOpen = open === mi
        return (
          <div key={m.id} className="glass overflow-hidden rounded-2xl">
            <button onClick={() => setOpen(isOpen ? -1 : mi)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5" aria-expanded={isOpen}>
              <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-semibold text-emerald-400">{String(mi + 1).padStart(2, '0')}</span>
              <span className="flex-1">
                <span className="block font-semibold">{m.title}</span>
                <span className="text-xs text-muted">{m.lessons.length} lessons · quiz{signedIn && ` · ${doneCount}/${m.lessons.length} done`}</span>
              </span>
              <ChevronDown className={`h-5 w-5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <ul className="border-t border-line px-2 py-2 sm:px-3">
                    {m.lessons.map((l) => (
                      <li key={l.id}>
                        <Link to={`/learn/${course.slug}/${l.id}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-soft ${l.locked ? 'opacity-60' : ''}`}>
                          {l.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <PlayCircle className="h-4 w-4 shrink-0 text-muted" />}
                          <span className="flex-1">{l.title}</span>
                          {l.free && !course.is_free && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-400">Preview</span>}
                          <span className="num text-xs text-muted">{l.duration_minutes} min</span>
                          {l.locked ? <Lock className="h-3.5 w-3.5 text-muted" /> : <Unlock className="h-3.5 w-3.5 text-emerald-400/70" />}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link to={`/learn/${course.slug}/quiz-${mi}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-soft ${signedIn ? '' : 'opacity-60'}`}>
                        <FileQuestion className="h-4 w-4 text-gold" />
                        <span className="flex-1">Module quiz · 3 questions</span>
                        {state.quizScores[`${course.slug}/quiz-${mi}`] && <span className="num text-xs text-gold">Best {state.quizScores[`${course.slug}/quiz-${mi}`].score}/3</span>}
                        {signedIn ? <Unlock className="h-3.5 w-3.5 text-emerald-400/70" /> : <Lock className="h-3.5 w-3.5 text-muted" />}
                      </Link>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()
  const { data, error, loading, reload } = useApi(`/courses/${encodeURIComponent(courseId)}`)

  if (loading) return <PageSkeleton />
  if (error?.status === 404) {
    return <EmptyState icon={BookOpen} title="We couldn’t find that course" message="It may have moved or the link is incorrect." action={<Link to="/courses" className="btn btn-primary">Browse courses</Link>} />
  }
  if (error) return <ErrorState error={error} onRetry={reload} />

  const { course } = data
  const prog = course.progress
  const ins = person(course.instructor_name)
  const lessons = course.modules.flatMap((m) => m.lessons)
  const resume = lessons.find((l) => !l.completed && !l.locked) || lessons[0]
  const preview = lessons.find((l) => l.free) || lessons[0]

  return (
    <Page>
      <button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back</button>

      {/* hero */}
      <div className="glass relative overflow-hidden rounded-[2rem]">
        <CourseThumb course={course} className="absolute inset-0 h-full opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/90 to-canvas/40" />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold ring-1 ring-line">{course.category}</span>
              <LevelBadge level={course.level} />
              {course.is_free && <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-950">FREE</span>}
            </div>
            <h1 className="mt-4 text-3xl font-bold md:text-5xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted">{course.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted"><Users className="h-4 w-4" />{course.students.toLocaleString()} {course.students === 1 ? 'student' : 'students'}</span>
              <span className="flex items-center gap-1.5 text-muted"><Clock className="h-4 w-4" />{fmtMinutes(course.duration_minutes)}</span>
              <span className="flex items-center gap-1.5 text-muted"><BookOpen className="h-4 w-4" />{course.lessons_count} lessons</span>
              <span className="flex items-center gap-1.5 text-muted"><Globe className="h-4 w-4" />English</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Avatar initials={ins.initials} hue={ins.hue} size={40} />
              <div className="text-sm"><div className="font-semibold">{ins.name}</div><div className="text-muted">{ins.role}</div></div>
            </div>
          </div>

          <div className="glass rounded-3xl !bg-panel-solid/80 p-6">
            {user && course.unlocked ? (
              <div className="text-center">
                <ProgressRing value={prog.pct} size={110} label="Your progress" sublabel={`${prog.done} of ${prog.total} lessons`} />
                {course.certificate && (
                  <Link to="/achievements" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gold/10 px-3 py-2 text-xs font-semibold text-gold ring-1 ring-gold/30">
                    <Award className="h-4 w-4" /> Certificate {course.certificate.certificate_code}
                  </Link>
                )}
                <Link to={`/learn/${course.slug}/${resume.id}`} className="btn btn-primary mt-5 w-full"><PlayCircle className="h-4 w-4" />{prog.done ? (prog.pct === 100 ? 'Review course' : 'Continue learning') : 'Start course'}</Link>
              </div>
            ) : user ? (
              <>
                <div className="flex items-center gap-2 text-2xl font-semibold"><Crown className="h-6 w-6 text-gold" /> Pro course</div>
                <div className="mt-1 text-sm text-muted">Included in the Pro and Elite plans. You’re on the {user.plan.name} plan.</div>
                <Link to="/pricing" className="btn btn-primary mt-5 w-full !py-3.5">Switch plan (demo)</Link>
                <Link to={`/learn/${course.slug}/${preview.id}`} className="btn btn-ghost mt-2 w-full">Preview free lesson</Link>
              </>
            ) : (
              <>
                <div className="num text-4xl font-semibold">{course.is_free ? <span className="text-gradient">Free</span> : 'Pro'}</div>
                <div className="mt-1 text-sm text-muted">{course.is_free ? 'Free forever. Certificate included.' : 'Included in the Pro and Elite plans.'}</div>
                <Link to={`/signup?next=${encodeURIComponent(`/learn/${course.slug}/start`)}`} className="btn btn-primary mt-5 w-full !py-3.5">Create free account</Link>
                <Link to={`/learn/${course.slug}/${preview.id}`} className="btn btn-ghost mt-2 w-full">Preview free lesson</Link>
                <ul className="mt-5 space-y-2 text-sm text-muted">
                  {[`${course.lessons_count} on-demand lessons`, `${course.modules.length} module quizzes`, 'Simulator exercises', 'Certificate of completion'].map((x) => (
                    <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />{x}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-12">
          <Reveal>
            <h2 className="text-2xl font-bold">Overview</h2>
            <p className="mt-3 leading-relaxed text-muted">{course.description}</p>
          </Reveal>

          {course.outcomes.length > 0 && (
            <Reveal>
              <h2 className="text-2xl font-bold">What you’ll learn</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <div key={o} className="flex gap-3 rounded-2xl border border-line bg-soft p-4 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20"><Check className="h-3.5 w-3.5 text-emerald-400" /></span>
                    {o}
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold">Curriculum</h2>
              <span className="text-sm text-muted">{course.modules.length} modules · {course.lessons_count} lessons · {fmtMinutes(course.duration_minutes)}</span>
            </div>
            <div className="mt-5"><Curriculum course={course} signedIn={!!user} /></div>
          </Reveal>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Your instructor</div>
            <div className="mt-4 flex items-center gap-4">
              <Avatar initials={ins.initials} hue={ins.hue} size={64} ring />
              <div>
                <div className="text-lg font-semibold">{ins.name}</div>
                <div className="text-sm text-muted">{ins.role}</div>
              </div>
            </div>
            {ins.years && (
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-soft p-3"><div className="num text-lg font-semibold">{ins.years} yrs</div><div className="text-xs text-muted">Experience</div></div>
                <div className="rounded-2xl bg-soft p-3"><div className="num text-lg font-semibold">{course.students}</div><div className="text-xs text-muted">Students here</div></div>
              </div>
            )}
            {ins.bio && <p className="mt-5 text-sm leading-relaxed text-muted">{ins.bio}</p>}
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <Award className="h-10 w-10 shrink-0 text-gold" />
            <div className="text-sm"><div className="font-semibold">Certificate included</div><div className="text-muted">Complete every lesson to earn your VaultEdge certificate.</div></div>
          </Card>
        </aside>
      </div>
    </Page>
  )
}
