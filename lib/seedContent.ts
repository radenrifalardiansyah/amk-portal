import {
  advantagesService, keyPartnersService, clientsService, leadersService,
  badgesService, servicesService, portfolioService, siteContentService, newsService,
} from '@/lib/services'

export interface SeedResult {
  label: string
  seeded: boolean
}

export async function seedInitialContent(): Promise<SeedResult[]> {
  const collections: { label: string; run: () => Promise<boolean> }[] = [
    { label: 'Services', run: () => servicesService.seedDefaults() },
    { label: 'Portfolio', run: () => portfolioService.seedDefaults() },
    { label: 'Advantages', run: () => advantagesService.seedDefaults() },
    { label: 'Key Partners', run: () => keyPartnersService.seedDefaults() },
    { label: 'Clients', run: () => clientsService.seedDefaults() },
    { label: 'Leadership', run: () => leadersService.seedDefaults() },
    { label: 'Badges', run: () => badgesService.seedDefaults() },
    { label: 'News', run: () => newsService.seedDefaults() },
  ]

  const results: SeedResult[] = []
  for (const c of collections) {
    results.push({ label: c.label, seeded: await c.run() })
  }

  const contentLabels: Record<string, string> = {
    hero: 'Konten: Hero',
    aboutHome: 'Konten: About (Home)',
    aboutPage: 'Konten: Halaman About',
    contact: 'Konten: Contact',
    company: 'Konten: Profil Perusahaan',
  }
  const contentResults = await siteContentService.seedDefaults()
  contentResults.forEach((r) => {
    results.push({ label: contentLabels[r.key] ?? r.key, seeded: r.seeded })
  })

  return results
}
