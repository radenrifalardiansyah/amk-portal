import type { MetadataRoute } from 'next'
import { portfolioService, servicesService, newsService } from '@/lib/services'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [portfolioSlugs, serviceSlugs, newsSlugs] = await Promise.all([
    portfolioService.getAllSlugs(),
    servicesService.getAllSlugs(),
    newsService.getAllSlugs(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/portfolio`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/news`, changeFrequency: 'daily', priority: 0.8 },
  ]

  const portfolioRoutes: MetadataRoute.Sitemap = portfolioSlugs.map((slug) => ({
    url: `${SITE_URL}/portfolio/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const serviceRoutes: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const newsRoutes: MetadataRoute.Sitemap = newsSlugs.map((slug) => ({
    url: `${SITE_URL}/news/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...portfolioRoutes, ...serviceRoutes, ...newsRoutes]
}
