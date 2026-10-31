import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import CelebrationModal from './components/CelebrationModal.jsx'
import AppShell from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import ToastViewport from './components/Toast.jsx'
import { PageSkeleton } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'

const Auth = lazy(() => import('./pages/Auth.jsx'))
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const CourseDetail = lazy(() => import('./pages/CourseDetail.jsx'))
const LessonPlayer = lazy(() => import('./pages/LessonPlayer.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Simulator = lazy(() => import('./pages/Simulator.jsx'))
const Tools = lazy(() => import('./pages/Tools.jsx'))
const LiveSessions = lazy(() => import('./pages/LiveSessions.jsx'))
const Achievements = lazy(() => import('./pages/Achievements.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Pricing = lazy(() => import('./pages/Pricing.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

const auth = (el) => <RequireAuth>{el}</RequireAuth>

export default function App() {
  return (
    <>
      <Suspense fallback={<div className="mx-auto max-w-7xl p-6 lg:pl-72"><PageSkeleton /></div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route element={<AppShell />}>
            {/* public */}
            <Route path="/courses" element={<Catalog />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/learn/:courseId/:itemId" element={<LessonPlayer />} />
            <Route path="/pricing" element={<Pricing />} />
            {/* logged-in only */}
            <Route path="/dashboard" element={auth(<Dashboard />)} />
            <Route path="/simulator" element={auth(<Simulator />)} />
            <Route path="/tools" element={auth(<Tools />)} />
            <Route path="/live" element={auth(<LiveSessions />)} />
            <Route path="/achievements" element={auth(<Achievements />)} />
            <Route path="/profile" element={auth(<Profile />)} />
            <Route path="/admin" element={auth(<Admin />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastViewport />
      <CelebrationModal />
    </>
  )
}
