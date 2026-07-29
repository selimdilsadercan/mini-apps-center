import { NextRequest, NextResponse } from "next/server";
import {
  HUB_INTERNAL_PREFIX,
  isMySubdomainCleanPath,
  isMySubdomainHost,
  toCleanHubPath,
  toInternalHubPath,
} from "./lib/hub-routes";

/**
 * Map of subdomain slug → internal Next.js path (rewrite target).
 * Keep in sync with the `subdomain` field in lib/apps.ts.
 *
 * These pages are public-facing — auth is handled client-side by Clerk.
 */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  places: "/apps/places",
  gaminghub: "/apps/gaming-hub",
  kalimba: "/apps/kalimba",
  cardgames: "/apps/iskambil",
  eksikvar: "/apps/eksik-var",
  maptracker: "/apps/map-tracker",
  movies: "/apps/movies-this-year",
  chocolatedb: "/apps/chocolate-db",
  tournaments: "/apps/tournament-editor",
  tournoments: "/apps/tournament-editor",
  catan: "/apps/catan-bot",
  ytdb: "/apps/youtube-discover/kesfet",
  filmgraph: "/apps/film-graph",
  itumeals: "/apps/itu-yemekhane",
  hobby: "/apps/hobby-center",
  iconguide: "/apps/icon-set-guide",
  subcenter: "/apps/subcenter",
  tutorplace: "/apps/tutor-crm",
  pdf: "/apps/pdf-tools",
  yazboz: "/apps/game-companion",
  bgc: "/apps/board-game-clubs",
  memedex: "/apps/memedex",
  sticker: "/apps/sticker-editor",
  recipe: "/apps/recipe",
  gym: "/apps/gym",
  buyukmaclar: "/apps/buyuk-maclar",
  evisleri: "/apps/ev-isleri",
  rutinler: "/apps/rutinler",
  study: "/apps/study",
  ykstercih: "/apps/yks-tercih",
  tustercih: "/apps/tus-tercih",
  tuskitap: "/apps/tus-kitap",
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
  outdoor: "/apps/outdoor-activities",
  budget: "/apps/budget",
  stampcard: "/apps/stamp-card",
  esles: "/apps/esles",
  events: "/apps/campus-events",
  basvuru: "/apps/apply-tracker",
  seriestrack: "/apps/series-track",
  readtracker: "/apps/read-tracker",
  weather: "/apps/daily-weather",
  menu: "/apps/digital-menu",
  siparistakip: "/apps/siparis-takip",
  dashboard: "/dashboard",
  storepreview: "/apps/store-preview",
  iconexport: "/apps/icon-export",
  surdurulebilirlik: "/apps/surdurulebilirlik",
  standups: "/apps/standups",
  page: "/apps/business-page",
  feedback: "/apps/feedback-board", 
};

/**
 * Extracts the subdomain from the request host.
 *   iskambil.localhost:5000  → "iskambil"
 *   iskambil.theverything.site  → "iskambil"
 *   theverything.site           → null  (root)
 *   localhost:5000           → null  (root)
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
  const pathname = request.nextUrl.pathname;

  // API proxy — must not be rewritten to /apps/<subdomain>/encore-api/...
  if (pathname.startsWith("/encore-api")) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // ── 'updates' subdomain → R2 CDN only ─────────────────────────────────────
  // Normalde Cloudflare R2 bu subdomain'i karşılar. Vercel'e düşerse:
  // - /updates/*.zip → redirect yapma (OTA indirmesi HTML'e dönmesin)
  // - diğer path'ler → my.allminiapps.com'a yönlendir
  if (subdomain === "updates") {
    if (pathname.startsWith("/updates/")) {
      return new NextResponse("OTA bundle not found on this server. Check Cloudflare R2 custom domain.", {
        status: 404,
      });
    }

    const appUrl = request.nextUrl.clone();
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    const isLocal = host.startsWith("localhost") || host.includes(".localhost");

    appUrl.hostname = isLocal ? "my.localhost" : `my.${ROOT_DOMAIN}`;
    appUrl.port = isLocal && host.split(":")[1] ? host.split(":")[1] : "";
    appUrl.pathname = "/today";
    return NextResponse.redirect(appUrl);
  }

  // ── Special 'my' subdomain → serves the main application ─────────────────
  if (subdomain === "my") {
    // Canonicalize legacy /home/* URLs → clean paths (/today, /life, …)
    if (pathname === "/home" || pathname.startsWith("/home/")) {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.pathname = toCleanHubPath(pathname);
      return NextResponse.redirect(cleanUrl);
    }

    // Root → today dashboard
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `${HUB_INTERNAL_PREFIX}/today`;
      return NextResponse.rewrite(url);
    }

    // Clean hub paths → internal /home/* routes
    if (isMySubdomainCleanPath(pathname)) {
      const internalPath = toInternalHubPath(pathname);
      if (internalPath) {
        const url = request.nextUrl.clone();
        url.pathname = internalPath;
        return NextResponse.rewrite(url);
      }
    }

    return NextResponse.next();
  }

  // ── Known app subdomain → rewrite to the matching app page ───────────────────
  if (subdomain && SUBDOMAIN_ROUTES[subdomain]) {
    const targetPath = SUBDOMAIN_ROUTES[subdomain];
    const url = request.nextUrl.clone();

    const originalPath = url.pathname;

    // If the path ALREADY starts with the target path (e.g. /apps/yks-tercih/saved)
    // on a subdomain (ykstercih.domain), redirect to the clean path (/saved)
    // to keep the URL consistent and avoid duplicate paths.
    if (originalPath.startsWith(targetPath)) {
      const cleanPath = originalPath.replace(targetPath, "") || "/";
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = cleanPath;
      return NextResponse.redirect(redirectUrl);
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
    appUrl.pathname = "/today";
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

  if (originalPath === "/for-businesses") {
    url.pathname = "/landing/for-businesses";
    return NextResponse.rewrite(url);
  }

  if (originalPath === "/updates") {
    url.pathname = "/landing/updates";
    return NextResponse.rewrite(url);
  }

  if (originalPath === "/directory" || originalPath.startsWith("/directory/")) {
    url.pathname = `/landing${originalPath}`;
    return NextResponse.rewrite(url);
  }

  // If trying to access application paths directly on the root domain,
  // redirect to the personal 'my' subdomain.
  const APP_ROUTES = [
    "/home",
    "/today",
    "/explore",
    "/life",
    "/hobby",
    "/tools",
    "/studio",
    "/list",
    "/discover",
    "/profile",
    "/friends",
    "/ai-chat",
    "/sign-in",
    "/sign-up",
    "/login",
    "/apps",
    "/dashboard",
  ];
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
