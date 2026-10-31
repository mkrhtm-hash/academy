import { motion } from 'framer-motion'
import { Award, Download, Eye, GraduationCap, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/Logo.jsx'
import Modal from '../components/Modal.jsx'
import { Card, DynamicIcon, EmptyState, ErrorState, Page, PageHeader, PageSkeleton } from '../components/ui.jsx'
import { useApp } from '../context/AppContext.jsx'
import { badgeDefs, fmtMinutes } from '../data/content.js'
import { useApi } from '../lib/api.js'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

function certificateSvg(cert, name) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const c = cert.course
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1130" viewBox="0 0 1600 1130">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#f2c14e"/></linearGradient></defs>
  <rect width="1600" height="1130" fill="#070d18"/>
  <rect x="40" y="40" width="1520" height="1050" rx="36" fill="none" stroke="url(#g)" stroke-width="4"/>
  <rect x="64" y="64" width="1472" height="1002" rx="24" fill="none" stroke="#ffffff" stroke-opacity="0.08"/>
  <text x="800" y="200" text-anchor="middle" font-family="Space Grotesk, Arial" font-size="56" font-weight="700" fill="url(#g)">VaultEdge Academy</text>
  <text x="800" y="300" text-anchor="middle" font-family="Inter, Arial" font-size="26" letter-spacing="10" fill="#8a97ab">CERTIFICATE OF COMPLETION</text>
  <text x="800" y="420" text-anchor="middle" font-family="Inter, Arial" font-size="28" fill="#8a97ab">This certifies that</text>
  <text x="800" y="520" text-anchor="middle" font-family="Space Grotesk, Arial" font-size="84" font-weight="700" fill="#ffffff">${esc(name)}</text>
  <text x="800" y="610" text-anchor="middle" font-family="Inter, Arial" font-size="28" fill="#8a97ab">has successfully completed</text>
  <text x="800" y="700" text-anchor="middle" font-family="Space Grotesk, Arial" font-size="56" font-weight="700" fill="url(#g)">${esc(c.title)}</text>
  <text x="800" y="760" text-anchor="middle" font-family="Inter, Arial" font-size="24" fill="#8a97ab">${c.lessons_count} lessons · ${fmtMinutes(c.duration_minutes)} · ${esc(c.level)}</text>
  <line x1="300" y1="930" x2="660" y2="930" stroke="#ffffff" stroke-opacity="0.3"/>
  <line x1="940" y1="930" x2="1300" y2="930" stroke="#ffffff" stroke-opacity="0.3"/>
  <text x="480" y="970" text-anchor="middle" font-family="Inter, Arial" font-size="22" fill="#e9eef6">${esc(c.instructor_name)}</text>
  <text x="480" y="1004" text-anchor="middle" font-family="Inter, Arial" font-size="18" fill="#8a97ab">Instructor</text>
  <text x="1120" y="970" text-anchor="middle" font-family="Inter, Arial" font-size="22" fill="#e9eef6">${fmtDate(cert.issued_at)}</text>
  <text x="1120" y="1004" text-anchor="middle" font-family="Inter, Arial" font-size="18" fill="#8a97ab">Certificate ID ${esc(cert.code)}</text>
</svg>`
}

function CertificatePreview({ cert, name }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-[#070d18] p-6 text-center text-white sm:p-10">
      <div className="absolute inset-3 rounded-xl border border-white/10" />
      <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative">
        <div className="flex justify-center"><LogoMark size={44} /></div>
        <div className="mt-3 font-display text-xl font-bold text-gradient">VaultEdge Academy</div>
        <div className="mt-2 text-[0.65rem] tracking-[0.35em] text-white/50">CERTIFICATE OF COMPLETION</div>
        <div className="mt-6 text-sm text-white/60">This certifies that</div>
        <div className="mt-1 font-display text-3xl font-bold sm:text-4xl">{name}</div>
        <div className="mt-3 text-sm text-white/60">has successfully completed</div>
        <div className="mt-1 font-display text-xl font-semibold text-gradient sm:text-2xl">{cert.course.title}</div>
        <div className="mt-8 grid grid-cols-2 gap-6 text-xs text-white/60">
          <div className="border-t border-white/20 pt-2"><div className="text-white">{cert.course.instructor_name}</div>Instructor</div>
          <div className="border-t border-white/20 pt-2"><div className="num text-white">{cert.code}</div>Issued {fmtDate(cert.issued_at)}</div>
        </div>
      </div>
    </div>
  )
}

export default function Achievements() {
  const { user, toast, quizMaster } = useApp()
  const { data, error, loading, reload } = useApi('/dashboard')
  const [preview, setPreview] = useState(null)

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const certs = data.certificates
  const almost = data.my_courses.filter((c) => c.progress.pct < 100).sort((a, b) => b.progress.pct - a.progress.pct)
  const earned = [...data.badges, ...(quizMaster ? ['quiz-master'] : [])]
  const name = user.full_name

  const download = (cert) => {
    const blob = new Blob([certificateSvg(cert, name)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `VaultEdge-Certificate-${cert.course.slug}.svg`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast({ title: 'Certificate downloaded', message: `${cert.course.title} certificate saved to your downloads.` })
  }

  return (
    <Page className="space-y-10">
      <PageHeader eyebrow="Certificates & achievements" title="Your wall of progress" subtitle="Every certificate and badge represents real learning. Keep going, and the next one is closer than you think." />

      <section>
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><GraduationCap className="h-5 w-5 text-gold" /> Certificates <span className="num text-sm font-normal text-muted">({certs.length})</span></h2>
        {certs.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            message={almost.length ? `You're ${100 - almost[0].progress.pct}% away from finishing ${almost[0].title}. Complete every lesson to earn your first certificate.` : 'Complete every lesson in a course to earn your first certificate.'}
            action={almost.length ? <Link to={`/courses/${almost[0].slug}`} className="btn btn-primary">Continue {almost[0].title}</Link> : <Link to="/courses" className="btn btn-primary">Browse courses</Link>}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {certs.map((c, i) => (
              <motion.div key={c.code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card hover className="relative overflow-hidden p-6">
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand shadow-glow"><Award className="h-7 w-7 text-emerald-950" /></div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-gold">Certificate of completion</div>
                      <h3 className="mt-1 text-lg font-semibold">{c.course.title}</h3>
                      <div className="mt-1 text-sm text-muted">{c.course.lessons_count} lessons · {c.course.instructor_name}</div>
                      <div className="num mt-1 text-xs text-muted">ID {c.code} · {fmtDate(c.issued_at)}</div>
                    </div>
                  </div>
                  <div className="relative mt-5 flex gap-2">
                    <button onClick={() => setPreview(c)} className="btn btn-ghost flex-1"><Eye className="h-4 w-4" /> Preview</button>
                    <button onClick={() => download(c)} className="btn btn-primary flex-1"><Download className="h-4 w-4" /> Download</button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><Award className="h-5 w-5 text-emerald-400" /> Badges <span className="num text-sm font-normal text-muted">({earned.length}/{badgeDefs.length})</span></h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {badgeDefs.map((b, i) => {
            const on = earned.includes(b.id)
            return (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
                <Card hover={on} className={`flex h-full flex-col items-center p-5 text-center ${on ? '' : 'opacity-60'}`}>
                  <div className="relative">
                    <div className={`flex h-20 w-20 items-center justify-center rounded-full ${on ? '' : 'grayscale'}`} style={{ background: on ? `linear-gradient(135deg, ${b.hue[0]}, ${b.hue[1]})` : 'var(--soft)', boxShadow: on ? `0 10px 40px -10px ${b.hue[0]}` : 'none' }}>
                      <DynamicIcon name={b.icon} className={`h-9 w-9 ${on ? 'text-white drop-shadow' : 'text-muted'}`} />
                    </div>
                    {!on && <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-panel-solid ring-1 ring-line"><Lock className="h-3.5 w-3.5 text-muted" /></span>}
                  </div>
                  <div className="mt-4 text-sm font-semibold">{b.title}</div>
                  <div className="mt-1 text-xs text-muted">{b.desc}</div>
                  <div className={`mt-3 text-[0.7rem] font-semibold ${on ? 'text-emerald-400' : 'text-muted'}`}>{on ? 'Unlocked' : 'Locked'}</div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Certificate preview" size="max-w-2xl">
        {preview && (
          <>
            <CertificatePreview cert={preview} name={name} />
            <button onClick={() => download(preview)} className="btn btn-primary mt-5 w-full"><Download className="h-4 w-4" /> Download certificate</button>
          </>
        )}
      </Modal>
    </Page>
  )
}
