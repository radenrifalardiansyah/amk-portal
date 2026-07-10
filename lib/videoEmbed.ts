export type VideoEmbedKind = 'youtube' | 'vimeo' | 'instagram' | 'file'

export interface VideoEmbedInfo {
  kind: VideoEmbedKind
  embedUrl: string
  thumbnailUrl?: string
}

export function getVideoEmbed(url: string): VideoEmbedInfo {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (youtube) {
    const id = youtube[1]
    return { kind: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}`, thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) {
    return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` }
  }

  const instagram = url.match(/instagram\.com\/(reel|p)\/([\w-]+)/)
  if (instagram) {
    return { kind: 'instagram', embedUrl: `https://www.instagram.com/${instagram[1]}/${instagram[2]}/embed` }
  }

  return { kind: 'file', embedUrl: url }
}
