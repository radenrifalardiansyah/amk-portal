import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import RevealProvider from '@/components/RevealProvider'
import PageViewTracker from '@/components/PageViewTracker'
import { siteContentService } from '@/lib/services'

export const revalidate = 0

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const company = await siteContentService.getCompany()

  return (
    <>
      <Navbar company={company} />
      <RevealProvider />
      <PageViewTracker />
      <div className="pt-[88px] md:pt-0 page-enter">
        {children}
      </div>
      <Footer company={company} />
      <BackToTop />
    </>
  )
}
