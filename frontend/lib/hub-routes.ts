import { isCapacitorNative } from "./app-root";

/** Internal Next.js app directory prefix — file system routes live under /home/* */
export const HUB_INTERNAL_PREFIX = "/home";

export type HubRouteKey =
  | "root"
  | "today"
  | "explore"
  | "life"
  | "hobby"
  | "tools"
  | "studio"
  | "profile"
  | "profileEdit"
  | "list";

const HUB_SEGMENTS: Record<Exclude<HubRouteKey, "root">, string> = {
  today: "/today",
  explore: "/explore",
  life: "/life",
  hobby: "/hobby",
  tools: "/tools",
  studio: "/studio",
  profile: "/profile",
  profileEdit: "/profile/edit",
  list: "/list",
};

/** Paths served on the `my` subdomain (no /home prefix in the URL bar). */
export const MY_SUBDOMAIN_HUB_PREFIXES = [
  "/today",
  "/explore",
  "/life",
  "/hobby",
  "/tools",
  "/studio",
  "/profile",
  "/list",
] as const;

export function isMySubdomainHost(hostname: string): boolean {
  if (hostname === "my.localhost") return true;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return hostname === `my.${rootDomain}`;
}

export function isMySubdomain(): boolean {
  if (typeof window === "undefined") return false;
  if (isCapacitorNative()) return false;
  return isMySubdomainHost(window.location.hostname);
}

/** Strip optional /home prefix for route matching. */
export function normalizeHubPathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/today";
  if (pathname === "/home") return "/today";
  if (pathname.startsWith("/home/")) return pathname.slice("/home".length);
  return pathname;
}

export function matchHubRoute(pathname: string): HubRouteKey | null {
  const path = normalizeHubPathname(pathname);

  if (path === "/today") return "today";
  if (path === "/explore" || path.startsWith("/explore/")) return "explore";
  if (path === "/life" || path.startsWith("/life/")) return "life";
  if (path === "/hobby" || path.startsWith("/hobby/")) return "hobby";
  if (path === "/tools" || path.startsWith("/tools/")) return "tools";
  if (path === "/studio" || path.startsWith("/studio/")) return "studio";
  if (path === "/profile/edit" || path.startsWith("/profile/edit/")) return "profileEdit";
  if (path === "/profile" || path.startsWith("/profile/")) return "profile";
  if (path === "/list" || path.startsWith("/list/")) return "list";

  return null;
}

/**
 * Public hub path for links and redirects.
 * - my subdomain: /today, /life, …
 * - Capacitor / native: /home/today, /home/life, …
 */
export function hubPath(
  route: HubRouteKey,
  options?: { query?: Record<string, string> }
): string {
  const segment =
    route === "root"
      ? "/today"
      : HUB_SEGMENTS[route];

  const useInternalPrefix = isCapacitorNative() || process.env.NEXT_PUBLIC_CAPACITOR === "true";
  const base = useInternalPrefix ? `${HUB_INTERNAL_PREFIX}${segment}` : segment;

  if (!options?.query || Object.keys(options.query).length === 0) {
    return base;
  }

  const params = new URLSearchParams(options.query);
  return `${base}?${params.toString()}`;
}

/** Default hub entry path (used by app root helpers). */
export function getHubRootPath(): string {
  return hubPath("today");
}

export function isMySubdomainCleanPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return MY_SUBDOMAIN_HUB_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function toInternalHubPath(pathname: string): string | null {
  const normalized = normalizeHubPathname(pathname);
  if (normalized === "/today") return `${HUB_INTERNAL_PREFIX}/today`;
  const route = matchHubRoute(pathname);
  if (!route || route === "root") return null;
  return `${HUB_INTERNAL_PREFIX}${HUB_SEGMENTS[route]}`;
}

export function toCleanHubPath(pathname: string): string {
  return normalizeHubPathname(pathname);
}
