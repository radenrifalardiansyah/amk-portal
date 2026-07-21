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
}

export default nextConfig
