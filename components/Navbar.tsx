'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { CompanyProfile } from '@/lib/services'

export interface NavLink {
  label: string
  href: string
}

export const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/#services' },
  { label: 'Portfolio', href: '/#portfolio' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Teams', href: '/#teams' },
  { label: 'News', href: '/#news' },
]

// Maps a standalone route's first path segment to the homepage section id it
// belongs to, so e.g. /portfolio/nippon still highlights the "Portfolio" link.
const SEGMENT_TO_SECTION: Record<string, string> = {
  services: 'services', portfolio: 'portfolio', gallery: 'gallery', news: 'news', clients: 'clients',
}

function useActiveSectionId(sectionIds: string[]) {
  const pathname = usePathname()
  const [scrolledId, setScrolledId] = useState('')
  const idsKey = sectionIds.join(',')

  useEffect(() => {
    if (pathname !== '/' || !idsKey) return
    const ids = idsKey.split(',')
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return

    // Tracks every section currently crossing a thin band just below the
    // fixed navbar; the one nearest the top of that band is "active". Using
    // IntersectionObserver (rather than polling scroll position) means the
    // active section is evaluated immediately on observe(), so it's already
    // correct right after an anchor jump — no reliance on a 'scroll' event
    // firing afterwards.
    const visibleTops = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleTops.set(entry.target.id, entry.boundingClientRect.top)
          else visibleTops.delete(entry.target.id)
        })
        if (visibleTops.size === 0) return
        let bestId = ''
        let bestTop = Infinity
        visibleTops.forEach((top, id) => {
          if (Math.abs(top) < bestTop) { bestTop = Math.abs(top); bestId = id }
        })
        setScrolledId(bestId)
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 },
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname, idsKey])

  if (pathname !== '/') {
    const firstSegment = pathname.split('/')[1] ?? ''
    return SEGMENT_TO_SECTION[firstSegment] ?? ''
  }
  return scrolledId
}

export default function Navbar({ company, navLinks = DEFAULT_NAV_LINKS }: { company?: CompanyProfile; navLinks?: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const logoUrl = company?.logoUrl || '/images/logo.png'
  const shortName = company?.shortName || 'AMK'
  const pathname = usePathname()

  const sectionIds = navLinks
    .filter((l) => l.href.includes('#'))
    .map((l) => l.href.split('#')[1])
  const activeSectionId = useActiveSectionId(sectionIds)

  const isActive = (link: NavLink) => {
    const [path, hash] = link.href.split('#')
    if (hash) return activeSectionId === hash
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const linkClassName = (link: NavLink, base: string) =>
    `${base} ${isActive(link) ? 'nav-link-active text-primary' : ''}`

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-[30px] shadow-[0_4px_30px_rgba(37,99,235,0.08)]">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-[#60a5fa] to-primary" />
        <div className="flex justify-between items-center w-full px-8 py-2 lg:py-2.5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center shrink-0 space-x-3 text-2xl font-bold tracking-tighter text-on-surface font-headline">
            <Image
              src={logoUrl}
              alt={`${shortName} Logo`}
              width={96}
              height={96}
              className="h-14 lg:h-16 xl:h-20 w-auto object-contain mix-blend-multiply -my-2 xl:-my-3"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-5 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClassName(link, 'nav-link font-headline tracking-[-0.04em] font-bold text-sm xl:text-base text-on-surface-variant hover:text-primary transition-all duration-500 ease-in-out')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/#contact"
            className="hidden lg:block shrink-0 font-headline tracking-[-0.04em] font-bold text-primary text-sm xl:text-base px-4 py-1.5 xl:px-6 xl:py-2 border border-primary/20 rounded-full hover:bg-primary hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500 ease-in-out"
          >
            Contact Us
          </Link>

          <button
            id="mobile-menu-btn"
            className="lg:hidden text-primary p-2"
            aria-label="Toggle mobile menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="material-symbols-outlined text-3xl transition-transform duration-300">
              {isOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-surface/95 backdrop-blur-xl transition-transform duration-500 ease-in-out lg:hidden flex flex-col justify-center items-center space-y-6 overflow-y-auto py-24 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            className={`text-3xl font-headline font-bold hover:text-primary transition-colors ${isActive(link) ? 'text-primary' : 'text-on-surface'}`}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/#contact"
          onClick={closeMenu}
          className="mt-4 px-8 py-4 bg-primary text-white font-headline font-bold rounded-full shadow-lg"
        >
          Contact Us
        </Link>
      </div>
    </>
  )
}
