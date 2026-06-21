/**
 * Encore API Client Helper
 * Server-side Encore client oluşturmak için kullanılır
 */

import Client, { Environment, Local } from "./client";
import { APP_CONFIG } from "./config";

// Platform algılama için yardımcı fonksiyon (Browser güvenli)
function getPlatform() {
  if (typeof window !== "undefined") {
    // Capacitor varsa platformu oradan al
    const globalCapacitor = (window as any).Capacitor;
    if (globalCapacitor?.getPlatform) {
      return globalCapacitor.getPlatform();
    }
  }
  return "web";
}

function isLocalDevHostname(hostname: string, isNative: boolean): boolean {
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  const isLocalIP =
    isIP &&
    (hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      (hostname.startsWith("172.") &&
        parseInt(hostname.split(".")[1]) >= 16 &&
        parseInt(hostname.split(".")[1]) <= 31));

  return (
    !isNative &&
    (hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost") ||
      isLocalIP)
  );
}

// Server-side base URL (SSR, server actions)
function getServerBaseURL() {
  const environment =
    process.env.NEXT_PUBLIC_ENCORE_ENVIRONMENT ||
    process.env.ENCORE_ENVIRONMENT ||
    "staging";

  if (environment === "local") {
    return Local;
  }

  return Environment(environment);
}

// Browser base URL — local dev uses same-origin proxy to avoid CORS issues
function getBrowserBaseURL() {
  const platform = getPlatform();
  const isNative = platform === "ios" || platform === "android";
  const hostname = window.location.hostname;

  if (isLocalDevHostname(hostname, isNative)) {
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    const isLocalIP =
      isIP &&
      (hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        (hostname.startsWith("172.") &&
          parseInt(hostname.split(".")[1]) >= 16 &&
          parseInt(hostname.split(".")[1]) <= 31));

    // Device on LAN hits Encore directly; browser dev goes through Next proxy
    if (isLocalIP) {
      return `http://${hostname}:4000`;
    }

    return "/encore-api";
  }

  const env = process.env.NEXT_PUBLIC_ENCORE_ENVIRONMENT || "staging";
  return Environment(env);
}

function getBaseURL() {
  if (typeof window !== "undefined") {
    return getBrowserBaseURL();
  }

  return getServerBaseURL();
}

/**
 * Server tarafında Encore client oluşturur
 * "use server" actions içinde kullanılır
 */
export async function createServerClient(): Promise<Client> {
  const baseURL = getBaseURL();
  return new Client(baseURL, {
    requestInit: {
      headers: {
        "X-App-Version": APP_CONFIG.version,
      },
    },
  });
}

/**
 * Client tarafında Encore client oluşturur
 * Client component'lerde kullanılır (not recommended, use server actions instead)
 */
export function createBrowserClient(): Client {
  const baseURL = getBaseURL();
  return new Client(baseURL, {
    requestInit: {
      headers: {
        "X-App-Version": APP_CONFIG.version,
      },
    },
  });
}

// Re-export types from client
export type { ClientOptions, BaseURL } from "./client";
