import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, onDbStatus } from '../lib/api.js'
import { celebrate } from '../lib/utils.js'

const PREFS_KEY = 'vaultedge:v1'
const AppContext = createContext(null)

// Small per-browser conveniences only (theme, self-check quiz scores, personal goals).
// Everything that matters (progress, trades, bookings, plan) lives in the database.
function readLocal(key, fallback) {
  try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') } } catch { return fallback }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage blocked */ }
}

const defaultGoals = [
  { id: 'g1', text: 'Complete Risk Management Essentials', done: false },
  { id: 'g2', text: 'Study at least 30 minutes, 5 days a week', done: false },
  { id: 'g3', text: 'Place 20 disciplined practice trades', done: false },
]

export function AppProvider({ children }) {
  const [prefs, setPrefs] = useState(() => readLocal(PREFS_KEY, { theme: 'dark' }))
  const [toasts, setToasts] = useState([])
  const [celebration, setCelebration] = useState(null)
  const [auth, setAuth] = useState({ user: null, streak: 0, studiedToday: false, loading: true })
  const [local, setLocal] = useState({ quizScores: {}, goals: defaultGoals })
  const [dbDown, setDbDown] = useState(false)

  useEffect(() => onDbStatus(setDbDown), [])
  useEffect(() => writeLocal(PREFS_KEY, prefs), [prefs])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', prefs.theme === 'dark' ? '#050a13' : '#f3f6f9')
  }, [prefs.theme])

  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((ts) => [...ts, { id, type: 'success', ...t }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.duration || 4000)
  }, [])
  const dismissToast = useCallback((id) => setToasts((ts) => ts.filter((x) => x.id !== id)), [])

  // ---- auth ---------------------------------------------------------------
  const refreshMe = useCallback(async () => {
    try {
      const me = await api('/auth/me')
      setAuth({ user: me.user, streak: me.streak || 0, studiedToday: !!me.studied_today, loading: false })
      return me.user
    } catch {
      setAuth((a) => ({ ...a, loading: false }))
      return null
    }
  }, [])
  useEffect(() => { refreshMe() }, [refreshMe])

  const userKey = auth.user ? `vaultedge:user:${auth.user.id}` : null
  useEffect(() => { if (userKey) setLocal(readLocal(userKey, { quizScores: {}, goals: defaultGoals })) }, [userKey])
  const updateLocal = useCallback((fn) => setLocal((s) => {
    const next = { ...s, ...fn(s) }
    if (userKey) writeLocal(userKey, next)
    return next
  }), [userKey])

  const actions = useMemo(() => ({
    toggleTheme: () => setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' })),

    login: async (email, password) => {
      const { user } = await api('/auth/login', { method: 'POST', body: { email, password } })
      setAuth((a) => ({ ...a, user }))
      refreshMe()
      return user
    },
    signup: async (form) => {
      const { user } = await api('/auth/signup', { method: 'POST', body: form })
      setAuth({ user, streak: 0, studiedToday: false, loading: false })
      return user
    },
    logout: async () => {
      try { await api('/auth/logout', { method: 'POST' }) } finally {
        setAuth({ user: null, streak: 0, studiedToday: false, loading: false })
      }
    },
    setUser: (user) => setAuth((a) => ({ ...a, user })),
    setStreak: (streak, studiedToday) => setAuth((a) => ({ ...a, streak, studiedToday })),
    refreshMe,

    // A certificate was just issued by the server
    showCertificate: (cert) => { celebrate(true); setCelebration(cert) },

    saveQuiz: (key, score, total) => updateLocal((s) => {
      const prev = s.quizScores[key]
      return { quizScores: { ...s.quizScores, [key]: !prev || score >= prev.score ? { score, total } : prev } }
    }),
    setGoals: (fn) => updateLocal((s) => ({ goals: fn(s.goals) })),
  }), [refreshMe, updateLocal])

  const value = useMemo(() => ({
    state: { theme: prefs.theme, quizScores: local.quizScores, goals: local.goals },
    user: auth.user,
    authLoading: auth.loading,
    streak: auth.streak,
    studiedToday: auth.studiedToday,
    dbDown,
    ...actions,
    toast, toasts, dismissToast,
    celebration, closeCelebration: () => setCelebration(null),
    quizMaster: Object.values(local.quizScores).some((q) => q.score === q.total),
  }), [prefs.theme, local, auth, dbDown, actions, toast, toasts, dismissToast, celebration])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
