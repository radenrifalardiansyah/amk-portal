'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { analyticsService } from '@/lib/services'

const MOBILE_UA = /android|iphone|ipad|ipod|mobile|iemobile|opera mini/i

export default function PageViewTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname
    const device = MOBILE_UA.test(navigator.userAgent) ? 'mobile' : 'desktop'
    analyticsService.track({ path: pathname, device }).catch(() => {})
  }, [pathname])

  return null
}
