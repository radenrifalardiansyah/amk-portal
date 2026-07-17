'use client'

import { useState } from 'react'
import SafeImage from '@/components/SafeImage'
import MediaPlaceholder from '@/components/MediaPlaceholder'
import type { PortfolioGalleryItem } from '@/data/portfolio'
import { getVideoEmbed } from '@/lib/videoEmbed'

function GalleryThumbnail({ item }: { item: PortfolioGalleryItem }) {
  if (item.type === 'image') {
    return <SafeImage src={item.url} alt={item.caption || 'Foto galeri'} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
  }
  const embed = getVideoEmbed(item.url)
  return (
    <>
      {embed.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={embed.thumbnailUrl} alt={item.caption || 'Video galeri'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <MediaPlaceholder icon="movie" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
        <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">play_circle</span>
      </div>
    </>
  )
}

function LightboxMedia({ item }: { item: PortfolioGalleryItem }) {
  if (item.type === 'image') {
    return <SafeImage src={item.url} alt={item.caption || 'Foto galeri'} fill className="object-contain" />
  }
  const embed = getVideoEmbed(item.url)
  if (embed.kind === 'file') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={embed.embedUrl} controls autoPlay className="w-full h-full object-contain" />
  }
  return (
    <iframe
      src={embed.embedUrl}
      title={item.caption || 'Video galeri'}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className="w-full h-full border-0"
    />
  )
}

export default function ProjectGallery({ items }: { items: PortfolioGalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const close = () => setActiveIndex(null)
  const showPrev = () => setActiveIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length))
  const showNext = () => setActiveIndex((i) => (i === null ? null : (i + 1) % items.length))
  const active = activeIndex !== null ? items[activeIndex] : null

  if (!items.length) return null

  return (
    <div className="text-left max-w-4xl mx-auto mt-12">
      <h3 className="text-3xl font-headline font-bold text-primary mb-6">Project Gallery</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-video overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/10 block"
          >
            <GalleryThumbnail item={item} />
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-sm" onClick={close}>
          <button onClick={close} aria-label="Tutup" className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>

          {items.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); showPrev() }} aria-label="Sebelumnya" className="absolute left-3 md:left-6 text-white/80 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-4xl">chevron_left</span>
            </button>
          )}

          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <LightboxMedia item={active} />
          </div>

          {items.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); showNext() }} aria-label="Berikutnya" className="absolute right-3 md:right-6 text-white/80 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-4xl">chevron_right</span>
            </button>
          )}

          {active.caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-headline font-bold px-4 text-center">
              {active.caption}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
