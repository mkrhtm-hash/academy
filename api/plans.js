import { randomBytes } from 'node:crypto'
import { loadUser, requireUserId, sessionUserId } from './_lib/auth.js'
import { db, num } from './_lib/db.js'
import { HttpError, body, route } from './_lib/http.js'

// Yearly billing is 20% off, charged as 12 discounted months. Calculated here, never trusted from the browser.
const yearlyMonthly = (monthly) => Math.round(monthly * 0.8)
export const amountFor = (monthly, cycle) => (cycle === 'yearly' ? yearlyMonthly(monthly) * 12 : monthly)

const orderJson = (o) => ({
  reference: o.reference,
  plan_name: o.plan_name,
  billing_cycle: o.billing_cycle,
  amount: num(o.amount),
  status: o.status,
  created_at: o.created_at,
})

export default route({
  // Public: plans for the Pricing page, plus the user's current plan and demo billing history when logged in.
  async GET(req) {
    const sql = db()
    const userId = await sessionUserId(req)
    const plans = await sql`SELECT * FROM plans ORDER BY price_monthly`
    const user = userId ? await loadUser(userId) : null
    const orders = user
      ? await sql`
          SELECT o.*, p.name AS plan_name FROM demo_orders o JOIN plans p ON p.id = o.plan_id
          WHERE o.user_id = ${user.id} ORDER BY o.created_at DESC LIMIT 5`
      : []
    return {
      plans: plans.map((p) => ({ id: p.id, name: p.name, price_monthly: num(p.price_monthly), features: p.features, is_popular: p.is_popular })),
      current_plan_id: user?.plan.id ?? null,
      orders: orders.map(orderJson),
    }
  },

  // Demo checkout: records a virtual order and switches the plan. No card data, no real payment.
  async POST(req) {
    const userId = await requireUserId(req)
    const { plan_id, billing_cycle = 'monthly' } = body(req)
    if (!['monthly', 'yearly'].includes(billing_cycle)) throw new HttpError(400, 'Choose monthly or yearly billing.')
    const sql = db()
    const id = Number(plan_id)
    const [plan] = await sql`SELECT * FROM plans WHERE id = ${Number.isInteger(id) ? id : 0}`
    if (!plan) throw new HttpError(400, 'Unknown plan.')
    const user = await loadUser(userId)
    if (user.plan.id === plan.id) throw new HttpError(409, `You’re already on the ${plan.name} plan.`)

    const amount = amountFor(num(plan.price_monthly), billing_cycle)
    const reference = `VE-ORD-${randomBytes(4).toString('hex').toUpperCase()}`
    const [, [order]] = await sql.transaction([
      sql`UPDATE users SET plan_id = ${plan.id} WHERE id = ${userId}`,
      sql`
        INSERT INTO demo_orders (user_id, plan_id, billing_cycle, amount, reference)
        VALUES (${userId}, ${plan.id}, ${billing_cycle}, ${amount}, ${reference})
        RETURNING *, ${plan.name}::text AS plan_name`,
    ])

    return { user: await loadUser(userId), order: orderJson(order), demo_checkout: true }
  },
})
