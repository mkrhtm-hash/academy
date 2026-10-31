import { requireAdmin } from '../../_lib/auth.js'
import { db, num } from '../../_lib/db.js'
import { route } from '../../_lib/http.js'

// Admin overview: platform stats, every student, the session schedule and recent demo orders.
export default route({
  async GET(req) {
    await requireAdmin(req)
    const sql = db()
    const [[stats], plans, users, sessions, orders] = await sql.transaction([
      sql`
        SELECT
          (SELECT count(*) FROM users)::int AS students,
          (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')::int AS new_7d,
          (SELECT count(DISTINCT user_id) FROM activity_log WHERE activity_date >= current_date - 6)::int AS active_7d,
          (SELECT count(*) FROM lesson_progress WHERE completed)::int AS lessons_completed,
          (SELECT count(*) FROM certificates)::int AS certificates,
          (SELECT count(*) FROM positions)::int AS trades,
          (SELECT count(*) FROM positions WHERE status = 'open')::int AS open_positions,
          (SELECT count(*) FROM session_bookings)::int AS bookings,
          (SELECT count(*) FROM demo_orders)::int AS orders,
          (SELECT COALESCE(sum(amount), 0) FROM demo_orders) AS virtual_revenue`,
      sql`
        SELECT p.id, p.name, count(u.id)::int AS users
        FROM plans p LEFT JOIN users u ON u.plan_id = p.id
        GROUP BY p.id ORDER BY p.price_monthly`,
      sql`
        SELECT u.id, u.email, u.full_name, u.experience_level, u.created_at, u.is_admin, p.id AS plan_id, p.name AS plan,
          (SELECT count(*) FROM lesson_progress lp WHERE lp.user_id = u.id AND lp.completed)::int AS lessons_done,
          (SELECT count(*) FROM certificates c WHERE c.user_id = u.id)::int AS certificates,
          (SELECT count(*) FROM positions x WHERE x.user_id = u.id)::int AS trades,
          (SELECT count(*) FROM session_bookings b WHERE b.user_id = u.id)::int AS bookings,
          (SELECT max(activity_date) FROM activity_log a WHERE a.user_id = u.id)::text AS last_active,
          d.balance
        FROM users u JOIN plans p ON p.id = u.plan_id LEFT JOIN demo_accounts d ON d.user_id = u.id
        ORDER BY u.created_at DESC LIMIT 500`,
      sql`
        SELECT * FROM live_sessions
        WHERE start_time > now() - interval '2 days'
        ORDER BY start_time`,
      sql`
        SELECT o.reference, o.billing_cycle, o.amount, o.created_at, p.name AS plan, u.email, u.full_name
        FROM demo_orders o JOIN plans p ON p.id = o.plan_id JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 50`,
    ], { readOnly: true })

    return {
      stats: { ...stats, virtual_revenue: num(stats.virtual_revenue) },
      plans,
      users: users.map((u) => ({ ...u, balance: num(u.balance) })),
      sessions: sessions.map((s) => ({
        id: s.id, title: s.title, mentor_name: s.mentor_name, start_time: s.start_time, duration_minutes: s.duration_minutes,
        capacity: s.capacity, seats_taken: s.seats_taken, topic: s.topic, level: s.level,
      })),
      orders: orders.map((o) => ({ ...o, amount: num(o.amount) })),
    }
  },
})
