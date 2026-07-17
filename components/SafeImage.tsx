import Image, { ImageProps } from 'next/image'
import MediaPlaceholder from './MediaPlaceholder'

type SafeImageProps = Omit<ImageProps, 'src'> & { src?: string | null }

export default function SafeImage({ src, alt, fill, width, height, className, ...props }: SafeImageProps) {
  if (!src) {
    return (
      <div
        className={fill ? 'absolute inset-0' : 'inline-block'}
        style={fill ? undefined : { width, height }}
      >
        <MediaPlaceholder label="Tidak ada foto" />
      </div>
    )
  }
  return <Image src={src} alt={alt} fill={fill} width={width} height={height} className={className} {...props} />
}
