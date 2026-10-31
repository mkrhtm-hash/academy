import { endSession } from '../../_lib/auth.js'
import { route } from '../../_lib/http.js'

export default route({
  async POST(req, res) {
    endSession(res)
    return { ok: true }
  },
})
