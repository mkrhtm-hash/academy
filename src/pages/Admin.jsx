import { AnimatePresence, motion } from 'framer-motion'
import {
  Award, BookOpen, CalendarPlus, CandlestickChart, Crown, Loader2, Plus, Radio, Receipt, Search, ShieldCheck, Trash2, UserPlus, Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import Modal from '../components/Modal.jsx'
import { Avatar, Card, EmptyState, ErrorState, Page, PageHeader, Skeleton } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { initialsOf } from '../data/content.js'
import { api, useApi } from '../lib/api.js'
import { usd } from '../lib/utils.js'

const TABS = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'sessions', label: 'Live sessions', icon: Radio },
  { id: 'orders', label: 'Demo orders', icon: Receipt },
]

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const fmtDateTime = (d) => new Date(d).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Stat({ label, value, sub, icon: Icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-xs text-muted">{label}{Icon && <Icon className="h-4 w-4 text-emerald-400" />}</div>
      <div className="num mt-2 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </Card>
  )
}

function Overview({ data }) {
  const s = data.stats
  const total = Math.max(1, data.plans.reduce((n, p) => n + p.users, 0))
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Students" value={s.students} sub={`${s.new_7d} new this week`} icon={Users} />
        <Stat label="Active learners (7 days)" value={s.active_7d} icon={UserPlus} />
        <Stat label="Lessons completed" value={s.lessons_completed} icon={BookOpen} />
        <Stat label="Certificates issued" value={s.certificates} icon={Award} />
        <Stat label="Practice trades" value={s.trades} sub={`${s.open_positions} open now`} icon={CandlestickChart} />
        <Stat label="Session bookings" value={s.bookings} icon={Radio} />
        <Stat label="Demo orders" value={s.orders} icon={Receipt} />
        <Stat label="Demo revenue" value={usd(s.virtual_revenue)} sub="Virtual only, no real payments" icon={Crown} />
      </div>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Students by plan</h2>
        <div className="mt-5 space-y-4">
          {data.plans.map((p) => (
            <div key={p.id}>
              <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{p.name}</span><span className="num text-muted">{p.users} · {Math.round((p.users / total) * 100)}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-soft">
                <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${(p.users / total) * 100}%` }} transition={{ duration: 0.9 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Students({ data, me, reload }) {
  const { toast } = useApp()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return data.users.filter((u) => !s || u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
  }, [data.users, q])

  const patch = async (u, body, msg) => {
    setBusy(u.id)
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body })
      toast({ title: msg })
      await reload(true)
    } catch (err) {
      toast({ type: 'error', title: 'Update failed', message: err.message })
    } finally { setBusy(null) }
  }
  const remove = async () => {
    const u = confirm
    setBusy(u.id)
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' })
      toast({ title: 'Student deleted', message: `${u.email} and all their data were removed.` })
      setConfirm(null)
      await reload(true)
    } catch (err) {
      toast({ type: 'error', title: 'Delete failed', message: err.message })
    } finally { setBusy(null) }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Students <span className="num text-sm font-normal text-muted">({data.users.length})</span></h2>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="input !pl-10" aria-label="Search students" />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="p-5"><EmptyState icon={Users} title={q ? 'No students match that search' : 'No students yet'} message={q ? 'Try a different name or email.' : 'New sign-ups will appear here.'} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">{['Student', 'Plan', 'Lessons', 'Certs', 'Trades', 'Balance', 'Last active', 'Joined', 'Admin', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-soft">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initialsOf(u.full_name)} size={32} />
                      <div className="min-w-0"><div className="truncate font-semibold">{u.full_name}{u.id === me.id && <span className="ml-1.5 text-xs text-gold">(you)</span>}</div><div className="truncate text-xs text-muted">{u.email} · {u.experience_level}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.plan_id} disabled={busy === u.id} onChange={(e) => patch(u, { plan_id: Number(e.target.value) }, `${u.full_name} moved to ${data.plans.find((p) => p.id === Number(e.target.value))?.name}`)} className="input !w-28 !py-1.5 text-xs" aria-label={`Plan for ${u.email}`}>
                      {data.plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="num px-4 py-3">{u.lessons_done}</td>
                  <td className="num px-4 py-3">{u.certificates}</td>
                  <td className="num px-4 py-3">{u.trades}</td>
                  <td className="num px-4 py-3">{u.balance == null ? '—' : usd(u.balance)}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(u.last_active)}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <button disabled={busy === u.id || u.id === me.id} onClick={() => patch(u, { is_admin: !u.is_admin }, u.is_admin ? `Admin access removed from ${u.full_name}` : `${u.full_name} is now an admin`)}
                      className={`relative h-6 w-11 rounded-full transition ${u.is_admin ? 'bg-emerald-500' : 'bg-soft ring-1 ring-line'} disabled:opacity-50`} aria-label={`Admin access for ${u.email}`} aria-pressed={u.is_admin}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${u.is_admin ? 'left-[1.375rem]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {busy === u.id ? <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted" /> : u.id !== me.id && (
                      <button onClick={() => setConfirm(u)} className="rounded-lg p-1.5 text-muted hover:bg-rose-500/10 hover:text-rose-400" aria-label={`Delete ${u.email}`}><Trash2 className="h-4 w-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete this student?">
        {confirm && (
          <>
            <p className="text-sm text-muted">This permanently deletes <span className="font-semibold text-ink">{confirm.full_name}</span> ({confirm.email}) with all their progress, certificates, practice trades, bookings and demo orders. This can’t be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-sell" disabled={busy === confirm.id} onClick={remove}>{busy === confirm.id && <Loader2 className="h-4 w-4 animate-spin" />} Delete student</button>
            </div>
          </>
        )}
      </Modal>
    </Card>
  )
}

function Sessions({ data, reload }) {
  const { toast } = useApp()
  const [form, setForm] = useState({ title: '', mentor_name: '', start_time: '', duration_minutes: '45', capacity: '30', level: 'All levels', topic: '' })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const add = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/admin/sessions', { method: 'POST', body: { ...form, start_time: new Date(form.start_time).toISOString(), duration_minutes: Number(form.duration_minutes), capacity: Number(form.capacity) } })
      toast({ title: 'Session added', message: `${form.title} is now on the Live page.` })
      setForm((f) => ({ ...f, title: '', topic: '', start_time: '' }))
      await reload(true)
    } catch (err) {
      toast({ type: 'error', title: 'Couldn’t add session', message: err.message })
    } finally { setSaving(false) }
  }
  const remove = async () => {
    try {
      await api(`/admin/sessions/${confirm.id}`, { method: 'DELETE' })
      toast({ title: 'Session deleted' })
      setConfirm(null)
      await reload(true)
    } catch (err) {
      toast({ type: 'error', title: 'Delete failed', message: err.message })
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card className="overflow-hidden">
        <div className="border-b border-line p-5"><h2 className="text-lg font-semibold">Schedule <span className="num text-sm font-normal text-muted">({data.sessions.length})</span></h2></div>
        {data.sessions.length === 0 ? <div className="p-5"><EmptyState icon={Radio} title="No upcoming sessions" message="Add a session with the form." /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-line">{['Session', 'When', 'Booked', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => {
                  const past = new Date(s.start_time) < new Date()
                  return (
                    <tr key={s.id} className={`border-b border-line last:border-0 hover:bg-soft ${past ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3"><div className="font-semibold">{s.title}</div><div className="text-xs text-muted">{s.mentor_name} · {s.level} · {s.duration_minutes} min</div></td>
                      <td className="px-4 py-3 text-muted">{fmtDateTime(s.start_time)}{past && ' (past)'}</td>
                      <td className="px-4 py-3">
                        <div className="num text-xs">{s.seats_taken} / {s.capacity}</div>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-brand" style={{ width: `${(s.seats_taken / s.capacity) * 100}%` }} /></div>
                      </td>
                      <td className="px-4 py-3 text-right"><button onClick={() => setConfirm(s)} className="rounded-lg p-1.5 text-muted hover:bg-rose-500/10 hover:text-rose-400" aria-label={`Delete ${s.title}`}><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-gold" /><h2 className="text-lg font-semibold">Add a session</h2></div>
        <form onSubmit={add} className="mt-4 space-y-3">
          <div><label className="label" htmlFor="s-title">Title</label><input id="s-title" className="input" value={form.title} onChange={set('title')} required maxLength={120} placeholder="e.g. Gold Live Charting" /></div>
          <div><label className="label" htmlFor="s-mentor">Mentor</label><input id="s-mentor" className="input" value={form.mentor_name} onChange={set('mentor_name')} required maxLength={80} placeholder="e.g. Daniel Okafor" /></div>
          <div><label className="label" htmlFor="s-start">Starts</label><input id="s-start" type="datetime-local" className="input" value={form.start_time} onChange={set('start_time')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="s-dur">Minutes</label><input id="s-dur" type="number" min="10" max="480" className="input num" value={form.duration_minutes} onChange={set('duration_minutes')} required /></div>
            <div><label className="label" htmlFor="s-cap">Capacity</label><input id="s-cap" type="number" min="1" className="input num" value={form.capacity} onChange={set('capacity')} required /></div>
          </div>
          <div><label className="label" htmlFor="s-level">Level</label>
            <select id="s-level" className="input" value={form.level} onChange={set('level')}>{['All levels', 'Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}</select>
          </div>
          <div><label className="label" htmlFor="s-topic">Description</label><textarea id="s-topic" className="input min-h-20" value={form.topic} onChange={set('topic')} maxLength={300} placeholder="What students will learn" /></div>
          <button className="btn btn-primary w-full" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add session</button>
        </form>
      </Card>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete this session?">
        {confirm && (
          <>
            <p className="text-sm text-muted"><span className="font-semibold text-ink">{confirm.title}</span> and its {confirm.seats_taken} booking{confirm.seats_taken === 1 ? '' : 's'} will be removed.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-sell" onClick={remove}>Delete session</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

function Orders({ data }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-5"><h2 className="text-lg font-semibold">Demo orders <span className="text-sm font-normal text-muted">· virtual checkouts, no real payments</span></h2></div>
      {data.orders.length === 0 ? <div className="p-5"><EmptyState icon={Receipt} title="No demo orders yet" message="Plan switches through the demo checkout appear here." /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">{['Date', 'Order', 'Student', 'Plan', 'Billing', 'Amount'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.reference} className="border-b border-line last:border-0 hover:bg-soft">
                  <td className="px-4 py-3 text-muted">{fmtDateTime(o.created_at)}</td>
                  <td className="num px-4 py-3">{o.reference}</td>
                  <td className="px-4 py-3"><div className="font-medium">{o.full_name}</div><div className="text-xs text-muted">{o.email}</div></td>
                  <td className="px-4 py-3 font-semibold">{o.plan}</td>
                  <td className="px-4 py-3 capitalize text-muted">{o.billing_cycle}</td>
                  <td className="num px-4 py-3">{usd(o.amount)} <span className="text-xs text-amber-400">virtual</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default function Admin() {
  const { user } = useApp()
  const [tab, setTab] = useState('overview')
  const { data, error, loading, reload } = useApi(user?.is_admin ? '/admin' : null)

  if (!user?.is_admin) {
    return <EmptyState icon={ShieldCheck} title="Admins only" message="Your account doesn’t have access to the admin area." />
  }

  return (
    <Page className="space-y-6">
      <PageHeader eyebrow="Admin" title="Academy control room" subtitle="Students, live sessions, demo orders and platform stats. Practice platform: all money shown is virtual." />

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-soft p-1 sm:inline-flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`relative flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium sm:px-5 ${tab === id ? 'text-ink' : 'text-muted hover:text-ink'}`}>
            {tab === id && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-xl bg-panel-solid shadow ring-1 ring-line" />}
            <Icon className={`relative h-4 w-4 ${tab === id ? 'text-emerald-400' : ''}`} />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28 !rounded-3xl" />)}</div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {tab === 'overview' && <Overview data={data} />}
            {tab === 'students' && <Students data={data} me={user} reload={reload} />}
            {tab === 'sessions' && <Sessions data={data} reload={reload} />}
            {tab === 'orders' && <Orders data={data} />}
          </motion.div>
        </AnimatePresence>
      )}
    </Page>
  )
}
