'use client'

import { useState } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import MediaPlaceholder from '@/components/MediaPlaceholder'
import type { GalleryItem, GallerySectionContent } from '@/lib/services'
import { getVideoEmbed } from '@/lib/videoEmbed'

function Thumbnail({ item }: { item: GalleryItem }) {
  if (item.type === 'video') {
    const embed = getVideoEmbed(item.url)
    return (
      <>
        {embed.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={embed.thumbnailUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <MediaPlaceholder icon="movie" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
          <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">play_circle</span>
        </div>
      </>
    )
  }
  return (
    <SafeImage
      src={item.url}
      alt={item.title}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-110"
    />
  )
}

function LightboxMedia({ item }: { item: GalleryItem }) {
  if (item.type === 'image') {
    return <SafeImage src={item.url} alt={item.title} fill unoptimized className="object-contain" />
  }
  const embed = getVideoEmbed(item.url)
  if (embed.kind === 'file') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={embed.embedUrl} controls autoPlay className="w-full h-full object-contain" />
  }
  return (
    <iframe
      src={embed.embedUrl}
      title={item.title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className="w-full h-full border-0"
    />
  )
}

export default function GallerySection({ previews, content }: { previews: GalleryItem[]; content: GallerySectionContent }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (!previews.length) return null

  const close = () => setActiveIndex(null)
  const showPrev = () => setActiveIndex((i) => (i === null ? null : (i - 1 + previews.length) % previews.length))
  const showNext = () => setActiveIndex((i) => (i === null ? null : (i + 1) % previews.length))
  const active = activeIndex !== null ? previews[activeIndex] : null

  return (
    <section className="py-24 bg-surface reveal scroll-mt-8" id="gallery">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 reveal">
          <div className="space-y-4">
            <h2 className="text-5xl font-headline font-bold text-primary tracking-tight">{content.heading}</h2>
            <p className="text-on-surface-variant max-w-xl">
              {content.description}
            </p>
          </div>
          <Link
            href="/gallery"
            className="px-8 py-3 border border-primary/30 text-primary font-headline font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center space-x-2"
          >
            <span>View Full Gallery</span>
            <span className="material-symbols-outlined">collections</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(i)}
              className="reveal-scale group relative block overflow-hidden rounded-2xl aspect-square bg-surface-bright shadow-lg"
              style={i > 0 ? { transitionDelay: `${i * 0.1}s` } : {}}
            >
              <Thumbnail item={item} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-sm font-headline font-bold text-white text-left">{item.title}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={close}
            aria-label="Tutup"
            className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          {previews.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev() }}
              aria-label="Sebelumnya"
              className="absolute left-3 md:left-6 text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-4xl">chevron_left</span>
            </button>
          )}

          <div
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <LightboxMedia item={active} />
          </div>

          {previews.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext() }}
              aria-label="Berikutnya"
              className="absolute right-3 md:right-6 text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-4xl">chevron_right</span>
            </button>
          )}

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-headline font-bold px-4 text-center">
            {active.title}
          </p>
        </div>
      )}
    </section>
  )
}
