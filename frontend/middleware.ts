import { NextRequest, NextResponse } from "next/server";

/**
 * Map of subdomain slug → internal Next.js path (rewrite target).
 * Keep in sync with the `subdomain` field in lib/apps.ts.
 *
 * These pages are public-facing — auth is handled client-side by Clerk.
 */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  iskambil: "/apps/iskambil",
  kiler: "/apps/kiler",
  harita: "/apps/map-tracker",
  movies: "/apps/movies-this-year",
  cikolata: "/apps/chocolate-db",
  turnuva: "/apps/tournament-editor",
  catan: "/apps/catan-bot",
  youtube: "/apps/youtube-discover",
  filmgraph: "/apps/film-graph",
  itu: "/apps/itu-yemekhane",
};

/**
 * Extracts the subdomain from the request host.
 *   iskambil.localhost:3000  → "iskambil"
 *   iskambil.everything.com  → "iskambil"
 *   everything.com           → null  (root)
 *   localhost:3000           → null  (root)
 */
function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0]; // strip port

  // Dev: treat "xxx.localhost" as subdomain
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return sub || null;
  }

  // Production: everything.com / xxx.everything.com
  const ROOT_DOMAIN =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "everything.com";

  if (hostname === ROOT_DOMAIN) return null;

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.replace(`.${ROOT_DOMAIN}`, "") || null;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // ── Known subdomain → rewrite to the matching app page ───────────────────
  if (subdomain && SUBDOMAIN_ROUTES[subdomain]) {
    const targetPath = SUBDOMAIN_ROUTES[subdomain];
    const url = request.nextUrl.clone();

    // Avoid rewrite loop if already on the target path
    if (url.pathname === targetPath) {
      const res = NextResponse.next();
      res.headers.set("x-subdomain", subdomain);
      return res;
    }

    url.pathname = targetPath;
    const res = NextResponse.rewrite(url);
    // Pass subdomain to the app so the discovery banner can self-activate
    res.headers.set("x-subdomain", subdomain);
    return res;
  }

  // ── Unknown subdomain → redirect to root ─────────────────────────────────
  if (subdomain && !SUBDOMAIN_ROUTES[subdomain]) {
    const rootUrl = request.nextUrl.clone();
    rootUrl.hostname =
      process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost";
    rootUrl.port =
      process.env.NODE_ENV === "development" ? "3000" : "";
    rootUrl.pathname = "/home";
    return NextResponse.redirect(rootUrl);
  }

  // ── Main domain → pass through (Clerk auth handled client-side) ───────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|[^?]*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
