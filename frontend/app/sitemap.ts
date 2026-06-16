import { MetadataRoute } from 'next'
import { createBrowserClient } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://allminiapps.com'
  const client = createBrowserClient()
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/apps/chocolate-db`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  try {
    const resp = await client.chocolate_db.listChocolates({ limit: 1000 })
    const chocolatePages: MetadataRoute.Sitemap = resp.chocolates.map(choco => ({
      url: `${baseUrl}/apps/chocolate-db/${choco.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticPages, ...chocolatePages]
  } catch (err) {
    console.error("Sitemap generation error:", err)
    return staticPages
  }
}
