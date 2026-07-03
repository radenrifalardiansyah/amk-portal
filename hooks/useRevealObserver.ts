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

    const REVEAL_SELECTOR = '.reveal, .reveal-scale, .reveal-left, .reveal-right'

    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el))

    // Content swapped in later (e.g. client-side filtering) needs to be picked up too,
    // since the query above only sees elements present at mount time.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          if (node.matches(REVEAL_SELECTOR)) observer.observe(node)
          node.querySelectorAll?.(REVEAL_SELECTOR).forEach((el) => observer.observe(el))
        })
      })
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [pathname])
}
