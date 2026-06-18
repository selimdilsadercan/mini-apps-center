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
  neyapsam: "/apps/stop-scroll",
  concerts: "/apps/concert-list",
  kampus: "/apps/campus-concerts",
  tasket: "/apps/tasket",
  workplaces: "/apps/workplaces",
  melt: "/apps/pomodoro",
  kimgelir: "/apps/kim-gelir",
  suggest: "/apps/suggest",
  tasarruf: "/apps/tasarruf-challenges",
  birikim: "/apps/birikim",
  kavanoz: "/apps/penalty-jar",
  oneday: "/apps/one-day-city-guide",
  budget: "/apps/budget",
  stampcard: "/apps/stamp-card",
  esles: "/apps/esles",
  campusevents: "/apps/campus-events",
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

  // ── Special 'my' subdomain → serves the main application ─────────────────
  if (subdomain === "my") {
    // Let all app routes and root path '/' (original auth logic) pass through
    return NextResponse.next();
  }

  // ── Known app subdomain → rewrite to the matching app page ───────────────────
  if (subdomain && SUBDOMAIN_ROUTES[subdomain]) {
    const targetPath = SUBDOMAIN_ROUTES[subdomain];
    const url = request.nextUrl.clone();

    const originalPath = url.pathname;

    // Avoid rewrite loop if already starting with target path
    if (originalPath.startsWith(targetPath)) {
      const res = NextResponse.next();
      res.headers.set("x-subdomain", subdomain);
      return res;
    }

    url.pathname = `${targetPath}${originalPath === "/" ? "" : originalPath}`;
    const res = NextResponse.rewrite(url);
    // Pass subdomain to the app so the discovery banner can self-activate
    res.headers.set("x-subdomain", subdomain);
    return res;
  }

  // ── Unknown subdomain → redirect to my.[domain]/home ─────────────────────
  if (subdomain && subdomain !== "my" && !SUBDOMAIN_ROUTES[subdomain]) {
    const appUrl = request.nextUrl.clone();
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    const isLocal = host.startsWith("localhost") || host.includes(".localhost");

    appUrl.hostname = isLocal ? "my.localhost" : `my.${ROOT_DOMAIN}`;
    appUrl.port = isLocal && host.split(":")[1] ? host.split(":")[1] : "";
    appUrl.pathname = "/home";
    return NextResponse.redirect(appUrl);
  }

  // ── Main domain (No subdomain) ───────────────────────────────────────────
  const url = request.nextUrl.clone();
  const originalPath = url.pathname;

  // Root path '/' rewrites to serve the landing page internally
  if (originalPath === "/") {
    url.pathname = "/landing";
    return NextResponse.rewrite(url);
  }

  // If trying to access application paths directly on the root domain,
  // redirect to the personal 'my' subdomain.
  const APP_ROUTES = ["/home", "/discover", "/profile", "/friends", "/ai-chat", "/sign-in", "/sign-up", "/apps"];
  const isAppRoute = APP_ROUTES.some(route => originalPath.startsWith(route));

  if (isAppRoute) {
    const myAppUrl = request.nextUrl.clone();
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    const isLocal = host.startsWith("localhost") || host.includes(".localhost");

    myAppUrl.hostname = isLocal ? "my.localhost" : `my.${ROOT_DOMAIN}`;
    myAppUrl.port = isLocal && host.split(":")[1] ? host.split(":")[1] : "";
    return NextResponse.redirect(myAppUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|[^?]*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
