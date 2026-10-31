// The one Vercel function behind every /api/* URL (vercel.json rewrites /api/<path> here as
// ?__path=<path>). Routing happens in api/_lib/router.js.
export { default } from './_lib/router.js'
