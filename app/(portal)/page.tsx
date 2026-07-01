import { portfolioService, servicesService, advantagesService, leadersService, clientsService, siteContentService } from '@/lib/services'
import HeroSection from '@/components/sections/HeroSection'
import AboutSection from '@/components/sections/AboutSection'
import ServicesSection from '@/components/sections/ServicesSection'
import AdvantageSection from '@/components/sections/AdvantageSection'
import PortfolioSection from '@/components/sections/PortfolioSection'
import LeadershipSection from '@/components/sections/LeadershipSection'
import ContactSection from '@/components/sections/ContactSection'
import ClientsSection from '@/components/sections/ClientsSection'

export const revalidate = 0

export default async function HomePage() {
  const [services, advantages, portfolioAll, leaders, clients, hero, aboutHome, contact] = await Promise.all([
    servicesService.getAll(),
    advantagesService.getAll(),
    portfolioService.getAll(),
    leadersService.getAll(),
    clientsService.getAll(),
    siteContentService.getHero(),
    siteContentService.getAboutHome(),
    siteContentService.getContact(),
  ])

  const previews = portfolioAll.slice(0, 3)

  return (
    <>
      <HeroSection content={hero} />
      <AboutSection content={aboutHome} />
      <ServicesSection services={services} />
      <AdvantageSection advantages={advantages} />
      <PortfolioSection previews={previews} />
      <LeadershipSection leaders={leaders} />
      <ContactSection content={contact} />
      <ClientsSection clients={clients} />
    </>
  )
}
