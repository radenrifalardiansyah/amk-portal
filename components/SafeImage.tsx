'use client'

import { useEffect, useState } from 'react'
import Image, { ImageProps } from 'next/image'
import MediaPlaceholder from './MediaPlaceholder'
import { cloudinaryAutoFormat } from '@/lib/cloudinary'

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src?: string | null
  fallbackLabel?: string
  fallbackIcon?: string
}

export default function SafeImage({
  src, alt, fill, width, height, className, fallbackLabel = 'Tidak ada foto', fallbackIcon, onError, ...props
}: SafeImageProps) {
  const [broken, setBroken] = useState(false)

  // A new src (e.g. after re-uploading) deserves a fresh chance to load.
  useEffect(() => { setBroken(false) }, [src])

  if (!src || broken) {
    return (
      <div
        className={`${fill ? 'absolute inset-0' : 'block w-full'} ${className ?? ''}`}
        style={fill ? undefined : {
          maxWidth: typeof width === 'number' ? width : undefined,
          aspectRatio: typeof width === 'number' && typeof height === 'number' ? `${width} / ${height}` : undefined,
        }}
      >
        <MediaPlaceholder label={fallbackLabel} icon={fallbackIcon} />
      </div>
    )
  }
  return (
    <Image
      src={cloudinaryAutoFormat(src)}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      unoptimized
      onError={(e) => { setBroken(true); onError?.(e) }}
      {...props}
    />
  )
}
