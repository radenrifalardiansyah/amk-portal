import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  devIndicators: false,
  serverExternalPackages: ['firebase-admin'],
}

export default nextConfig
