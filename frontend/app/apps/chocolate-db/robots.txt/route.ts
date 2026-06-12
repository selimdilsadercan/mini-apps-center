import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const robots = `User-agent: *
Allow: /
Sitemap: https://chocolatedb.allminiapps.com/sitemap.xml
`;

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
