'use client'

import { useState } from 'react'
import MediaPlaceholder from './MediaPlaceholder'
import type { VideoEmbedInfo } from '@/lib/videoEmbed'

// Big, click-to-play video for a detail-page hero (portfolio/news) — full
// controls instead of the card thumbnails' silent autoplay loop. Falls back
// to "Tidak ada video" if a direct file link is broken; YouTube/Vimeo/
// Instagram iframes can't be introspected for a dead video from here, so
// those keep showing whatever the provider's own embed renders.
export default function VideoHeroEmbed({ embed, alt, className = '' }: { embed: VideoEmbedInfo; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false)

  if (embed.kind === 'file') {
    if (broken) {
      return <MediaPlaceholder icon="movie" label="Tidak ada video" className={className} />
    }
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        src={embed.embedUrl}
        controls
        onError={() => setBroken(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    )
  }

  return (
    <iframe
      src={embed.embedUrl}
      title={alt}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className={`w-full h-full border-0 ${className}`}
    />
  )
}
