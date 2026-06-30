'use client'

import { useEffect } from 'react'

export function useRevealObserver() {
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
  }, [])
}
