import { requireUserId } from '../../_lib/auth.js'
import { db } from '../../_lib/db.js'
import { route } from '../../_lib/http.js'
import { START_BALANCE, accountSummary, tick } from '../../_lib/market.js'

// Reset the practice account: remove all positions and restore the $10,000 virtual balance.
export default route({
  async POST(req) {
    const userId = await requireUserId(req)
    const sql = db()
    await sql.transaction([
      sql`DELETE FROM positions WHERE user_id = ${userId}`,
      sql`UPDATE demo_accounts SET balance = ${START_BALANCE}, equity = ${START_BALANCE} WHERE user_id = ${userId}`,
    ])
    return accountSummary(userId, await tick())
  },
})
