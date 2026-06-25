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

export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;

  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  if (cap?.isNativePlatform?.()) return true;

  const protocol = window.location.protocol;
  if (protocol === "capacitor:" || protocol === "ionic:") return true;

  return process.env.NEXT_PUBLIC_CAPACITOR === "true";
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

/** Hub ana sayfası path'i (Capacitor + web aynı origin). */
export const APP_HOME_PATH = "/home";

/**
 * Geri dön / hub linki.
 * Capacitor'da relative path; web'de my subdomain tam URL.
 */
export function getAppRootUrl(): string {
  if (typeof window === "undefined") return APP_HOME_PATH;

  if (isCapacitorNative()) {
    return APP_HOME_PATH;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (isLocalWebDev(hostname)) {
    const primary = port ? `my.localhost:${port}` : "my.localhost";
    return `${protocol}//${primary}/dashboard`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//my.${rootDomain}/dashboard`;
}

/**
 * /home hub URL'i — tam sayfa yönlendirme için.
 */
export function getRootHomeUrl(): string {
  if (typeof window === "undefined") return APP_HOME_PATH;

  if (isCapacitorNative()) {
    return APP_HOME_PATH;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  if (isLocalWebDev(hostname)) {
    const primary = port ? `localhost:${port}` : "localhost";
    return `${protocol}//${primary}${APP_HOME_PATH}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//${rootDomain}${APP_HOME_PATH}`;
}

/**
 * Hub'a git — router varsa client-side, yoksa location.
 */
export function navigateToAppRoot(router?: { push: (href: string) => void }): void {
  const target = getAppRootUrl();

  if (router && (target.startsWith("/") || isCapacitorNative())) {
    router.push(target.startsWith("/") ? target : APP_HOME_PATH);
    return;
  }

  window.location.href = target.startsWith("http") ? target : getRootHomeUrl();
}
