// Injects Cloudinary's f_auto,q_auto transformation so the CDN itself picks
// the best format (WebP/AVIF) and compression per-browser, at no cost — this
// lets SafeImage skip Vercel's Image Optimization (and its origin-transfer
// fetch to Cloudinary) while still serving an optimized file. Non-Cloudinary
// URLs (e.g. the "Pakai Link" option) are returned untouched.
export function cloudinaryAutoFormat(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', '/upload/f_auto,q_auto/')
}

// Logos are uploaded at whatever canvas size the source file has, often with
// a lot of empty margin around the mark itself (e.g. exported on a square
// artboard). e_trim crops that empty margin off on delivery so a fixed-height
// logo container (h-9 w-auto, object-contain) renders the mark at its real
// visual size instead of shrinking it to fit the untrimmed canvas.
export function cloudinaryLogo(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', '/upload/e_trim,f_auto,q_auto/')
}
