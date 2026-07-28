import { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/api'
// Sadece veri olarak import etmeye çalışalım veya manuel id'leri kullanalım
// İkonların createContext hatasına yol açmasını engellemek için sitemap içinde
// lib/apps import'unu dikkatli yapmalıyız. 
// Alternatif: sitemap için sadece ID listesi yeterli.

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://allminiapps.com'
  
  // createBrowserClient yerine createServerClient kullanalım
  const client = await createServerClient()
  
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

  // lib/apps'ten MINI_APPS'i çekmek yerine, build zamanı hatayı önlemek için 
  // yayınlanmış ID'leri manuel veya güvenli bir yolla almalıyız.
  // lib/apps içindeki ikonlar server-side render sırasında patlıyor olabilir.
  
  // Şimdilik kritik olanları ekleyelim veya lib/apps'i güvenli import etmeyi deneyelim
  let directoryPages: MetadataRoute.Sitemap = [];
  try {
    // Buradaki import'un sitemap build'ini bozup bozmadığını kontrol edeceğiz
    const { MINI_APPS, BUSINESS_APPS } = await import('@/lib/apps');
    const publishedApps = [...MINI_APPS, ...BUSINESS_APPS].filter(a => a.isImplemented && !a.isCancelled);
    directoryPages = publishedApps.map(app => ({
      url: `${baseUrl}/directory/${app.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (e) {
    console.error("Directory apps import error:", e);
  }

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
