'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useRevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
          }
        })
      },
      { root: null, threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )

    document
      .querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right')
      .forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [pathname])
}
