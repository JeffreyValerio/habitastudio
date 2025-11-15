import { MetadataRoute } from 'next'
import { getProducts } from '@/lib/data/products'
import { getAllServiceSlugs } from '@/lib/data/services'
import { getAllProjectSlugs } from '@/lib/data/projects'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://habitastudio.online'

  const staticRoutes = [
    '',
    '/sobre-nosotros',
    '/catalogo',
    '/proyectos',
    '/servicios',
    '/blog',
    '/contacto',
    '/politica-privacidad',
    '/terminos-condiciones',
    '/cookies',
  ]

  const products = await getProducts();
  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/catalogo/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const serviceSlugs = await getAllServiceSlugs();
  const serviceRoutes = serviceSlugs.map((slug) => ({
    url: `${baseUrl}/servicios/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const projectSlugs = await getAllProjectSlugs();
  const projectRoutes = projectSlugs.map((slug) => ({
    url: `${baseUrl}/proyectos/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const staticSitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? ('daily' as const) : ('weekly' as const),
    priority: route === '' ? 1 : 0.8,
  }))

  return [...staticSitemap, ...productRoutes, ...serviceRoutes, ...projectRoutes]
}

