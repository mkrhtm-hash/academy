import confetti from 'canvas-confetti'

export const cn = (...c) => c.filter(Boolean).join(' ')

export const usd = (n, digits = 2) =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const signedUsd = (n) => (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const compact = (n) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const BRAND = ['#10b981', '#34d399', '#f2c14e', '#ffe08a', '#ffffff']

export function celebrate(big = true) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const defaults = { colors: BRAND, zIndex: 9999, disableForReducedMotion: true }
  confetti({ ...defaults, particleCount: big ? 140 : 70, spread: 80, origin: { y: 0.65 } })
  if (big) {
    setTimeout(() => confetti({ ...defaults, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 250)
    setTimeout(() => confetti({ ...defaults, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 400)
  }
}

export function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
