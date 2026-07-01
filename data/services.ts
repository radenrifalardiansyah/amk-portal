export interface ServiceFeature {
  icon: string
  title: string
  description: string
}

export interface Service {
  slug: string
  badge: string
  title: string
  subtitle: string
  image: string
  imageAlt: string
  heading: string
  body: string
  features: ServiceFeature[]
  ctaTitle: string
  ctaLabel: string
  navIcon: string
  navTitle: string
  navDescription: string
}
