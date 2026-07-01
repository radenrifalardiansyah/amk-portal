import Link from 'next/link'
import Image from 'next/image'
import type { AboutHomeContent } from '@/lib/services'

export default function AboutSection({ content }: { content: AboutHomeContent }) {
  return (
    <section className="py-24 bg-surface-container-lowest relative reveal" id="about">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8 reveal-left">
            <h2 className="text-4xl font-headline font-bold text-primary">{content.heading}</h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              {content.paragraph}
            </p>
            <Link
              href="/about"
              className="inline-flex items-center space-x-2 text-primary font-headline font-bold hover:underline group"
            >
              <span>Learn More About Us</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_right_alt
              </span>
            </Link>

            <div className="p-8 bg-surface rounded-2xl border border-outline-variant/10 space-y-4">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary text-3xl">verified</span>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">Nomor Induk Berusaha</p>
                  <p className="text-xl font-bold font-headline text-primary">{content.nib}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">Headquarters</p>
                  <p className="text-lg font-medium text-on-surface">
                    {content.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 h-full reveal-right">
            <div className="space-y-4 mt-8">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="rounded-2xl h-64 w-full object-cover reveal-scale"
              >
                <source src={content.videoSrc} type="video/mp4" />
              </video>
              <div className="bg-primary-container/10 p-6 rounded-2xl border border-primary/20 reveal-scale">
                <p className="text-4xl font-bold text-primary font-headline">{content.stat1Value}</p>
                <p className="text-sm text-on-surface-variant">{content.stat1Label}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-surface-container-highest p-6 rounded-2xl reveal-scale">
                <p className="text-4xl font-bold text-primary font-headline">{content.stat2Value}</p>
                <p className="text-sm text-on-surface-variant">{content.stat2Label}</p>
              </div>
              <div className="relative h-80 rounded-2xl overflow-hidden reveal-scale">
                <Image
                  src={content.teamImage}
                  alt="Team Work"
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
