import { NextResponse } from 'next/server'
import { siteContentService } from '@/lib/services'

function iconType(src: string): string | undefined {
  const dataMatch = /^data:([^;]+);/.exec(src)
  if (dataMatch) return dataMatch[1]
  if (src.endsWith('.png')) return 'image/png'
  if (src.endsWith('.jpg') || src.endsWith('.jpeg')) return 'image/jpeg'
  if (src.endsWith('.webp')) return 'image/webp'
  return undefined
}

export async function GET() {
  const company = await siteContentService.getCompany()
  // Prefer the favicon (guaranteed square-cropped on upload) over the raw logo,
  // which can be any aspect ratio and would otherwise be stretched into the
  // square install-icon slot.
  const logo = company.faviconUrl || company.logoUrl

  const bundledIcons = [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]

  // Company logo/favicon is a user-uploaded data: URI of unknown/arbitrary dimensions, so it
  // can't reliably replace the bundled icons (browsers may reject it as an install icon).
  // Keep the bundled set as the guaranteed-valid baseline and only add it on top.
  const icons = logo
    ? [...bundledIcons, { src: logo, sizes: '512x512', type: iconType(logo), purpose: 'any' }]
    : bundledIcons

  const manifest = {
    name: 'AMK Admin Portal',
    short_name: 'AMK Admin',
    description: 'Panel admin PT. Adikara Mandala Kreasi untuk mengelola konten website.',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FFFFFF',
    theme_color: '#2563EB',
    lang: 'id',
    icons,
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
