import { motion } from 'framer-motion'
import { Check, Crown, FlaskConical, Minus, Receipt, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CheckoutModal from '../components/CheckoutModal.jsx'
import { Card, ErrorState, Page, Reveal, Skeleton } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { planComparison, planCopy } from '../data/content.js'
import { useApi } from '../lib/api.js'
import { usd } from '../lib/utils.js'

const yearlyOf = (monthly) => Math.round(monthly * 0.8)

export default function Pricing() {
  const [yearly, setYearly] = useState(true)
  const { user } = useApp()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useApi('/plans')
  const [checkout, setCheckout] = useState(null) // plan being bought
  const plans = data?.plans || []
  const current = user?.plan.id ?? null

  // Opens the demo checkout (review → virtual payment → receipt). Logged-out visitors sign up first.
  const choose = (plan) => {
    if (!user) return navigate('/signup?next=%2Fpricing')
    if (plan.id !== current) setCheckout(plan)
  }

  return (
    <Page className="space-y-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Pricing</div>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Invest in your <span className="text-gradient">skills</span> first</h1>
        <p className="mt-4 text-muted">Start free. Upgrade when you’re ready for the full library, live sessions and mentorship.</p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-line bg-soft p-1.5">
          {[['Monthly', false], ['Yearly', true]].map(([l, v]) => (
            <button key={l} onClick={() => setYearly(v)} className={`relative rounded-full px-5 py-2 text-sm font-semibold ${yearly === v ? 'text-emerald-950' : 'text-muted'}`}>
              {yearly === v && <motion.span layoutId="billing" className="absolute inset-0 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className="relative">{l}</span>
            </button>
          ))}
          <span className="mr-2 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold">Save 20%</span>
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {loading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[30rem] !rounded-[2rem]" />) : plans.map((p, i) => {
            const monthly = p.price_monthly
            const price = yearly ? yearlyOf(monthly) : monthly
            const isCurrent = current === p.id
            const copy = planCopy[p.name] || {}
            return (
              <Reveal key={p.id} delay={i * 0.08} className="h-full">
                <div className={`relative h-full rounded-[2rem] ${p.is_popular ? 'bg-gradient-to-b from-emerald-400 via-emerald-500/50 to-gold p-[1.5px] shadow-glow lg:-translate-y-4' : ''}`}>
                  {p.is_popular && (
                    <div className="absolute -top-3.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand px-4 py-1 text-xs font-bold text-emerald-950 shadow-lg">
                      <Sparkles className="h-3.5 w-3.5" /> Most Popular
                    </div>
                  )}
                  <Card className={`flex h-full flex-col p-7 ${p.is_popular ? '!rounded-[calc(2rem-1.5px)] !border-0 !bg-panel-solid' : '!rounded-[2rem]'}`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">{p.name}</h2>
                      {p.name === 'Elite' && <Crown className="h-5 w-5 text-gold" />}
                    </div>
                    <p className="mt-1 text-sm text-muted">{copy.tagline}</p>
                    <div className="mt-6 flex items-end gap-1">
                      <motion.span key={price} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="num text-5xl font-semibold">${price}</motion.span>
                      <span className="mb-1.5 text-sm text-muted">/month</span>
                    </div>
                    <div className="num mt-1 h-4 text-xs text-muted">{monthly > 0 && yearly ? `Billed $${yearlyOf(monthly) * 12} yearly · save $${(monthly - yearlyOf(monthly)) * 12}` : monthly > 0 ? 'Billed monthly' : 'Free forever'}</div>
                    <ul className="mt-6 space-y-3 text-sm">
                      {p.features.map((f) => <li key={f} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{f}</li>)}
                    </ul>
                    <div className="mt-auto pt-8">
                      <button onClick={() => choose(p)} disabled={isCurrent} className={`btn w-full !py-3 ${p.is_popular ? 'btn-primary' : 'btn-ghost'}`}>
                        {isCurrent ? 'Current plan' : copy.cta || `Choose ${p.name}`}
                      </button>
                      {!isCurrent && <div className="mt-2 flex items-center justify-center gap-1 text-[0.7rem] text-muted"><FlaskConical className="h-3 w-3 text-amber-400" /> Demo checkout · no payment taken</div>}
                    </div>
                  </Card>
                </div>
              </Reveal>
            )
          })}
        </div>
      )}

      {user && data?.orders?.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line p-6"><Receipt className="h-5 w-5 text-gold" /><h2 className="text-xl font-bold">Demo billing history</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr className="border-b border-line">{['Date', 'Order', 'Plan', 'Billing', 'Amount'].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.reference} className="border-b border-line last:border-0">
                    <td className="px-6 py-3 text-muted">{new Date(o.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</td>
                    <td className="num px-6 py-3">{o.reference}</td>
                    <td className="px-6 py-3 font-semibold">{o.plan_name}</td>
                    <td className="px-6 py-3 capitalize text-muted">{o.billing_cycle}</td>
                    <td className="num px-6 py-3">{usd(o.amount)} <span className="text-xs text-amber-400">virtual</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Reveal>
        <Card className="overflow-hidden">
          <div className="border-b border-line p-6"><h2 className="text-xl font-bold">Compare plans</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-6 py-4 font-medium text-muted">Feature</th>
                  {['Free', 'Pro', 'Elite'].map((n) => <th key={n} className={`px-6 py-4 text-center font-semibold ${n === 'Pro' ? 'text-emerald-400' : ''}`}>{n}</th>)}
                </tr>
              </thead>
              <tbody>
                {planComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-line last:border-0 hover:bg-soft">
                    <td className="px-6 py-4">{row.feature}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className={`px-6 py-4 text-center ${i === 1 ? 'bg-emerald-500/[0.04]' : ''}`}>
                        {v === true ? <Check className="mx-auto h-5 w-5 text-emerald-400" aria-label="Included" /> : v === false ? <Minus className="mx-auto h-5 w-5 text-muted/50" aria-label="Not included" /> : <span className="font-medium">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>

      <div className="flex flex-col items-center gap-2 text-center text-sm text-muted">
        <FlaskConical className="h-6 w-6 text-amber-400" />
        <p>VaultEdge is a practice platform. Choosing a plan is a demo checkout with a virtual payment. No real money is ever taken.</p>
      </div>

      <CheckoutModal
        key={checkout?.id ?? 'none'}
        plan={checkout}
        currentPlan={user?.plan}
        initialCycle={yearly ? 'yearly' : 'monthly'}
        onClose={() => setCheckout(null)}
        onComplete={() => reload(true)}
      />
    </Page>
  )
}
