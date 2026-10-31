import { motion } from 'framer-motion'
import { Award, GraduationCap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Modal from './Modal.jsx'

// Shown when the server issues a certificate for a completed course.
export default function CelebrationModal() {
  const { celebration, closeCelebration } = useApp()
  const navigate = useNavigate()
  return (
    <Modal open={!!celebration} onClose={closeCelebration} size="max-w-md">
      {celebration && (
        <div className="py-4 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-brand shadow-glow"
          >
            <GraduationCap className="h-12 w-12 text-emerald-950" />
          </motion.div>
          <div className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Course complete</div>
          <h3 className="mt-2 text-2xl font-bold">You did it! 🎉</h3>
          <p className="mt-2 text-muted">You completed <span className="font-semibold text-ink">{celebration.course.title}</span> and earned a VaultEdge certificate.</p>
          <div className="num mt-3 inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">ID {celebration.certificate_code}</div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button className="btn btn-primary" onClick={() => { closeCelebration(); navigate('/achievements') }}>
              <Award className="h-4 w-4" /> View certificate
            </button>
            <button className="btn btn-ghost" onClick={closeCelebration}>Keep learning</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
