import { AnimatePresence, motion } from 'framer-motion'
import { Check, Crown, Edit3, LogOut, Plus, Target, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import CourseThumb from '../components/CourseThumb.jsx'
import { useLogout } from '../components/Layout.jsx'
import { Avatar, Card, DynamicIcon, ErrorState, Page, PageSkeleton, PracticeLabel } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { LEVELS, badgeDefs, initialsOf } from '../data/content.js'
import { api, useApi } from '../lib/api.js'
import { signedUsd, usd } from '../lib/utils.js'

const tierStyle = {
  Free: 'bg-soft text-muted ring-line',
  Pro: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  Elite: 'bg-gold/15 text-gold ring-gold/40',
}

export default function Profile() {
  const { user, setUser, state, setGoals, quizMaster, toast } = useApp()
  const onLogout = useLogout()
  const { data, error, loading, reload } = useApi('/dashboard')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.full_name)
  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const earned = [...data.badges, ...(quizMaster ? ['quiz-master'] : [])]
  const { account } = data

  const saveProfile = async (patch) => {
    setSaving(true)
    try {
      const res = await api('/auth/me', { method: 'PATCH', body: patch })
      setUser(res.user)
      toast({ title: 'Profile updated' })
      return true
    } catch (err) {
      toast({ type: 'error', title: 'Couldn’t update profile', message: err.message })
      return false
    } finally {
      setSaving(false)
    }
  }
  const saveName = async () => {
    const n = name.trim()
    if (!n) return toast({ type: 'error', title: 'Name can’t be empty' })
    if (await saveProfile({ full_name: n.slice(0, 60) })) setEditing(false)
  }
  const addGoal = (e) => {
    e.preventDefault()
    if (!goal.trim()) return
    setGoals((g) => [...g, { id: Date.now().toString(36), text: goal.trim(), done: false }])
    setGoal('')
  }
  const toggleGoal = (id) => setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))
  const removeGoal = (id) => setGoals((gs) => gs.filter((g) => g.id !== id))

  return (
    <Page className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600/40 via-emerald-500/10 to-gold/30 sm:h-40">
          <div className="grid-bg h-full w-full opacity-40" />
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="rounded-full bg-canvas p-1.5"><Avatar initials={initialsOf(user.full_name)} size={104} ring /></div>
              <div className="pb-1">
                {editing ? (
                  <div className="flex gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} className="input !py-2" autoFocus maxLength={60} onKeyDown={(e) => e.key === 'Enter' && saveName()} aria-label="Your name" />
                    <button onClick={saveName} disabled={saving} className="btn btn-primary btn-sm">Save</button>
                  </div>
                ) : (
                  <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">{user.full_name}
                    <button onClick={() => { setName(user.full_name); setEditing(true) }} className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink" aria-label="Edit name"><Edit3 className="h-4 w-4" /></button>
                  </h1>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tierStyle[user.plan.name]}`}>
                    {user.plan.name !== 'Free' && <Crown className="h-3.5 w-3.5" />}{user.plan.name} plan
                  </span>
                  <span>{user.email}</span>
                  <span>· Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-start sm:self-auto">
              {user.plan.name !== 'Elite' && <Link to="/pricing" className="btn btn-primary"><Crown className="h-4 w-4" /> Change plan</Link>}
              <button onClick={onLogout} className="btn btn-ghost"><LogOut className="h-4 w-4" /> Log out</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Courses started', data.totals.courses_started], ['Lessons done', data.totals.lessons_completed], ['Day streak', data.activity.streak], ['Badges', earned.length]].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-soft p-4"><div className="num text-2xl font-semibold">{v}</div><div className="text-xs text-muted">{l}</div></div>
            ))}
          </div>

          <div className="mt-6">
            <span className="label">Experience level</span>
            <div className="inline-grid grid-cols-3 gap-1 rounded-xl border border-line bg-soft p-1">
              {LEVELS.map((l) => (
                <button key={l} disabled={saving} onClick={() => l !== user.experience_level && saveProfile({ experience_level: l })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${user.experience_level === l ? 'bg-panel-solid text-ink shadow ring-1 ring-emerald-500/30' : 'text-muted hover:text-ink'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-400" /><h2 className="text-lg font-semibold">Learning goals</h2></div>
          <div className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {state.goals.map((g) => (
                <motion.div key={g.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="group flex items-center gap-3 rounded-xl bg-soft px-3 py-3">
                  <button onClick={() => toggleGoal(g.id)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${g.done ? 'border-emerald-500 bg-emerald-500' : 'border-line hover:border-emerald-500'}`} aria-label={g.done ? 'Mark goal incomplete' : 'Mark goal complete'}>
                    {g.done && <Check className="h-3.5 w-3.5 text-emerald-950" />}
                  </button>
                  <span className={`flex-1 text-sm ${g.done ? 'text-muted line-through' : ''}`}>{g.text}</span>
                  <button onClick={() => removeGoal(g.id)} className="rounded-lg p-1 text-muted opacity-0 transition hover:text-rose-400 group-hover:opacity-100" aria-label="Remove goal"><Trash2 className="h-4 w-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            {state.goals.length === 0 && <p className="py-4 text-center text-sm text-muted">No goals yet. Add one to stay focused.</p>}
          </div>
          <form onSubmit={addGoal} className="mt-4 flex gap-2">
            <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Add a new goal…" className="input" aria-label="New goal" />
            <button className="btn btn-primary !px-3" aria-label="Add goal"><Plus className="h-4 w-4" /></button>
          </form>
          <p className="mt-3 text-[0.7rem] text-muted">Goals are saved on this device.</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Badges</h2><Link to="/achievements" className="text-sm font-medium text-emerald-400 hover:underline">View all</Link></div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {badgeDefs.map((b) => {
              const on = earned.includes(b.id)
              return (
                <div key={b.id} className={`flex flex-col items-center rounded-2xl bg-soft p-3 text-center ${on ? '' : 'opacity-40 grayscale'}`} title={b.desc}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: on ? `linear-gradient(135deg, ${b.hue[0]}, ${b.hue[1]})` : 'var(--soft)' }}>
                    <DynamicIcon name={b.icon} className={`h-6 w-6 ${on ? 'text-white' : 'text-muted'}`} />
                  </div>
                  <div className="mt-2 text-[0.7rem] font-semibold leading-tight">{b.title}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">My courses</h2>
        {data.my_courses.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No courses started yet. <Link to="/courses" className="text-emerald-400 hover:underline">Browse the catalog</Link></p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.my_courses.map((c) => (
              <Link key={c.id} to={`/courses/${c.slug}`} className="card-hover overflow-hidden rounded-2xl border border-line bg-soft">
                <CourseThumb course={c} className="h-24" />
                <div className="p-4">
                  <div className="font-semibold">{c.title}</div>
                  <div className="mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-solid"><div className="h-full bg-brand" style={{ width: `${c.progress.pct}%` }} /></div><span className="num text-xs text-muted">{c.progress.pct}%</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Wallet className="h-9 w-9 shrink-0 text-gold" />
          <div>
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">Practice account</h2><PracticeLabel /></div>
            <p className="num text-sm text-muted">Balance {usd(account.balance)} · equity {usd(account.equity)} · total P&L <span className={account.total_pnl >= 0 ? 'text-up' : 'text-down'}>{signedUsd(account.total_pnl)}</span></p>
          </div>
        </div>
        <Link to="/simulator" className="btn btn-ghost">Open simulator</Link>
      </Card>
    </Page>
  )
}
