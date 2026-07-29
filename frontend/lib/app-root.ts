/**
 * Capacitor WebView ve web ortamlarında doğru "root" URL'lerini üretir.
 *
 * Native build'de origin genelde:
 * - Android: https://localhost
 * - iOS (server.hostname ayarlı): https://allminiapps.com
 * - iOS (varsayılan): capacitor://localhost
 *
 * getAppRootUrl() eskiden hostname "localhost" görünce my.localhost'a yönlendiriyordu;
 * Capacitor'da bu geçersiz — aynı origin içinde /home kullanılmalı.
 */

import { getHubRootPath, hubPath, isMySubdomain } from "./hub-routes";

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;

  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  if (cap?.isNativePlatform?.()) return true;

  const protocol = window.location.protocol;
  if (protocol === "capacitor:" || protocol === "ionic:") return true;

  return process.env.NEXT_PUBLIC_CAPACITOR === "true";
}

/** Capacitor iOS native app (Safari / web değil). */
export function isCapacitorIOS(): boolean {
  if (typeof window === "undefined") return false;

  const cap = (window as Window & { Capacitor?: { getPlatform?: () => string } })
    .Capacitor;
  return cap?.getPlatform?.() === "ios";
}

export function getWebViewOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function isLocalWebDev(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

/**
 * Subdomain üzerindeki public paylaşım linki.
 * Capacitor native build'de WebView hostname localhost olsa bile production domain kullanılır.
 */
export function getPublicSubdomainUrl(subdomain: string, path: string): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined" && !isCapacitorNative()) {
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    if (isLocalWebDev(hostname)) {
      const protocol = window.location.protocol;
      return `${protocol}//${subdomain}.localhost${port}${normalizedPath}`;
    }
  }

  return `https://${subdomain}.${rootDomain}${normalizedPath}`;
}

/** Hub ana sayfası path'i — my subdomain'de /today, Capacitor'da /home/today */
export const APP_HOME_PATH = "/home";

export function getAppHomePath(): string {
  return getHubRootPath();
}

export const HOME_TABS = ["discover", "explore", "hobby", "wallet", "life"] as const;
export type HomeTab = (typeof HOME_TABS)[number];

export const HOME_TAB_STORAGE_KEY = "last_active_tab";
const DEFAULT_HOME_TAB: HomeTab = "discover";

export function isValidHomeTab(tab: string | null | undefined): tab is HomeTab {
  return tab != null && (HOME_TABS as readonly string[]).includes(tab);
}

/** Aktif hub sekmesini history + localStorage'a yazar (geri dönüş için). */
export function persistHomeTab(tab: HomeTab): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HOME_TAB_STORAGE_KEY, tab);
  window.history.replaceState({ ...(window.history.state ?? {}), homeTab: tab }, "");
}

/**
 * /home açılışında hangi sekmenin seçileceğini belirler.
 * - ?tab= → AppBar veya uygulama geri tuşu
 * - history.state.homeTab → tarayıcı / router geri
 * - aksi halde → discover (sıfır açılış)
 */
export function resolveInitialHomeTab(queryTab: string | null): HomeTab {
  if (typeof window === "undefined") return DEFAULT_HOME_TAB;
  if (isValidHomeTab(queryTab)) return queryTab;

  const stateTab = window.history.state?.homeTab;
  if (isValidHomeTab(stateTab)) return stateTab;

  return DEFAULT_HOME_TAB;
}

/**
 * Geri dön / hub linki.
 * Capacitor'da relative path; web'de my subdomain tam URL.
 */
export function getAppRootUrl(): string {
  let path = getAppHomePath();
  
  if (typeof window !== "undefined") {
    // Priority 1: If we came from a business profile page, go back there
    const lastBusinessUrl = localStorage.getItem("last_business_url");
    if (lastBusinessUrl) {
      return lastBusinessUrl;
    }

    // Priority 2: Go back to the last active tab on the home page
    const lastTab = localStorage.getItem("last_active_tab");
    if (lastTab && lastTab !== "discover") {
      if (isCapacitorNative()) {
        path = `${APP_HOME_PATH}?tab=${lastTab}`;
      } else if (lastTab === "explore") {
        path = hubPath("explore");
      } else if (lastTab === "life") {
        path = hubPath("life");
      } else if (lastTab === "hobby") {
        path = hubPath("hobby");
      } else if (lastTab === "wallet") {
        path = hubPath("tools");
      } else {
        path = hubPath("today", { query: { tab: lastTab } });
      }
    }
  }

  if (typeof window === "undefined") return path;

  if (isCapacitorNative()) {
    return path.startsWith("/") ? path : APP_HOME_PATH;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (isMySubdomain()) {
    return path;
  }

  if (isLocalWebDev(hostname)) {
    const primary = port ? `my.localhost:${port}` : "my.localhost";
    return `${protocol}//${primary}${path}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//my.${rootDomain}${path}`;
}

/**
 * Public uygulama kataloğu (/directory) — giriş gerektirmez.
 * App veya my subdomain'den root domain'e yönlendirir.
 */
export function getDirectoryUrl(path = "/directory"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") return normalizedPath;

  if (isCapacitorNative()) {
    return normalizedPath;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";

  const isRootHost =
    hostname === rootDomain ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  if (isRootHost) {
    return normalizedPath;
  }

  if (isLocalWebDev(hostname)) {
    const root = port ? `localhost:${port}` : "localhost";
    return `${protocol}//${root}${normalizedPath}`;
  }

  return `${protocol}//${rootDomain}${normalizedPath}`;
}

/**
 * /home hub URL'i — tam sayfa yönlendirme için.
 */
export function getRootHomeUrl(): string {
  const path = getAppHomePath();
  if (typeof window === "undefined") return path;

  if (isCapacitorNative()) {
    return path.startsWith("/home") ? path : `${APP_HOME_PATH}${path === "/today" ? "/today" : path}`;
  }

  if (isMySubdomain()) {
    return path;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (isLocalWebDev(hostname)) {
    const primary = port ? `my.localhost:${port}` : "my.localhost";
    return `${protocol}//${primary}${path}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//my.${rootDomain}${path}`;
}

/**
 * Hub'a git — router varsa client-side, yoksa location.
 */
export function navigateToAppRoot(router?: { push: (href: string) => void }): void {
  const target = getAppRootUrl();

  if (router && (target.startsWith("/") || isCapacitorNative())) {
    router.push(target.startsWith("/") ? target : getAppHomePath());
    return;
  }

  window.location.href = target.startsWith("http") ? target : getRootHomeUrl();
}
