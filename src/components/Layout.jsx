import { AnimatePresence, motion } from 'framer-motion'
import {
  Award, BookOpen, CandlestickChart, Crown, DatabaseZap, Flame, Gem, GraduationCap, LayoutDashboard, LogIn, LogOut, Menu, Moon, Radio, ShieldCheck, Sun, User, Wrench, X,
} from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { initialsOf } from '../data/content.js'
import Modal from './Modal.jsx'
import Logo from './Logo.jsx'
import { Avatar, PageSkeleton, RISK_DISCLAIMER } from './ui.jsx'

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/simulator', label: 'Simulator', icon: CandlestickChart },
  { to: '/tools', label: 'Market Tools', icon: Wrench },
  { to: '/live', label: 'Live Sessions', icon: Radio },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/pricing', label: 'Pricing', icon: Gem },
]
const ADMIN_NAV = { to: '/admin', label: 'Admin', icon: ShieldCheck }
const navFor = (user) => (user?.is_admin ? [...NAV, ADMIN_NAV] : NAV)

export function ThemeToggle() {
  const { state, toggleTheme } = useApp()
  const dark = state.theme === 'dark'
  return (
    <button onClick={toggleTheme} className="btn btn-ghost !h-10 !w-10 !rounded-xl !p-0" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? 'm' : 's'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
          {dark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px] text-amber-500" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export function useLogout() {
  const { logout, toast } = useApp()
  const navigate = useNavigate()
  return async () => {
    await logout()
    toast({ type: 'info', title: 'Logged out', message: 'See you next session.' })
    navigate('/')
  }
}

/** Name, plan and logout button, used in both navbars. */
export function UserMenu({ compact = false }) {
  const { user } = useApp()
  const onLogout = useLogout()
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="btn btn-ghost btn-sm"><LogIn className="h-3.5 w-3.5" /> Log in</Link>
        {!compact && <Link to="/signup" className="btn btn-primary btn-sm hidden sm:inline-flex">Sign up free</Link>}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <Link to="/profile" className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-soft" aria-label="Profile">
        <Avatar initials={initialsOf(user.full_name)} size={34} />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold leading-tight">{user.full_name}</span>
          <span className="block text-[0.7rem] text-gold">{user.plan.name} plan</span>
        </span>
      </Link>
      <button onClick={onLogout} className="btn btn-ghost !h-10 !w-10 !rounded-xl !p-0" aria-label="Log out" title="Log out">
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}

export function DbBanner() {
  const { dbDown } = useApp()
  if (!dbDown) return null
  return (
    <div role="alert" className="flex items-center justify-center gap-2 border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-center text-xs font-medium text-rose-300 sm:text-sm">
      <DatabaseZap className="h-4 w-4 shrink-0" /> We can’t reach the server or database right now. Your data is safe. We’ll keep retrying.
    </div>
  )
}

function Sidebar() {
  const { user, streak } = useApp()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-panel/70 px-4 py-6 backdrop-blur-xl lg:flex">
      <div className="px-2"><Logo /></div>
      <nav className="mt-10 flex-1 space-y-1">
        {navFor(user).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'text-ink' : 'text-muted hover:bg-soft hover:text-ink'}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-amber-400/5 ring-1 ring-emerald-500/30" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <Icon className={`relative h-[18px] w-[18px] ${isActive ? 'text-emerald-400' : ''}`} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3">
        {user && (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-soft p-3">
            <Flame className="animate-flicker h-7 w-7 text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.6)]" />
            <div>
              <div className="num text-lg font-semibold leading-none">{streak} {streak === 1 ? 'day' : 'days'}</div>
              <div className="text-xs text-muted">Learning streak</div>
            </div>
          </div>
        )}
        {!user && (
          <Link to="/signup" className="block overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-amber-400/20 p-4 ring-1 ring-emerald-500/25 transition hover:ring-emerald-400/50">
            <div className="flex items-center gap-2 text-sm font-semibold"><GraduationCap className="h-4 w-4 text-gold" /> Create a free account</div>
            <p className="mt-1 text-xs text-muted">Track progress, earn certificates and practise with $10,000 virtual funds.</p>
          </Link>
        )}
        {user?.plan.name === 'Free' && (
          <Link to="/pricing" className="block overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-amber-400/20 p-4 ring-1 ring-emerald-500/25 transition hover:ring-emerald-400/50">
            <div className="flex items-center gap-2 text-sm font-semibold"><Crown className="h-4 w-4 text-gold" /> Upgrade to Pro</div>
            <p className="mt-1 text-xs text-muted">Unlock every course, all live sessions and certificates.</p>
          </Link>
        )}
      </div>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/70 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="hidden items-center gap-2 text-sm text-muted lg:flex">
          <GraduationCap className="h-4 w-4 text-emerald-400" />
          <span>VaultEdge Academy</span>
          <span className="text-line">/</span>
          <span className="text-ink">Learn. Practise. Master.</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
      <DbBanner />
    </header>
  )
}

