import HeroSection from '@/components/sections/HeroSection'
import AboutSection from '@/components/sections/AboutSection'
import ServicesSection from '@/components/sections/ServicesSection'
import AdvantageSection from '@/components/sections/AdvantageSection'
import PortfolioSection from '@/components/sections/PortfolioSection'
import LeadershipSection from '@/components/sections/LeadershipSection'
import ContactSection from '@/components/sections/ContactSection'
import ClientsSection from '@/components/sections/ClientsSection'
import RevealProvider from '@/components/RevealProvider'

export default function HomePage() {
  return (
    <>
      <RevealProvider />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <AdvantageSection />
      <PortfolioSection />
      <LeadershipSection />
      <ContactSection />
      <ClientsSection />
    </>
  )
}
