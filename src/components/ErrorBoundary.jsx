import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Log the real error and the component stack so the root cause is visible in the console.
    console.error('[VaultEdge] Unhandled UI error:', error)
    if (info?.componentStack) console.error('[VaultEdge] Component stack:', info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="glass max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-2xl">📉</div>
          <h2 className="text-xl font-semibold">Well, that was unexpected volatility.</h2>
          <p className="mt-2 text-sm text-muted">Something went wrong while loading this page. Your progress is saved, so a quick refresh usually sorts it out.</p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-rose-500/10 p-3 text-left text-xs text-rose-300">{String(this.state.error?.stack || this.state.error)}</pre>
          )}
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh page</button>
            <a className="btn btn-ghost" href="/dashboard">Go to dashboard</a>
          </div>
        </div>
      </div>
    )
  }
}
