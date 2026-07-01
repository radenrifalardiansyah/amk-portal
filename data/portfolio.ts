export interface PortfolioProject {
  slug: string
  category: string
  title: string
  description: string
  image: string
  client: string
  services: string
  year: string
  challenge: string
  solution: string
  result: string
  prevSlug: string | null
  nextSlug: string | null
  nextLabel: string | null
}
