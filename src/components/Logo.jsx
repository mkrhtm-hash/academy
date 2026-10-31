import { useId } from 'react'
import { Link } from 'react-router-dom'

export function LogoMark({ size = 36 }) {
  const gid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0 drop-shadow-[0_6px_18px_rgba(16,185,129,0.45)]">
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#f2c14e" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#08111f" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="17.25" fill="none" stroke={`url(#${gid})`} strokeOpacity="0.5" strokeWidth="1.5" />
      <g fill={`url(#${gid})`} stroke={`url(#${gid})`} strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="34" x2="18" y2="50" />
        <rect x="13" y="37" width="10" height="9" rx="2" stroke="none" />
        <line x1="32" y1="22" x2="32" y2="45" />
        <rect x="27" y="26" width="10" height="13" rx="2" stroke="none" />
        <line x1="46" y1="11" x2="46" y2="35" />
        <rect x="41" y="15" width="10" height="15" rx="2" stroke="none" />
      </g>
    </svg>
  )
}

export default function Logo({ to = '/', compact = false }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5" aria-label="VaultEdge Academy home">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[1.2rem] font-bold tracking-tight text-gradient">VaultEdge</span>
          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-muted">Academy</span>
        </span>
      )}
    </Link>
  )
}
