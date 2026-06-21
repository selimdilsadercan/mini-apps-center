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

// Browser base URL — web uses same-origin proxy (all hostnames + subdomains)
function getBrowserBaseURL() {
  const platform = getPlatform();
  const isNative = platform === "ios" || platform === "android";

  if (isNative) {
    const env = process.env.NEXT_PUBLIC_ENCORE_ENVIRONMENT || "staging";
    return Environment(env);
  }

  const hostname = window.location.hostname;
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  const isLocalIP =
    isIP &&
    (hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      (hostname.startsWith("172.") &&
        parseInt(hostname.split(".")[1]) >= 16 &&
        parseInt(hostname.split(".")[1]) <= 31));

  // Phone browser on LAN hits Encore directly
  if (isLocalIP || hostname === "127.0.0.1") {
    return `http://${hostname}:4000`;
  }

  // localhost, *.localhost, my.allminiapps.com, budget.allminiapps.com, etc.
  return "/encore-api";
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
