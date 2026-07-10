export interface PortfolioGalleryItem {
  id: string
  type: 'image' | 'video'
  url: string
  caption?: string
}

export interface PortfolioProject {
  slug: string
  category: string
  title: string
  description: string
  image: string
  client: string
  clientId?: string | null
  services: string
  year: string
  challenge: string
  solution: string
  result: string
  gallery?: PortfolioGalleryItem[]
  prevSlug: string | null
  nextSlug: string | null
  nextLabel: string | null
}
