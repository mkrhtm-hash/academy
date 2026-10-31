import { animate, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function StatCounter({ value, decimals = 0, suffix = '', prefix = '', compact = false, duration = 2, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setN })
    return () => controls.stop()
  }, [inView, value, duration])

  const text = compact
    ? Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
    : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return <span ref={ref} className={`num ${className}`}>{prefix}{text}{suffix}</span>
}
