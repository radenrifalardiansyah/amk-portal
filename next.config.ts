import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Admin bisa menempelkan link gambar dari domain manapun (fitur "Pakai Link"),
      // jadi wildcard di sini mencegah next/image error "hostname not configured".
      { protocol: 'https', hostname: '**' },
    ],
  },
  devIndicators: false,
  serverExternalPackages: ['firebase-admin'],
  async redirects() {
    return [
      // Domain produksi sudah pindah ke www.adikaramandalakreasi.com — 301 dari
      // vercel.app memastikan Google berhenti mengindeks URL lama, bukan cuma
      // "disarankan" lewat canonical tag.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'adikaramandalakreasi.vercel.app' }],
        destination: 'https://www.adikaramandalakreasi.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
