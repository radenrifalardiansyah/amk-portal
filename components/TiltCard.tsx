'use client'

import { useRef } from 'react'

// Tilt is applied to an inner div, kept separate from the outer element (which
// carries reveal/stagger-item classes) — those use fill-forwards keyframe
// animations on `transform`, which would otherwise permanently override any
// transform this component sets via inline style on the same node.
export default function TiltCard({ children, className = '', style, max = 7 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
  }

  const onMouseLeave = () => {
    const el = ref.current
    if (el) el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
  }

  return (
    <div className={className} style={style}>
      <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} className="tilt-card h-full">
        {children}
      </div>
    </div>
  )
}
