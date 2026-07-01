'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
}

const configs = {
  success: { icon: 'check_circle', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', iconColor: '#22c55e' },
  error:   { icon: 'error',        bg: '#fef2f2', border: '#fecaca', text: '#dc2626', iconColor: '#ef4444' },
  info:    { icon: 'info',         bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', iconColor: '#2563eb' },
}

export default function Toast({ type, message, onClose }: ToastProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const c = configs[type]
  const toast = (
    <div className="fixed top-4 right-4 z-50">
      <div
        className="flex items-start gap-3 p-4 rounded-xl shadow-lg toast-enter max-w-sm"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}
      >
        <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5" style={{ color: c.iconColor }}>
          {c.icon}
        </span>
        <p className="flex-1 text-sm font-medium leading-relaxed" style={{ color: c.text }}>{message}</p>
        <button onClick={onClose} className="flex-shrink-0 text-[#94a3b8] hover:text-[#475569] transition-colors">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(toast, document.body)
}
