'use client'

export default function ClientLogo({ src, name, className }: { src: string; name: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={className}
      onError={(e) => {
        const t = e.currentTarget
        t.onerror = null
        t.src = `https://placehold.co/200x80/f1f5f9/475569?text=${encodeURIComponent(name)}`
      }}
    />
  )
}
