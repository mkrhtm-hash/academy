import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Award, CheckCircle2, Info, X } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const styles = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-300' },
  error: { icon: AlertTriangle, color: 'text-rose-400', bar: 'from-rose-500 to-rose-300' },
  info: { icon: Info, color: 'text-sky-400', bar: 'from-sky-500 to-sky-300' },
  badge: { icon: Award, color: 'text-gold', bar: 'from-emerald-400 to-gold' },
}

export default function ToastViewport() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:top-auto sm:bottom-5 sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const s = styles[t.type] || styles.success
          const Icon = s.icon
          return (
            <motion.div
              key={t.id} layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="glass pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl !bg-panel-solid/95 p-4 pr-10"
              role="status"
            >
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${s.bar}`} />
              <div className="flex gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.color}`} />
                <div>
                  <div className="text-sm font-semibold">{t.title}</div>
                  {t.message && <div className="mt-0.5 text-xs text-muted">{t.message}</div>}
                </div>
              </div>
              <button onClick={() => dismissToast(t.id)} className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:bg-soft hover:text-ink" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
