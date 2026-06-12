import { NextResponse } from "next/server";
import { GAMES_DATA } from "../games-registry";

export const dynamic = "force-static";
export const revalidate = 604800; // Cache sitemap for 7 days (1 week)

export async function GET() {
  const baseUrl = "https://cardgames.allminiapps.com";

  // Build XML sitemap structure
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  for (const game of GAMES_DATA) {
    xml += `
  <url>
    <loc>${baseUrl}/${game.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  xml += "\n</urlset>";

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
