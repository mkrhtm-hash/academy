import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { PageSkeleton } from './ui.jsx'

/** Sends logged-out visitors to the login page, then back here afterwards. */
export default function RequireAuth({ children, to = '/login' }) {
  const { user, authLoading } = useApp()
  const location = useLocation()
  if (authLoading) return <PageSkeleton />
  if (!user) return <Navigate to={`${to}?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />
  return children
}
