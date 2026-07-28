import { MetadataRoute } from 'next'
import { createBrowserClient } from '@/lib/api'
import { MINI_APPS, BUSINESS_APPS } from '@/lib/apps'

export const dynamic = "force-static";

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
      url: `${baseUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/updates`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Yayınlanmış directory sayfaları
  const publishedApps = [...MINI_APPS, ...BUSINESS_APPS].filter(a => a.isImplemented && !a.isCancelled);
  const directoryPages: MetadataRoute.Sitemap = publishedApps.map(app => ({
    url: `${baseUrl}/directory/${app.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  try {
    const resp = await client.chocolate_db.listChocolates({ limit: 1000 })
    const chocolatePages: MetadataRoute.Sitemap = resp.chocolates.map(choco => ({
      url: `${baseUrl}/apps/chocolate-db/${choco.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticPages, ...directoryPages, ...chocolatePages]
  } catch (err) {
    console.error("Sitemap generation error:", err)
    return [...staticPages, ...directoryPages]
  }
}
