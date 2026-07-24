'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import SafeImage from '@/components/SafeImage'
import MediaPlaceholder from '@/components/MediaPlaceholder'
import type { GalleryItem } from '@/lib/services'
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
          <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">play_circle</span>
        </div>
      </>
    )
  }
  return (
    <SafeImage
      src={item.url}
      alt={item.title}
      fill
      unoptimized
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

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const close = () => setActiveIndex(null)
  const showPrev = () => setActiveIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length))
  const showNext = () => setActiveIndex((i) => (i === null ? null : (i + 1) % items.length))

  const active = activeIndex !== null ? items[activeIndex] : null

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActiveIndex(i)}
            className="reveal-scale group relative block aspect-square overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/10"
            style={i > 0 ? { transitionDelay: `${(i % 8) * 0.08}s` } : {}}
          >
            <Thumbnail item={item} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <p className="text-sm font-headline font-bold text-white text-left">{item.title}</p>
            </div>
          </button>
        ))}
      </div>

      {active && createPortal(
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

          {items.length > 1 && (
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

          {items.length > 1 && (
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
        </div>,
        document.body
      )}
    </>
  )
}
