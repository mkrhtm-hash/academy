// Makes sure .env exists and has the two variables the API needs.
// - JWT_SECRET is generated automatically if missing.
// - DATABASE_URL defaults to the local database (scripts/local-db.js). Replace it with your Neon
//   connection string whenever you want to use Neon instead.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { LOCAL_URL } from './local-db.js'

const envPath = fileURLToPath(new URL('../.env', import.meta.url))

let text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
const get = (key) => text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')
const set = (key, value) => {
  const line = `${key}=${value}`
  text = new RegExp(`^${key}=.*$`, 'm').test(text)
    ? text.replace(new RegExp(`^${key}=.*$`, 'm'), line)
    : `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`
}

let changed = false
if (!get('DATABASE_URL')) {
  set('DATABASE_URL', LOCAL_URL)
  changed = true
  console.log('✔ No DATABASE_URL found, so using the local database on this computer (port 5433).')
}
if (!get('JWT_SECRET')) {
  set('JWT_SECRET', randomBytes(48).toString('base64url'))
  changed = true
  console.log('✔ Generated a new random JWT_SECRET in .env')
}
if (changed) writeFileSync(envPath, text)
