export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://amk-portal.vercel.app').replace(/\/$/, '')

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Social crawlers (Open Graph/Twitter cards) can't fetch data: URLs, so fall
// back to a static asset for images stored as base64 data URLs in Firestore.
export function ogImage(url: string | undefined | null, fallback = '/images/company.png'): string {
  if (!url || url.startsWith('data:')) return fallback
  return url
}
