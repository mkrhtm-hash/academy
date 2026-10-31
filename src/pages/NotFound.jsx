import { TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, Page } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <Page className="py-10">
      <EmptyState
        icon={TrendingDown}
        title="404: this page has been stopped out"
        message="The page you’re looking for doesn’t exist or has moved. Let’s get you back on track."
        action={<div className="flex gap-2"><Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link><Link to="/" className="btn btn-ghost">Home</Link></div>}
      />
    </Page>
  )
}
