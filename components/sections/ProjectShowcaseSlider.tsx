'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import VideoCoverThumb from '@/components/VideoCoverThumb'
import type { HeroSlide } from '@/lib/services'

const AUTOPLAY_MS = 6500
const SWIPE_THRESHOLD = 40

export default function ProjectShowcaseSlider({ slides = [] }: { slides?: HeroSlide[] }) {
  const items = slides
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

  if (items.length === 0) return null

  return (
    <section
      id="home"
      className="relative w-full min-h-screen overflow-hidden bg-on-surface -mt-[104px] md:mt-0 scroll-mt-8"
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
              alt={slide.titleLine1 || 'Project'}
              className="object-cover"
            />
          ) : (
            <SafeImage
              src={slide.image}
              alt={slide.titleLine1 || 'Project'}
              fill
              className="object-cover"
              priority={i === 0}
            />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          {/* Center "view project" CTA */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <Link
              href={slide.primaryCtaHref || '#'}
              className={`flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full border border-white/70 text-white uppercase tracking-[0.15em] text-xs md:text-sm font-semibold backdrop-blur-sm hover:bg-white hover:text-on-surface hover:border-white transition-colors duration-300 ${i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {slide.primaryCtaLabel || 'Click to See This Project'}
            </Link>
          </div>

          {/* Bottom title + tagline */}
          <div
            className={`absolute inset-x-0 bottom-10 md:bottom-14 px-6 md:px-12 text-center transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0'}`}
          >
            <h2 className="font-headline font-extrabold uppercase tracking-tight text-white text-3xl md:text-5xl leading-none drop-shadow-sm">
              {slide.titleLine1}
            </h2>
            {slide.description && (
              <p className="mt-3 text-white/85 uppercase tracking-[0.2em] text-[11px] md:text-sm font-medium">
                {slide.description}
              </p>
            )}
          </div>
        </div>
      ))}

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

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
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
        </>
      )}
    </section>
  )
}
