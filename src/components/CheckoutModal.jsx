import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Crown, FlaskConical, LayoutDashboard, Loader2, Radio, ShieldCheck, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../lib/api.js'
import { celebrate, usd } from '../lib/utils.js'
import Modal from './Modal.jsx'

const yearlyMonthly = (m) => Math.round(m * 0.8)
export const totalFor = (plan, cycle) => (cycle === 'yearly' ? yearlyMonthly(plan.price_monthly) * 12 : plan.price_monthly)

const STEPS = ['Review', 'Virtual payment', 'Done']

// What each plan opens up, so the receipt can point straight at the next step.
const unlocks = {
  Free: [{ icon: BookOpen, text: 'The 2 free foundation courses', to: '/courses', cta: 'Browse free courses' }],
  Pro: [
    { icon: BookOpen, text: 'All 8 courses and every lesson', to: '/courses/price-action-mastery', cta: 'Start Price Action Mastery' },
    { icon: Radio, text: 'All weekly live sessions', to: '/live', cta: 'Book a live session' },
  ],
  Elite: [
    { icon: BookOpen, text: 'All 8 courses and every lesson', to: '/courses/advanced-position-sizing', cta: 'Start Advanced Position Sizing' },
    { icon: Radio, text: 'All live sessions + mentor Q&A', to: '/live', cta: 'Book a live session' },
  ],
}

