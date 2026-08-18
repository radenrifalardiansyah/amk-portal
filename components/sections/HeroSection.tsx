'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import VideoCoverThumb from '@/components/VideoCoverThumb'
import Magnetic from '@/components/Magnetic'
import { DEFAULT_HERO_TITLE_SIZE } from '@/lib/services'
import type { HeroContent, HeroSlide } from '@/lib/services'

const AUTOPLAY_MS = 6500
const SWIPE_THRESHOLD = 40

function legacyContentAsSlide(content: HeroContent): HeroSlide {
  return {
    id: 'legacy',
    order: 0,
    badge: content.badge,
    titleLine1: content.titleLine1,
    titleLine2: content.titleLine2,
    titleLine3: content.titleLine3,
    titleLine1Size: content.titleLine1Size || DEFAULT_HERO_TITLE_SIZE,
    titleLine2Size: content.titleLine2Size || DEFAULT_HERO_TITLE_SIZE,
    titleLine3Size: content.titleLine3Size || DEFAULT_HERO_TITLE_SIZE,
    description: content.description,
    primaryCtaLabel: content.primaryCtaLabel,
    primaryCtaHref: content.primaryCtaHref,
    secondaryCtaLabel: content.secondaryCtaLabel,
    secondaryCtaHref: content.secondaryCtaHref,
    image: content.image,
    imageType: content.imageType ?? 'image',
  }
}

export default function HeroSection({ content, slides = [] }: { content: HeroContent; slides?: HeroSlide[] }) {
  const items = slides.length > 0 ? slides : [legacyContentAsSlide(content)]
  const isSlider = items.length > 1

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  const goTo = useCallback((i: number) => {
    setActive(((i % items.length) + items.length) % items.length)
  }, [items.length])

  const next = useCallback(() => goTo(active + 1), [active, goTo])
  const prev = useCallback(() => goTo(active - 1), [active, goTo])

  useEffect(() => {
    if (!isSlider || paused) return undefined
    const timer = setInterval(() => setActive((a) => (a + 1) % items.length), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [isSlider, paused, items.length])

  useEffect(() => {
    if (!isSlider) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isSlider, prev, next])

  const activeSlide = items[active]

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden scroll-mt-8 bg-on-surface -mt-[104px] md:mt-0"
      id="home"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true) }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const delta = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(delta) > SWIPE_THRESHOLD) { if (delta > 0) prev(); else next() }
        }
        touchX.current = null
        setPaused(false)
      }}
    >
      {/* Full-bleed background slides */}
      <div className="absolute inset-0">
        {items.map((slide, i) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
            aria-hidden={i !== active}
          >
            {slide.imageType === 'video' ? (
              <VideoCoverThumb
                url={slide.image}
                alt={`${slide.titleLine1} ${slide.titleLine2} ${slide.titleLine3}`.trim() || 'AMK Agency'}
                className="object-cover"
              />
            ) : (
              <SafeImage
                src={slide.image}
                alt={`${slide.titleLine1} ${slide.titleLine2} ${slide.titleLine3}`.trim() || 'AMK Agency'}
                fill
                className="object-cover"
                priority={i === 0}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          </div>
        ))}
      </div>

      {/* Content overlay */}
      <div className="w-full max-w-7xl mx-auto px-8 pt-20 relative z-10">
        <div className="max-w-2xl space-y-7">
          {activeSlide.badge && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium tracking-widest uppercase text-white/90">
                {activeSlide.badge}
              </span>
            </div>
          )}

          <h1 className="font-headline font-bold tracking-[-0.04em] text-white leading-[0.9] flex flex-col drop-shadow-sm">
            <span className={activeSlide.titleLine1Size}>{activeSlide.titleLine1}</span>
            <span className={activeSlide.titleLine2Size}>{activeSlide.titleLine2}</span>
            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-accent to-white ${activeSlide.titleLine3Size}`}>
              {activeSlide.titleLine3}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-lg leading-relaxed font-body">
            {activeSlide.description}
          </p>

          <div className="flex items-center space-x-6 pt-4">
            {activeSlide.primaryCtaLabel && (
              <Magnetic strength={0.4}>
                <Link
                  href={activeSlide.primaryCtaHref || '#'}
                  className="btn-pulse px-8 py-4 hero-gradient text-on-primary font-headline font-extrabold text-lg rounded-xl hover:scale-105 transition-all duration-300 relative overflow-hidden flex items-center justify-center"
                >
                  <div className="shine-sweep" />
                  <span className="relative z-10">{activeSlide.primaryCtaLabel}</span>
                </Link>
              </Magnetic>
            )}
            {activeSlide.secondaryCtaLabel && (
              <Magnetic strength={0.25}>
                <Link href={activeSlide.secondaryCtaHref || '#'} className="group flex items-center space-x-3 text-white font-headline font-bold">
                  <span>{activeSlide.secondaryCtaLabel}</span>
                  <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </Magnetic>
            )}
          </div>

          {isSlider && (
            <div className="flex items-center gap-4 pt-6">
              <div className="flex items-center gap-2">
                {items.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Ke slide ${i + 1}`}
                    aria-current={i === active}
                    className="relative h-1.5 rounded-full overflow-hidden bg-white/30 transition-[width] duration-300"
                    style={{ width: i === active ? 36 : 8 }}
                  >
                    {i === active && !paused && (
                      <span
                        key={active}
                        className="hero-slide-progress absolute inset-y-0 left-0 bg-white rounded-full"
                        style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                      />
                    )}
                    {i === active && paused && (
                      <span className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: '100%' }} />
                    )}
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-white/70 tabular-nums">
                {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </div>

      {isSlider && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Slide sebelumnya"
            className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/25 text-white hover:bg-white/20 hover:scale-105 transition-all z-20"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Slide berikutnya"
            className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/25 text-white hover:bg-white/20 hover:scale-105 transition-all z-20"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </>
      )}
    </section>
  )
}
