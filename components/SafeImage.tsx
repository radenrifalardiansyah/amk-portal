import Image, { ImageProps } from 'next/image'
import MediaPlaceholder from './MediaPlaceholder'
import { cloudinaryAutoFormat } from '@/lib/cloudinary'

type SafeImageProps = Omit<ImageProps, 'src'> & { src?: string | null }

export default function SafeImage({ src, alt, fill, width, height, className, ...props }: SafeImageProps) {
  if (!src) {
    return (
      <div
        className={fill ? 'absolute inset-0' : 'block w-full'}
        style={fill ? undefined : {
          maxWidth: typeof width === 'number' ? width : undefined,
          aspectRatio: typeof width === 'number' && typeof height === 'number' ? `${width} / ${height}` : undefined,
        }}
      >
        <MediaPlaceholder label="Tidak ada foto" />
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
      {...props}
    />
  )
}
