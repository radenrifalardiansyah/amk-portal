import Navbar, { type NavLink } from '@/components/Navbar'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import RevealProvider from '@/components/RevealProvider'
import PageViewTracker from '@/components/PageViewTracker'
import { siteContentService, menuItemsService } from '@/lib/services'

export const revalidate = 300

// Menu-struktur id -> link publik. Hanya menu di sini yang tampil di navbar; urutannya ikut field `order` di menu_items.
const NAV_LINK_BY_ID: Record<string, NavLink> = {
  homepage: { label: 'Home', href: '/#home' },
  about: { label: 'About', href: '/about' },
  services: { label: 'Services', href: '/#services' },
  advantages: { label: 'Advantage', href: '/#advantage' },
  portfolio: { label: 'Portfolio', href: '/#portfolio' },
  gallery: { label: 'Gallery', href: '/#gallery' },
  teams: { label: 'Teams', href: '/#teams' },
  news: { label: 'News', href: '/#news' },
}

const DEFAULT_NAV_ORDER: Record<string, number> = {
  homepage: 1, about: 2, services: 3, advantages: 4, portfolio: 5, teams: 6, gallery: 8, news: 9,
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const [company, contact, menuItems] = await Promise.all([
    siteContentService.getCompany(),
    siteContentService.getContact(),
    menuItemsService.getAll(),
  ])

  const menuById = new Map(menuItems.map((m) => [m.id, m]))
  const navLinks = Object.keys(NAV_LINK_BY_ID)
    .filter((id) => menuById.get(id)?.showOnPortal !== false)
    .sort((a, b) => (menuById.get(a)?.order ?? DEFAULT_NAV_ORDER[a]) - (menuById.get(b)?.order ?? DEFAULT_NAV_ORDER[b]))
    .map((id) => NAV_LINK_BY_ID[id])

  return (
    <>
      <Navbar company={company} navLinks={navLinks} />
      <RevealProvider />
      <PageViewTracker />
      <div className="pt-[88px] md:pt-0 page-enter">
        {children}
      </div>
      <Footer company={company} waMessageTemplate={contact.waMessageTemplate} navLinks={navLinks} />
      <BackToTop />
    </>
  )
}
