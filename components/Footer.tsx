import Link from 'next/link'
import Image from 'next/image'
import type { CompanyProfile } from '@/lib/services'
import { DEFAULT_NAV_LINKS, type NavLink } from '@/components/Navbar'

const InstagramIcon = () => (
  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.321 5.562a5.122 5.122 0 01-.443-.258 6.228 6.228 0 01-1.137-.966c-.849-.849-1.184-1.71-1.253-2.338h-3.514v14.032c0 .742-.303 1.412-.792 1.9a2.685 2.685 0 01-1.9.79 2.694 2.694 0 01-2.694-2.69 2.694 2.694 0 012.694-2.69c.276 0 .541.045.79.128V9.786a6.36 6.36 0 00-.79-.05A6.253 6.253 0 003.531 15.99a6.253 6.253 0 006.253 6.254 6.253 6.253 0 006.253-6.254V9.007a9.6 9.6 0 005.462 1.694V6.902a5.85 5.85 0 01-1.678-.34 5.7 5.7 0 01-.5-1z" />
  </svg>
)

const YouTubeIcon = () => (
  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
)

function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const local = digits.startsWith('62') ? `0${digits.slice(2)}` : digits
  return local.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export default function Footer({ company, waMessageTemplate, contactWaNumber, navLinks = DEFAULT_NAV_LINKS }: { company?: CompanyProfile; waMessageTemplate?: string; contactWaNumber?: string; navLinks?: NavLink[] }) {
  const logoUrl = company?.logoUrl || '/images/logo.png'
  const shortName = company?.shortName || 'AMK'
  const tagline = company?.tagline || 'Transformasi digital melalui kreativitas berbasis data. Kami hadir di Bogor untuk jangkauan global.'
  const waNumber = company?.waNumber || company?.phone || contactWaNumber || '6285155336838'
  const waHref = `https://wa.me/${waNumber}${waMessageTemplate ? `?text=${encodeURIComponent(waMessageTemplate)}` : ''}`
  const email = company?.email || 'adikaramandalakreasi@gmail.com'
  const copyrightText = company?.copyrightText || 'PT. Adikara Mandala Kreasi - All rights reserved.'
  const year = new Date().getFullYear()

  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/20 w-full py-12 px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto font-['Inter'] text-sm text-on-surface-variant">
        <div className="space-y-6 reveal-left">
          <div className="text-xl font-bold text-on-surface font-headline">
            <Image
              src={logoUrl}
              alt={`${shortName} Logo`}
              width={96}
              height={96}
              className="h-20 w-auto object-contain mix-blend-multiply"
            />
          </div>
          <p className="leading-relaxed">
            {tagline}
          </p>
          {company?.address && (
            <p className="leading-relaxed">{company.address}</p>
          )}
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary transition-opacity">{link.label}</Link>
            ))}
            <Link href="/#contact" className="hover:text-primary transition-opacity">Contact</Link>
            <br />
            {company?.instagramUrl && (
              <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-opacity flex items-center space-x-2">
                <InstagramIcon />
                <span>Instagram</span>
              </a>
            )}
            {company?.linkedinUrl && (
              <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={`Kunjungi LinkedIn ${shortName}`} className="hover:text-primary transition-opacity flex items-center space-x-2">
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>
            )}
            {company?.tiktokUrl && (
              <a href={company.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label={`Kunjungi TikTok ${shortName}`} className="hover:text-primary transition-opacity flex items-center space-x-2">
                <TikTokIcon />
                <span>TikTok</span>
              </a>
            )}
            {company?.youtubeUrl && (
              <a href={company.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Kunjungi YouTube ${shortName}`} className="hover:text-primary transition-opacity flex items-center space-x-2">
                <YouTubeIcon />
                <span>YouTube</span>
              </a>
            )}
          </div>
        </div>

        <div className="space-y-6 reveal">
          <h4 className="text-primary font-bold font-headline uppercase tracking-widest text-xs">Direct Contact</h4>
          <div className="space-y-4">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="block hover:text-primary transition-opacity">
              WhatsApp: {formatPhoneDisplay(waNumber)}
            </a>
            <a href={`mailto:${email}`} className="block hover:text-primary transition-opacity">
              Email: {email}
            </a>
          </div>
        </div>

        <div className="space-y-6 reveal-right">
          <h4 className="text-primary font-bold font-headline uppercase tracking-widest text-xs">Ready to innovate?</h4>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="magnetic-btn inline-flex items-center space-x-3 px-8 py-4 bg-[#25D366] text-white font-bold rounded-xl hover:scale-105 hover:bg-[#20b958] transition-all shadow-lg"
          >
            <WhatsAppIcon />
            <span>Hubungi via WhatsApp</span>
          </a>
          <p className="pt-8">
            Copyright &copy; {year} {copyrightText}{' '}
            <br />
            Powered by <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-primary">RMedia Solution</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
