'use client'

import { useEffect } from 'react'

export default function BackToTop() {
  useEffect(() => {
    const btn = document.getElementById('back-to-top')
    if (!btn) return

    const handleScroll = () => {
      if (window.scrollY > 600) {
        btn.classList.add('visible')
      } else {
        btn.classList.remove('visible')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      id="back-to-top"
      onClick={scrollToTop}
      aria-label="Kembali ke atas halaman"
      className="fixed bottom-10 right-10 z-[100] w-14 h-14 bg-primary text-surface rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
    >
      <span className="material-symbols-outlined font-bold group-hover:-translate-y-1 transition-transform">
        arrow_upward
      </span>
    </button>
  )
}
