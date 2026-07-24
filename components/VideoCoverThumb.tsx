'use client'

import { useState } from 'react'
import MediaPlaceholder from './MediaPlaceholder'
import { getVideoEmbed } from '@/lib/videoEmbed'

// Plays a video link inline wherever a static thumbnail would normally go —
// YouTube/Vimeo/direct files autoplay silently on loop; anything else (e.g.
// Instagram, which has no reliable silent-autoplay embed) falls back to a
// static thumbnail with a play affordance. Intended for a `relative` ancestor
// (fills it absolutely) — pair with `group` for the hover-darken effect.
export default function VideoCoverThumb({ url, alt, className = '' }: { url: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false)
  const embed = getVideoEmbed(url, { autoplay: true })

  if (embed.kind === 'youtube' || embed.kind === 'vimeo') {
    return (
      <iframe
        src={embed.embedUrl}
        title={alt}
        allow="autoplay; encrypted-media"
        className={`absolute inset-0 w-full h-full border-0 pointer-events-none ${className}`}
      />
    )
  }
  if (embed.kind === 'file') {
    if (broken) {
      return <MediaPlaceholder icon="movie" label="Tidak ada video" className="absolute inset-0" />
    }
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        src={embed.embedUrl}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setBroken(true)}
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      />
    )
  }

  const showThumb = embed.thumbnailUrl && !broken
  return (
    <>
      {showThumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={embed.thumbnailUrl}
          alt={alt}
          className={`absolute inset-0 w-full h-full ${className}`}
          onError={() => setBroken(true)}
        />
      ) : (
        <MediaPlaceholder icon="movie" label="Tidak ada video" className="absolute inset-0" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
        <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">play_circle</span>
      </div>
    </>
  )
}
