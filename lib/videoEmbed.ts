export type VideoEmbedKind = 'youtube' | 'vimeo' | 'instagram' | 'file'

export interface VideoEmbedInfo {
  kind: VideoEmbedKind
  embedUrl: string
  thumbnailUrl?: string
}

// `autoplay: true` produces a silent, looping "background video" embed for
// card previews (muted is required for browsers to allow autoplay).
export function getVideoEmbed(url: string, opts: { autoplay?: boolean } = {}): VideoEmbedInfo {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (youtube) {
    const id = youtube[1]
    const embedUrl = opts.autoplay
      ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1`
      : `https://www.youtube.com/embed/${id}`
    return { kind: 'youtube', embedUrl, thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) {
    const embedUrl = opts.autoplay
      ? `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&muted=1&loop=1&background=1`
      : `https://player.vimeo.com/video/${vimeo[1]}`
    return { kind: 'vimeo', embedUrl }
  }

  const instagram = url.match(/instagram\.com\/(reel|p)\/([\w-]+)/)
  if (instagram) {
    return { kind: 'instagram', embedUrl: `https://www.instagram.com/${instagram[1]}/${instagram[2]}/embed` }
  }

  return { kind: 'file', embedUrl: url }
}
