import type { MetadataRoute } from 'next'
import { portfolioService, servicesService, newsService, clientsService } from '@/lib/services'
import { SITE_URL } from '@/lib/seo'

// Without this, Next statically bakes the sitemap at build time and Vercel's
// persistent data cache can keep serving that snapshot across deployments —
// new/renamed/removed slugs then never show up even after a fresh redeploy.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [portfolioSlugs, serviceSlugs, newsSlugs, clients] = await Promise.all([
    portfolioService.getAllSlugs(),
    servicesService.getAllSlugs(),
    newsService.getAllSlugs(),
    clientsService.getAll(),
  ])

  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/portfolio`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/clients`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/gallery`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const portfolioRoutes: MetadataRoute.Sitemap = portfolioSlugs.map((slug) => ({
    url: `${SITE_URL}/portfolio/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const serviceRoutes: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const newsRoutes: MetadataRoute.Sitemap = newsSlugs.map((slug) => ({
    url: `${SITE_URL}/news/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  const clientRoutes: MetadataRoute.Sitemap = clients.map((client) => ({
    url: `${SITE_URL}/clients/${client.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  return [...staticRoutes, ...portfolioRoutes, ...serviceRoutes, ...newsRoutes, ...clientRoutes]
}
