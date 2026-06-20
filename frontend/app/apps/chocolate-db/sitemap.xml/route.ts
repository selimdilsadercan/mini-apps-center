import { NextResponse } from "next/server";
import { createBrowserClient } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 604800; // Cache sitemap for 7 days (1 week)

export async function GET() {
  const baseUrl = "https://chocolatedb.allminiapps.com";
  const client = createBrowserClient();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  try {
    const resp = await client.chocolate_db.listChocolates({ limit: 1000 });
    for (const choco of resp.chocolates) {
      xml += `
  <url>
    <loc>${baseUrl}/${choco.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  } catch (err) {
    console.error("Chocolate sitemap generation error:", err);
  }

  xml += "\n</urlset>";

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
