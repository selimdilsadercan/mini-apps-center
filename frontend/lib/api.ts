/**
 * Encore API Client Helper
 * Server-side Encore client oluşturmak için kullanılır
 */

import Client, { Environment, Local } from "./client";

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

// Environment'a göre doğru baseURL seçimi
function getBaseURL() {
  const platform = getPlatform();
  const isWeb = platform === "web";
  const isNative = platform === "ios" || platform === "android";
  
  // Browser ortamında hostname kontrolü
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    
    // Sadece WEB ortamında ve LOCALHOST ise yerel Encore'a bağlan
    if (isWeb && (hostname === "localhost" || hostname === "127.0.0.1")) {
      return Local;
    }
    
    // Native (iOS/Android) veya prod/staging web ise staging'e bağlan
    return Environment("staging");
  }

  // Server ortamı için (Server Actions vs)
  const environment =
    process.env.NEXT_PUBLIC_ENCORE_ENVIRONMENT ||
    process.env.ENCORE_ENVIRONMENT ||
    "staging";

  if (environment === "local") {
    return Local;
  }

  return Environment(environment);
}

/**
 * Server tarafında Encore client oluşturur
 * "use server" actions içinde kullanılır
 */
export async function createServerClient(): Promise<Client> {
  const baseURL = getBaseURL();
  return new Client(baseURL);
}

/**
 * Client tarafında Encore client oluşturur
 * Client component'lerde kullanılır (not recommended, use server actions instead)
 */
export function createBrowserClient(): Client {
  const baseURL = getBaseURL();
  return new Client(baseURL);
}

// Re-export types from client
export type { ClientOptions, BaseURL } from "./client";
