import { NextRequest, NextResponse } from "next/server";

/**
 * Map of subdomain slug → internal Next.js path (rewrite target).
 * Keep in sync with the `subdomain` field in lib/apps.ts.
 *
 * These pages are public-facing — auth is handled client-side by Clerk.
 */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  cardgames: "/apps/iskambil",
  kiler: "/apps/kiler",
  maptracker: "/apps/map-tracker",
  movies: "/apps/movies-this-year",
  chocolatedb: "/apps/chocolate-db",
  tournaments: "/apps/tournament-editor",
  tournoments: "/apps/tournament-editor",
  catan: "/apps/catan-bot",
  ytdb: "/apps/youtube-discover",
  filmgraph: "/apps/film-graph",
  itumeals: "/apps/itu-yemekhane",
  hobby: "/apps/hobby-center",
  iconguide: "/apps/icon-set-guide",
  subcenter: "/apps/subcenter",
  tutorplace: "/apps/tutor-crm",
  pdf: "/apps/pdf-tools",
  gamecompanion: "/apps/game-companion",
  bgc: "/apps/board-game-clubs",
  memedex: "/apps/memedex",
  sticker: "/apps/sticker-editor",
  recipe: "/apps/recipe",
  instead: "/apps/stop-scroll",
  concerts: "/apps/concert-list",
  tasket: "/apps/tasket",
  workplaces: "/apps/workplaces",
};

/**
 * Extracts the subdomain from the request host.
 *   iskambil.localhost:3000  → "iskambil"
 *   iskambil.theverything.site  → "iskambil"
 *   theverything.site           → null  (root)
 *   localhost:3000           → null  (root)
 */
function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0]; // strip port

  // Dev: treat "xxx.localhost" as subdomain
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return sub || null;
  }

  // Production: theverything.site / xxx.theverything.site
  const ROOT_DOMAIN =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";

  if (hostname === ROOT_DOMAIN) return null;

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.replace(`.${ROOT_DOMAIN}`, "") || null;
  }

  return null;
}

export function proxy(request: NextRequest) {
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
