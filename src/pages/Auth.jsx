import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, FlaskConical, Loader2, Lock, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import MarketBackground from '../components/MarketBackground.jsx'
import { useApp } from '../context/AppContext.jsx'
import { LEVELS } from '../data/content.js'

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard')

function Field({ icon: Icon, label, ...props }) {
  return (
    <div>
      <label className="label" htmlFor={props.id}>{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input !pl-10" {...props} />
      </div>
    </div>
  )
}

export default function Auth({ mode }) {
  const signup = mode === 'signup'
  const { user, authLoading, login, signup: register, toast } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const [form, setForm] = useState({ full_name: '', email: '', password: '', experience_level: 'Beginner' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (!authLoading && user && !busy) return <Navigate to={next} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (signup && form.password.length < 8) return setError('Password must be at least 8 characters.')
    setBusy(true)
    try {
      const u = signup ? await register(form) : await login(form.email, form.password)
      toast(signup
        ? { title: `Welcome, ${u.full_name.split(' ')[0]}! 🎉`, message: 'Your practice account has $10,000 in virtual funds.' }
        : { title: `Welcome back, ${u.full_name.split(' ')[0]}` })
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const other = `${signup ? '/login' : '/signup'}${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="absolute inset-0 -z-10">
        <div className="grid-bg absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <MarketBackground />
        <div className="absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-gold/15 blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="glass rounded-[2rem] p-7 shadow-glow sm:p-9">
          <h1 className="text-2xl font-bold sm:text-3xl">{signup ? 'Create your free account' : 'Welcome back'}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {signup ? 'Start learning and practise with $10,000 of virtual funds.' : 'Log in to continue your learning streak.'}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {signup && <Field icon={User} id="full_name" label="Full name" value={form.full_name} onChange={set('full_name')} autoComplete="name" placeholder="Alex Morgan" required maxLength={60} />}
            <Field icon={Mail} id="email" label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" required />
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input id="password" className="input !pl-10 !pr-11" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'At least 8 characters' : '••••••••'} required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {signup && (
              <div>
                <span className="label">Experience level</span>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-soft p-1" role="radiogroup" aria-label="Experience level">
                  {LEVELS.map((l) => (
                    <button key={l} type="button" role="radio" aria-checked={form.experience_level === l} onClick={() => setForm((f) => ({ ...f, experience_level: l }))}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${form.experience_level === l ? 'bg-panel-solid text-ink shadow ring-1 ring-emerald-500/30' : 'text-muted hover:text-ink'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">{error}</p>}

            <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3.5">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {signup ? 'Creating account…' : 'Logging in…'}</> : <>{signup ? 'Create account' : 'Log in'} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {signup ? 'Already have an account?' : 'New to VaultEdge?'}{' '}
            <Link to={other} className="font-semibold text-emerald-400 hover:underline">{signup ? 'Log in' : 'Create a free account'}</Link>
          </p>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <FlaskConical className="h-3.5 w-3.5 text-amber-400" /> Practice platform · virtual funds only · no real money or payments
        </p>
      </motion.div>
    </div>
  )
}
