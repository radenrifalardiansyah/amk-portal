// Injects Cloudinary's f_auto,q_auto transformation so the CDN itself picks
// the best format (WebP/AVIF) and compression per-browser, at no cost — this
// lets SafeImage skip Vercel's Image Optimization (and its origin-transfer
// fetch to Cloudinary) while still serving an optimized file. Non-Cloudinary
// URLs (e.g. the "Pakai Link" option) are returned untouched.
export function cloudinaryAutoFormat(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}
