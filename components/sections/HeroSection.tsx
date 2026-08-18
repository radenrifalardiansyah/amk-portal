'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import VideoCoverThumb from '@/components/VideoCoverThumb'
import Magnetic from '@/components/Magnetic'
import type { HeroContent } from '@/lib/services'

export default function HeroSection({ content, hasSlidesAbove = false }: { content: HeroContent; hasSlidesAbove?: boolean }) {
  // Ketika ProjectShowcaseSlider (hero_slides) tampil di atas, ia yang punya id="home".
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden scroll-mt-8" id={hasSlidesAbove ? undefined : 'home'}>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(7,82,183,0.08),transparent_70%)] animate-fluid" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 reveal-left active order-2 lg:order-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-outline-variant/30 bg-surface-container-low/50">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest uppercase text-on-surface-variant">
              {content.badge}
            </span>
          </div>

          <h1 className="font-headline font-bold tracking-[-0.04em] text-primary leading-[0.9] flex flex-col">
            <span className={content.titleLine1Size}>{content.titleLine1}</span>
            <span className={content.titleLine2Size}>{content.titleLine2}</span>
            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container ${content.titleLine3Size}`}>
              {content.titleLine3}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed font-body">
            {content.description}
          </p>

          <div className="flex items-center space-x-6 pt-4">
            <Magnetic strength={0.4}>
              <Link
                href={content.primaryCtaHref}
                className="btn-pulse px-8 py-4 hero-gradient text-on-primary font-headline font-extrabold text-lg rounded-xl hover:scale-105 transition-all duration-300 relative overflow-hidden flex items-center justify-center"
              >
                <div className="shine-sweep" />
                <span className="relative z-10">{content.primaryCtaLabel}</span>
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link href={content.secondaryCtaHref} className="group flex items-center space-x-3 text-primary font-headline font-bold">
                <span>{content.secondaryCtaLabel}</span>
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </Magnetic>
          </div>
        </div>

        <div className="block relative reveal-right active order-1 lg:order-2">
          <div className="aspect-square rounded-full border border-primary/10 absolute -inset-10 animate-[spin_20s_linear_infinite]" />
          <div className="aspect-square rounded-full border border-primary/5 absolute -inset-20 animate-[spin_35s_linear_infinite_reverse]" />
          <div className="relative z-10 w-full h-[300px] sm:h-[380px] lg:h-[500px]">
            {content.imageType === 'video' ? (
              <VideoCoverThumb
                url={content.image}
                alt={`${content.titleLine1} ${content.titleLine2} ${content.titleLine3}`.trim() || 'AMK Agency'}
                className="rounded-[2rem] shadow-2xl shadow-primary/20 border border-outline-variant/20 object-cover animate-float"
              />
            ) : (
              <SafeImage
                src={content.image}
                alt={`${content.titleLine1} ${content.titleLine2} ${content.titleLine3}`.trim() || 'AMK Agency'}
                fill
                className="rounded-[2rem] shadow-2xl shadow-primary/20 border border-outline-variant/20 object-cover animate-float"
                priority
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
