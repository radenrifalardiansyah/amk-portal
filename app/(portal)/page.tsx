import {
  portfolioService, servicesService, advantagesService, leadersService, clientsService, siteContentService,
  keyPartnersService, newsService, galleryService, menuItemsService, heroSlidesService,
} from '@/lib/services'
import HeroSection from '@/components/sections/HeroSection'
import ProjectShowcaseSlider from '@/components/sections/ProjectShowcaseSlider'
import VisionMissionSection from '@/components/sections/VisionMissionSection'
import ServicesSection from '@/components/sections/ServicesSection'
import AdvantageSection from '@/components/sections/AdvantageSection'
import PortfolioSection from '@/components/sections/PortfolioSection'
import GallerySection from '@/components/sections/GallerySection'
import TeamsSection from '@/components/sections/TeamsSection'
import NewsSection from '@/components/sections/NewsSection'
import ContactSection from '@/components/sections/ContactSection'
import ClientsSection from '@/components/sections/ClientsSection'
import FaqSchema from '@/components/sections/FaqSchema'

export const revalidate = false

// Fallback urutan (mengikuti nilai order default di menu_items) jika menu item belum di-seed/dihapus.
const DEFAULT_SECTION_ORDER: Record<string, number> = {
  services: 3, advantages: 4, portfolio: 5, teams: 6, clients: 7, gallery: 8, news: 9,
}

export default async function HomePage() {
  const [
    services, advantages, portfolioAll, leaders, partners, clients, hero, heroSlides, aboutPage, contact,
    servicesSection, advantageSection, portfolioSection, teamsSection, clientsSection, gallerySection, newsSection,
    newsAll, galleryAll, menuItems, company,
  ] = await Promise.all([
    servicesService.getAll(),
    advantagesService.getAll(),
    portfolioService.getAllPublished(),
    leadersService.getAll(),
    keyPartnersService.getAll(),
    clientsService.getAll(),
    siteContentService.getHero(),
    heroSlidesService.getAll(),
    siteContentService.getAboutPage(),
    siteContentService.getContact(),
    siteContentService.getServicesSection(),
    siteContentService.getAdvantageSection(),
    siteContentService.getPortfolioSection(),
    siteContentService.getTeamsSection(),
    siteContentService.getClientsSection(),
    siteContentService.getGallerySection(),
    siteContentService.getNewsSection(),
    newsService.getAllPublished(),
    galleryService.getAll(),
    menuItemsService.getAll(),
    siteContentService.getCompany(),
  ])

  const previews = portfolioAll.slice(0, 3)
  const newsPreviews = newsAll.slice(0, 3)
  const galleryPreviews = galleryAll.slice(0, 8)

  const menuById = new Map(menuItems.map((m) => [m.id, m]))
  const orderOf = (id: string) => menuById.get(id)?.order ?? DEFAULT_SECTION_ORDER[id]

  const sections = [
    { id: 'services', node: <ServicesSection key="services" services={services} content={servicesSection} /> },
    { id: 'advantages', node: <AdvantageSection key="advantages" advantages={advantages} content={advantageSection} /> },
    { id: 'portfolio', node: <PortfolioSection key="portfolio" previews={previews} content={portfolioSection} clients={clients} /> },
    { id: 'gallery', node: <GallerySection key="gallery" previews={galleryPreviews} content={gallerySection} /> },
    { id: 'news', node: <NewsSection key="news" previews={newsPreviews} content={newsSection} /> },
    { id: 'teams', node: <TeamsSection key="teams" leaders={leaders} partners={partners} content={teamsSection} /> },
    { id: 'clients', node: <ClientsSection key="clients" clients={clients} content={clientsSection} /> },
  ]
    .filter((s) => menuById.get(s.id)?.showOnPortal !== false)
    .sort((a, b) => orderOf(a.id) - orderOf(b.id))

  return (
    <>
      <FaqSchema services={services} company={company} />
      <ProjectShowcaseSlider slides={heroSlides} />
      <HeroSection content={hero} hasSlidesAbove={heroSlides.length > 0} />
      {/* <VisionMissionSection content={aboutPage} /> */}
      {sections.map((s) => s.node)}
      <ContactSection content={contact} />
    </>
  )
}