function BottomNav() {
  const { user } = useApp()
  const [more, setMore] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => setMore(false), [location.pathname])
  const main = NAV.slice(0, 4).map((n) => (n.to === '/tools' ? NAV[4] : n)) // Dashboard, Courses, Simulator, Live
  const rest = navFor(user).filter((n) => !main.includes(n))
  const restActive = rest.some((n) => location.pathname.startsWith(n.to))

  return (
    <>
      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-line bg-panel-solid/85 px-1 py-1.5 shadow-2xl backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-5">
          {main.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.65rem] font-medium ${isActive ? 'text-emerald-400' : 'text-muted'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="bnav" className="absolute inset-0 rounded-xl bg-emerald-500/12" />}
                  <Icon className="relative h-5 w-5" />
                  <span className="relative">{label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.65rem] font-medium ${restActive ? 'text-emerald-400' : 'text-muted'}`}>
            <Menu className="h-5 w-5" /> More
          </button>
        </div>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title="More">
        <div className="grid grid-cols-2 gap-3">
          {rest.map(({ to, label, icon: Icon }) => (
            <button key={to} onClick={() => navigate(to)} className="flex items-center gap-3 rounded-2xl border border-line bg-soft p-4 text-left text-sm font-medium hover:border-emerald-500/40">
              <Icon className="h-5 w-5 text-emerald-400" /> {label}
            </button>
          ))}
          <Link to="/" className="flex items-center gap-3 rounded-2xl border border-line bg-soft p-4 text-sm font-medium hover:border-emerald-500/40">
            <GraduationCap className="h-5 w-5 text-gold" /> Home page
          </Link>
        </div>
      </Modal>
    </>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm text-muted">VaultEdge Academy is a financial markets learning platform. Learn with structure, practise without risk and grow with a community of disciplined traders.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <div className="font-semibold">Learn</div>
              <Link to="/courses" className="block text-muted hover:text-ink">Courses</Link>
              <Link to="/live" className="block text-muted hover:text-ink">Live sessions</Link>
              <Link to="/achievements" className="block text-muted hover:text-ink">Certificates</Link>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Practise</div>
              <Link to="/simulator" className="block text-muted hover:text-ink">Simulator</Link>
              <Link to="/tools" className="block text-muted hover:text-ink">Market tools</Link>
              <Link to="/tools#glossary" className="block text-muted hover:text-ink">Glossary</Link>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Company</div>
              <Link to="/pricing" className="block text-muted hover:text-ink">Pricing</Link>
              <span className="block text-muted">Careers</span>
              <span className="block text-muted">Contact</span>
            </div>
          </div>
        </div>
        <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">Risk disclaimer: </span>{RISK_DISCLAIMER}
        </div>
        <div className="mt-6 flex flex-col justify-between gap-2 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} VaultEdge Academy. All rights reserved.</span>
          <span>Made for learners, not gamblers.</span>
        </div>
      </div>
    </footer>
  )
}

export default function AppShell() {
  const { pathname } = useLocation()
  const { user } = useApp()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <Suspense fallback={<PageSkeleton />}>
            {/* remount pages when the signed-in user changes so their data reloads */}
            <div key={user?.id ?? 'guest'}><Outlet /></div>
          </Suspense>
        </main>
        <div className="pb-24 lg:pb-0"><Footer /></div>
      </div>
      <BottomNav />
    </div>
  )
}

export function MarketingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', on)
    return () => window.removeEventListener('scroll', on)
  }, [])
  const { user } = useApp()
  const dashTo = user ? '/dashboard' : '/signup?next=%2Fdashboard'
  const links = [['Courses', '/courses'], ['Simulator', '/simulator'], ['Live', '/live'], ['Tools', '/tools'], ['Pricing', '/pricing']]
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? 'border-b border-line bg-canvas/75 backdrop-blur-xl' : ''}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([l, to]) => <Link key={to} to={to} className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-ink">{l}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? <span className="hidden md:block"><UserMenu /></span> : <Link to="/login" className="btn btn-ghost btn-sm hidden md:inline-flex">Log in</Link>}
          <Link to={dashTo} className="btn btn-primary btn-sm hidden sm:inline-flex">Open dashboard</Link>
          <button onClick={() => setOpen(!open)} className="btn btn-ghost !h-10 !w-10 !rounded-xl !p-0 md:hidden" aria-label="Menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      <DbBanner />
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-line bg-canvas/95 backdrop-blur-xl md:hidden">
            <div className="space-y-1 px-4 py-3">
              {links.map(([l, to]) => <Link key={to} to={to} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-soft">{l}</Link>)}
              {!user && <Link to="/login" className="block rounded-xl px-3 py-2.5 font-medium hover:bg-soft">Log in</Link>}
              <Link to={dashTo} className="btn btn-primary mt-2 w-full">Open dashboard</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
