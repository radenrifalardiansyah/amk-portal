'use client'

import SafeImage from './SafeImage'
import VideoCoverThumb from './VideoCoverThumb'

// Renders a cover (portfolio project, news article, etc.) as an aspect-locked
// card thumbnail, same slot whether the cover is a static image or a video
// link. Intended for use inside a `relative` + `group` ancestor (fills it
// absolutely).
export default function MediaCoverThumb({
  image, imageType, alt, className = '',
}: {
  image: string
  imageType?: 'image' | 'video'
  alt: string
  className?: string
}) {
  if (imageType === 'video') {
    return <VideoCoverThumb url={image} alt={alt} className={className} />
  }
  return <SafeImage src={image} alt={alt} fill className={className} />
}
