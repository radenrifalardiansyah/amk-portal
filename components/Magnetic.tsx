'use client'

import { cloneElement, isValidElement, type ReactElement } from 'react'
import { useMagnetic } from '@/hooks/useMagnetic'

export default function Magnetic({ children, strength = 0.3 }: { children: ReactElement; strength?: number }) {
  const ref = useMagnetic<HTMLElement>(strength)
  if (!isValidElement(children)) return children

  const props = children.props as { className?: string }
  return cloneElement(children, {
    ref,
    className: [props.className, 'magnetic-btn'].filter(Boolean).join(' '),
  } as Record<string, unknown>)
}
