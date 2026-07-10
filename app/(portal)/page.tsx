import { portfolioService, servicesService, advantagesService, leadersService, clientsService, siteContentService, keyPartnersService, newsService, galleryService } from '@/lib/services'
import HeroSection from '@/components/sections/HeroSection'
import AboutSection from '@/components/sections/AboutSection'
import ServicesSection from '@/components/sections/ServicesSection'
import AdvantageSection from '@/components/sections/AdvantageSection'
import PortfolioSection from '@/components/sections/PortfolioSection'
import GallerySection from '@/components/sections/GallerySection'
import TeamsSection from '@/components/sections/TeamsSection'
import NewsSection from '@/components/sections/NewsSection'
import ContactSection from '@/components/sections/ContactSection'
import ClientsSection from '@/components/sections/ClientsSection'

export const revalidate = 300

export default async function HomePage() {
  const [services, advantages, portfolioAll, leaders, partners, clients, hero, aboutHome, contact, newsAll, galleryAll] = await Promise.all([
    servicesService.getAll(),
    advantagesService.getAll(),
    portfolioService.getAll(),
    leadersService.getAll(),
    keyPartnersService.getAll(),
    clientsService.getAll(),
    siteContentService.getHero(),
    siteContentService.getAboutHome(),
    siteContentService.getContact(),
    newsService.getAllPublished(),
    galleryService.getAll(),
  ])

  const previews = portfolioAll.slice(0, 3)
  const newsPreviews = newsAll.slice(0, 3)
  const galleryPreviews = galleryAll.slice(0, 8)

  return (
    <>
      <HeroSection content={hero} />
      <AboutSection content={aboutHome} />
      <ServicesSection services={services} />
      <AdvantageSection advantages={advantages} />
      <PortfolioSection previews={previews} />
      <GallerySection previews={galleryPreviews} />
      <TeamsSection leaders={leaders} partners={partners} />
      <NewsSection previews={newsPreviews} />
      <ContactSection content={contact} />
      <ClientsSection clients={clients} />
    </>
  )
}