function Stepper({ step }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <span className={`num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i < step ? 'bg-brand text-emerald-950' : i === step ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-soft text-muted'}`}>
            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={`hidden text-xs font-medium sm:block ${i <= step ? 'text-ink' : 'text-muted'}`}>{s}</span>
          {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < step ? 'bg-emerald-500/60' : 'bg-line'}`} />}
        </div>
      ))}
    </div>
  )
}

/** Demo checkout: review → virtual payment → receipt. No card details are asked for and nothing is charged. */
export default function CheckoutModal({ plan, currentPlan, initialCycle = 'yearly', onClose, onComplete }) {
  const { setUser, toast } = useApp()
  const [step, setStep] = useState(0)
  const [cycle, setCycle] = useState(initialCycle)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const free = plan?.price_monthly === 0
  const total = plan ? totalFor(plan, cycle) : 0

  const pay = async () => {
    setBusy(true)
    setError('')
    try {
      await new Promise((r) => setTimeout(r, 900)) // a beat of "processing" so the step feels real
      const res = await api('/plans', { method: 'POST', body: { plan_id: plan.id, billing_cycle: cycle } })
      setUser(res.user)
      setOrder(res.order)
      setStep(2)
      if (!free) celebrate(true)
      onComplete?.(res.order)
    } catch (err) {
      setError(err.message)
      toast({ type: 'error', title: 'Demo checkout failed', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!plan} onClose={busy ? () => {} : onClose} title={step === 2 ? undefined : `Demo checkout · ${plan?.name ?? ''}`} size="max-w-lg">
      {plan && (
        <div>
          {step < 2 && <Stepper step={step} />}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="rounded-2xl border border-line bg-soft p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-semibold">{plan.name === 'Elite' && <Crown className="h-4 w-4 text-gold" />}{plan.name} plan</div>
                      <div className="text-xs text-muted">Switching from {currentPlan?.name || 'your current plan'}</div>
                    </div>
                    {!free && (
                      <div className="flex gap-1 rounded-xl border border-line bg-panel-solid p-1">
                        {['monthly', 'yearly'].map((c) => (
                          <button key={c} onClick={() => setCycle(c)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${cycle === c ? 'bg-brand text-emerald-950' : 'text-muted hover:text-ink'}`}>{c}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {plan.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{f}</li>)}
                  </ul>
                  <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
                    {!free && <div className="flex justify-between text-muted"><span>{cycle === 'yearly' ? `${usd(yearlyMonthly(plan.price_monthly), 0)}/month × 12` : 'Monthly price'}</span><span className="num">{usd(total)}</span></div>}
                    {!free && cycle === 'yearly' && <div className="flex justify-between text-emerald-400"><span>Yearly saving (20%)</span><span className="num">−{usd(plan.price_monthly * 12 - total)}</span></div>}
                    <div className="flex justify-between text-base font-semibold"><span>Total due today</span><span className="num">{usd(total)}</span></div>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><FlaskConical className="h-3.5 w-3.5 text-amber-400" /> Practice platform: this is a virtual checkout. No real money moves.</p>
                <div className="mt-6 flex justify-end gap-2">
                  <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => setStep(1)}>{free ? 'Continue' : 'Continue to virtual payment'} <ArrowRight className="h-4 w-4" /></button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="pay" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {free ? (
                  <div className="rounded-2xl border border-line bg-soft p-5 text-sm">
                    <div className="font-semibold">Switch to the Free plan</div>
                    <p className="mt-1 text-muted">Nothing to pay. Pro-only courses will be locked again, but your progress and certificates are kept.</p>
                  </div>
                ) : (
                  <>
                    <span className="label">Payment method</span>
                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.07] p-4 ring-1 ring-emerald-500/20">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand"><Wallet className="h-5 w-5 text-emerald-950" /></div>
                      <div className="flex-1">
                        <div className="font-semibold">VaultEdge virtual wallet</div>
                        <div className="text-xs text-muted">Demo credits only. No card details needed.</div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-soft px-4 py-3 text-sm">
                      <span className="text-muted">{plan.name} · {cycle}</span>
                      <span className="num text-lg font-semibold">{usd(total)}</span>
                    </div>
                  </>
                )}
                <p className="mt-3 flex items-start gap-1.5 text-xs text-muted"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> Demo checkout. No real payment is taken, and no card or bank details are collected or stored.</p>
                {error && <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">{error}</p>}
                <div className="mt-6 flex justify-between gap-2">
                  <button className="btn btn-ghost" disabled={busy} onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4" /> Back</button>
                  <button className="btn btn-primary" disabled={busy} onClick={pay}>
                    {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : free ? 'Confirm switch' : <>Pay {usd(total)} virtually</>}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && order && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-2 text-center">
                <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand shadow-glow">
                  <CheckCircle2 className="h-10 w-10 text-emerald-950" />
                </motion.div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{free ? 'Plan changed' : 'Virtual payment complete'}</div>
                <h3 className="mt-2 text-2xl font-bold">You’re on {order.plan_name}{free ? '' : ' 🎉'}</h3>

                <div className="mx-auto mt-5 max-w-sm space-y-1.5 rounded-2xl border border-line bg-soft p-4 text-left text-sm">
                  <div className="flex justify-between"><span className="text-muted">Order</span><span className="num">{order.reference}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Billing</span><span className="capitalize">{order.billing_cycle}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Paid</span><span className="num">{usd(order.amount)} <span className="text-xs text-amber-400">virtual</span></span></div>
                  <div className="flex justify-between"><span className="text-muted">Date</span><span>{new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                </div>

                <div className="mt-6 text-left">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Your next step</div>
                  <div className="mt-2 space-y-2">
                    {(unlocks[order.plan_name] || []).map(({ icon: Icon, text, to, cta }) => (
                      <Link key={to} to={to} onClick={onClose} className="flex items-center gap-3 rounded-2xl border border-line bg-soft p-3 transition hover:border-emerald-500/40">
                        <Icon className="h-5 w-5 shrink-0 text-emerald-400" />
                        <span className="flex-1 text-sm"><span className="block font-semibold">{cta}</span><span className="text-xs text-muted">Unlocked: {text}</span></span>
                        <ArrowRight className="h-4 w-4 text-muted" />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex justify-center gap-2">
                  <Link to="/dashboard" onClick={onClose} className="btn btn-ghost"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                  <button className="btn btn-primary" onClick={onClose}>Done</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Modal>
  )
}
