import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Circle, Crown, FileQuestion, FileText, Lightbulb, Loader2, Lock, Maximize, Pause, Play, RotateCcw, Trophy, Volume2, XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import CourseThumb from '../components/CourseThumb.jsx'
import ProgressRing from '../components/ProgressRing.jsx'
import { Card, EmptyState, ErrorState, Page, PageSkeleton, Skeleton } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { lessonTakeaways, moduleQuiz, playlist } from '../data/content.js'
import { api, useApi } from '../lib/api.js'
import { celebrate } from '../lib/utils.js'

function VideoPlaceholder({ course, lesson, onFinished }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const seconds = lesson.duration_minutes * 60

  useEffect(() => { setPlaying(false); setProgress(0) }, [lesson.id])
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setPlaying(false); onFinished?.(); return 100 }
        return p + 0.5
      })
    }, 100)
    return () => clearInterval(t)
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  if (lesson.video_url) {
    return <video key={lesson.id} src={lesson.video_url} controls className="aspect-video w-full rounded-3xl border border-line bg-black" onEnded={onFinished} />
  }

  const elapsed = Math.round((progress / 100) * seconds)
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="group relative aspect-video overflow-hidden rounded-3xl border border-line bg-black">
      <CourseThumb course={course} className="absolute inset-0 h-full opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
        <span className={`h-2 w-2 rounded-full ${playing ? 'pulse-dot bg-emerald-400' : 'bg-white/50'}`} /> {playing ? 'Now playing' : 'Video lesson'}
      </div>
      <button onClick={() => setPlaying(!playing)} className="absolute inset-0 flex items-center justify-center" aria-label={playing ? 'Pause' : 'Play'}>
        <AnimatePresence>
          {!playing && (
            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.4, opacity: 0 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-brand shadow-glow transition group-hover:scale-110">
              {progress >= 100 ? <RotateCcw className="h-8 w-8 text-emerald-950" /> : <Play className="ml-1 h-8 w-8 fill-emerald-950 text-emerald-950" />}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="mb-1 text-sm font-semibold text-white sm:text-lg">{lesson.title}</div>
        <div className="h-1.5 cursor-pointer overflow-hidden rounded-full bg-white/20" onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setProgress(Math.round(((e.clientX - r.left) / r.width) * 100))
        }}>
          <div className="h-full rounded-full bg-brand transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-4 text-white/80">
          <button onClick={() => { if (progress >= 100) setProgress(0); setPlaying(!playing) }} aria-label="Play/Pause">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <span className="num text-xs">{fmt(elapsed)} / {fmt(seconds)}</span>
          <span className="flex-1" />
          <Volume2 className="h-4 w-4" />
          <Maximize className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function Quiz({ course, moduleIndex, onContinue }) {
  const { saveQuiz } = useApp()
  const questions = useMemo(() => moduleQuiz(course.category, moduleIndex), [course.category, moduleIndex])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [answers, setAnswers] = useState([])
  const done = answers.length === questions.length && picked === null

  useEffect(() => { setIdx(0); setPicked(null); setAnswers([]) }, [moduleIndex, course.slug])

  const q = questions[idx]
  const choose = (i) => { if (picked === null) setPicked(i) }
  const next = () => {
    const a = [...answers, picked === q.answer]
    setAnswers(a)
    setPicked(null)
    if (idx + 1 < questions.length) setIdx(idx + 1)
    else {
      const score = a.filter(Boolean).length
      saveQuiz(`${course.slug}/quiz-${moduleIndex}`, score, questions.length)
      if (score === questions.length) celebrate(false)
    }
  }
  const retry = () => { setIdx(0); setPicked(null); setAnswers([]) }

  if (done) {
    const score = answers.filter(Boolean).length
    const pct = Math.round((score / questions.length) * 100)
    return (
      <Card className="p-8 text-center">
        <ProgressRing value={pct} size={140} stroke={12} colors={pct === 100 ? ['#10b981', '#f2c14e'] : pct >= 60 ? ['#10b981', '#34d399'] : ['#f43f5e', '#f2c14e']}>
          <span className="num text-3xl font-semibold">{score}/{questions.length}</span>
          <span className="text-xs text-muted">{pct}%</span>
        </ProgressRing>
        <h2 className="mt-6 text-2xl font-bold">{pct === 100 ? 'Perfect score! 🏆' : pct >= 60 ? 'Nice work!' : 'Keep practising'}</h2>
        <p className="mt-2 text-muted">{pct === 100 ? 'You nailed every question in this module.' : pct >= 60 ? 'You’ve got the core ideas. Review the notes to fill the gaps.' : 'Rewatch the lessons and try again. Repetition builds mastery.'}</p>
        <div className="mx-auto mt-6 max-w-md space-y-2 text-left">
          {questions.map((qq, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-soft p-3 text-sm">
              {answers[i] ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />}
              <span>{qq.question}</span>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <button onClick={retry} className="btn btn-ghost"><RotateCcw className="h-4 w-4" /> Retry quiz</button>
          <button onClick={onContinue} className="btn btn-primary">Continue <ArrowRight className="h-4 w-4" /></button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"><FileQuestion className="h-4 w-4" /> Module {moduleIndex + 1} quiz</div>
        <span className="num text-sm text-muted">{idx + 1} / {questions.length}</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-soft">
        <motion.div className="h-full bg-brand" animate={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          <h2 className="mt-6 text-xl font-semibold sm:text-2xl">{q.question}</h2>
          <div className="mt-6 grid gap-3">
            {q.options.map((opt, i) => {
              const isAns = i === q.answer
              const isPicked = i === picked
              const state = picked === null ? 'idle' : isAns ? 'correct' : isPicked ? 'wrong' : 'dim'
              const cls = {
                idle: 'border-line bg-soft hover:border-emerald-500/50 hover:bg-emerald-500/5',
                correct: 'border-emerald-500 bg-emerald-500/15',
                wrong: 'border-rose-500 bg-rose-500/15 animate-[shake_.4s]',
                dim: 'border-line opacity-50',
              }[state]
              return (
                <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => choose(i)} disabled={picked !== null} className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition ${cls}`}>
                  <span className={`num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${state === 'correct' ? 'bg-emerald-500 text-emerald-950' : state === 'wrong' ? 'bg-rose-500 text-white' : 'bg-soft ring-1 ring-line'}`}>
                    {state === 'correct' ? <Check className="h-4 w-4" /> : state === 'wrong' ? <XCircle className="h-4 w-4" /> : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </motion.button>
              )
            })}
          </div>
          <AnimatePresence>
            {picked !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-5 rounded-2xl p-4 text-sm ${picked === q.answer ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                <div className="font-semibold">{picked === q.answer ? 'Correct!' : 'Not quite.'}</div>
                <div className="mt-1 text-muted">{q.explain}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex justify-end">
        <button onClick={next} disabled={picked === null} className="btn btn-primary">{idx + 1 === questions.length ? 'See results' : 'Next question'} <ArrowRight className="h-4 w-4" /></button>
      </div>
    </Card>
  )
}

function Sidebar({ course, items, currentId, signedIn }) {
  const { state } = useApp()
  const prog = course.progress || { done: 0, total: course.lessons_count, pct: 0 }
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <button className="flex w-full items-center gap-4 p-5 text-left lg:pointer-events-none" onClick={() => setMobileOpen(!mobileOpen)}>
        <ProgressRing key={prog.pct} value={prog.pct} size={56} stroke={6}><span className="num text-xs font-semibold">{prog.pct}%</span></ProgressRing>
        <div className="flex-1">
          <div className="font-semibold leading-tight">{course.title}</div>
          <div className="text-xs text-muted">{signedIn ? `${prog.done} of ${prog.total} lessons complete` : 'Log in to track your progress'}</div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted transition lg:hidden ${mobileOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`${mobileOpen ? 'block' : 'hidden'} max-h-[60vh] overflow-y-auto border-t border-line p-3 lg:block`}>
        {course.modules.map((m, mi) => {
          const doneCount = m.lessons.filter((l) => l.completed).length
          return (
            <div key={m.id} className="mb-3">
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Module {mi + 1} · {m.title}</span>
                <span className="num text-[0.7rem] text-muted">{doneCount}/{m.lessons.length}</span>
              </div>
              {items.filter((it) => it.moduleIndex === mi).map((it) => {
                const active = it.id === currentId
                const done = it.type === 'lesson' ? it.lesson.completed : !!state.quizScores[`${course.slug}/${it.id}`]
                const locked = it.type === 'lesson' ? it.lesson.locked : !signedIn
                return (
                  <Link key={it.id} to={`/learn/${course.slug}/${it.id}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'bg-emerald-500/15 text-ink ring-1 ring-emerald-500/30' : 'text-muted hover:bg-soft hover:text-ink'}`}>
                    {locked ? <Lock className="h-4 w-4 shrink-0" />
                      : done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        : it.type === 'quiz' ? <FileQuestion className="h-4 w-4 shrink-0 text-gold" /> : <Circle className="h-4 w-4 shrink-0" />}
                    <span className="flex-1 truncate">{it.type === 'quiz' ? 'Module quiz' : it.lesson.title}</span>
                    {it.type === 'lesson' && <span className="num text-[0.7rem]">{it.lesson.duration_minutes}m</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function LockedCard({ kind, course, code }) {
  const location = useLocation()
  const next = encodeURIComponent(location.pathname)
  const upgrade = code === 'UPGRADE_REQUIRED'
  return (
    <Card className="relative overflow-hidden p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15">{upgrade ? <Crown className="h-8 w-8 text-gold" /> : <Lock className="h-8 w-8 text-gold" />}</div>
      <h2 className="mt-5 text-2xl font-bold">This {kind} is locked</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">
        {upgrade ? `${course.title} is part of the Pro library. Switch plan to unlock every lesson. It’s a demo, so no payment is taken.` : 'Create a free account or log in to keep learning, track your progress and earn certificates.'}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {upgrade ? <Link to="/pricing" className="btn btn-primary">See plans</Link> : (
          <>
            <Link to={`/signup?next=${next}`} className="btn btn-primary">Create free account</Link>
            <Link to={`/login?next=${next}`} className="btn btn-ghost">Log in</Link>
          </>
        )}
      </div>
    </Card>
  )
}

export default function LessonPlayer() {
  const { courseId, itemId } = useParams()
  const navigate = useNavigate()
  const { user, toast, setStreak, showCertificate } = useApp()
  const { data, error, loading, reload, setData } = useApi(`/courses/${encodeURIComponent(courseId)}`)
  const [tab, setTab] = useState('notes')
  const course = data?.course
  const items = course ? playlist(course) : []
  const index = items.findIndex((i) => i.id === itemId)
  const item = items[index]
  const lessonQuery = useApi(item?.type === 'lesson' ? `/lessons/${item.id}` : null)
  const [saving, setSaving] = useState(false)

  if (loading) return <PageSkeleton />
  if (error) {
    return error.status === 404
      ? <EmptyState icon={FileText} title="Course not found" message="This course doesn’t exist or may have been moved." action={<Link to="/courses" className="btn btn-primary">Back to courses</Link>} />
      : <ErrorState error={error} onRetry={reload} />
  }

  // "/learn/:slug/start": jump to the next lesson you can watch
  if (itemId === 'start') {
    const lessons = items.filter((i) => i.type === 'lesson')
    const target = lessons.find((i) => !i.lesson.locked && !i.lesson.completed) || lessons.find((i) => !i.lesson.locked) || lessons[0]
    return <Navigate to={`/learn/${course.slug}/${target.id}`} replace />
  }

  if (!item) {
    return <EmptyState icon={FileText} title="Lesson not found" message="This lesson doesn’t exist or may have been moved." action={<Link to={`/courses/${course.slug}`} className="btn btn-primary">Back to course</Link>} />
  }

  const next = items[index + 1]
  const prev = items[index - 1]
  const goNext = () => (next ? navigate(`/learn/${course.slug}/${next.id}`) : navigate(`/courses/${course.slug}`))
  const lesson = lessonQuery.data?.lesson
  const isDone = item.type === 'lesson' && item.lesson.completed

  // Optimistic: tick the lesson immediately, then confirm with the server (and roll back on failure).
  const patchLesson = (completed, progress) => setData((d) => ({
    course: {
      ...d.course,
      progress: progress || d.course.progress,
      modules: d.course.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (String(l.id) === item.id ? { ...l, completed } : l)) })),
    },
  }))

  const markComplete = async () => {
    const completed = !isDone
    const before = course.progress
    const done = before.done + (completed ? 1 : -1)
    patchLesson(completed, { ...before, done, pct: Math.round((done / before.total) * 100) })
    setSaving(true)
    try {
      const res = await api(`/lessons/${item.id}`, { method: 'POST', body: { completed } })
      patchLesson(completed, res.progress)
      setStreak(res.streak, res.studied_today)
      if (completed) toast({ title: 'Lesson complete ✓', message: `+${item.lesson.duration_minutes} minutes added to today’s learning.` })
      if (res.certificate) showCertificate(res.certificate)
    } catch (err) {
      patchLesson(!completed, before)
      toast({ type: 'error', title: 'Couldn’t save your progress', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link to={`/courses/${course.slug}`} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> {course.title}</Link>
        <span className="text-xs text-muted">Module {item.moduleIndex + 1} · {item.type === 'quiz' ? 'Quiz' : `Lesson ${item.lessonIndex + 1}`}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {item.type === 'quiz' ? (
            user ? <Quiz course={course} moduleIndex={item.moduleIndex} onContinue={goNext} /> : <LockedCard kind="quiz" course={course} code="LOGIN_REQUIRED" />
          ) : lessonQuery.error && [401, 403].includes(lessonQuery.error.status) ? (
            <LockedCard kind="lesson" course={course} code={lessonQuery.error.code} />
          ) : lessonQuery.error ? (
            <ErrorState error={lessonQuery.error} onRetry={lessonQuery.reload} />
          ) : !lesson ? (
            <div className="space-y-6">
              <Skeleton className="aspect-video w-full !rounded-3xl" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-40 w-full !rounded-3xl" />
            </div>
          ) : (
            <>
              <VideoPlaceholder course={course} lesson={lesson} onFinished={() => !isDone && user && toast({ type: 'info', title: 'Video finished', message: 'Mark the lesson as complete when you’re ready.' })} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{lesson.title}</h1>
                  <div className="mt-1 text-sm text-muted">{lesson.module.title} · {lesson.duration_minutes} min</div>
                </div>
                <div className="flex gap-2">
                  {user && (
                    <button onClick={markComplete} disabled={saving} className={`btn ${isDone ? 'btn-ghost !border-emerald-500/40 !text-emerald-400' : 'btn-ghost'}`}>
                      {isDone ? <><CheckCircle2 className="h-4 w-4" /> Completed</> : <>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Mark lesson complete</>}
                    </button>
                  )}
                  <button onClick={goNext} className="btn btn-primary">{next ? (next.type === 'quiz' ? 'Take quiz' : 'Next lesson') : 'Finish'} <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>

              {!user && (
                <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:items-center">
                  <p className="text-sm">You’re watching a free preview. Create a free account to track progress and earn your certificate.</p>
                  <Link to={`/signup?next=${encodeURIComponent(`/learn/${course.slug}/${item.id}`)}`} className="btn btn-primary btn-sm">Sign up free</Link>
                </div>
              )}

              <Card className="p-6">
                <div className="flex gap-1 border-b border-line">
                  {[['notes', 'Lesson notes', FileText], ['takeaways', 'Key takeaways', Lightbulb], ['resources', 'Resources', Trophy]].map(([k, l, Icon]) => (
                    <button key={k} onClick={() => setTab(k)} className={`relative flex items-center gap-2 px-3 pb-3 text-sm font-medium ${tab === k ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                      <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{l}</span><span className="sm:hidden">{l.split(' ')[0]}</span>
                      {tab === k && <motion.span layoutId="lesson-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />}
                    </button>
                  ))}
                </div>
                <div className="pt-5 text-sm leading-relaxed text-muted">
                  {tab === 'notes' && (
                    <div className="space-y-4">
                      <p className="text-ink">{lesson.content}</p>
                      <p>Use the simulator to test this idea in a risk-free environment. Open a small position, set a stop-loss first, and note how price behaves around your levels.</p>
                    </div>
                  )}
                  {tab === 'takeaways' && (
                    <ul className="space-y-3">
                      {lessonTakeaways(lesson.id).map((p) => <li key={p} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><span className="text-ink">{p}</span></li>)}
                    </ul>
                  )}
                  {tab === 'resources' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link to="/simulator" className="rounded-2xl border border-line bg-soft p-4 hover:border-emerald-500/40"><div className="font-semibold text-ink">Practise in the simulator</div><div className="text-xs">Apply this lesson with virtual funds</div></Link>
                      <Link to="/tools#calculators" className="rounded-2xl border border-line bg-soft p-4 hover:border-emerald-500/40"><div className="font-semibold text-ink">Risk & pip calculators</div><div className="text-xs">Size your practice trades properly</div></Link>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          <div className="flex justify-between">
            {prev ? <Link to={`/learn/${course.slug}/${prev.id}`} className="btn btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /> Previous</Link> : <span />}
            {next && <Link to={`/learn/${course.slug}/${next.id}`} className="btn btn-ghost btn-sm">Skip <ArrowRight className="h-4 w-4" /></Link>}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Sidebar course={course} items={items} currentId={item.id} signedIn={!!user} />
        </aside>
      </div>
    </Page>
  )
}
