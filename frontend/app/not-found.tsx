"use client";

import { useEffect } from "react";
import { getRootHomeUrl, isCapacitorNative } from "@/lib/apps";

export default function NotFound() {
  useEffect(() => {
    if (isCapacitorNative()) {
      window.location.href = getRootHomeUrl();
      return;
    }

    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;

    const parts = hostname.split(".");
    const isLocal = hostname.endsWith("localhost") || hostname === "127.0.0.1";

    let redirectUrl = "";
    if (isLocal) {
      if (parts.length > 1 && parts[parts.length - 1] === "localhost") {
        const subdomain = parts.slice(0, -1).join(".");
        if (subdomain && subdomain !== "my") {
          redirectUrl = `${protocol}//${subdomain}.localhost${port}/`;
        }
      }
    } else {
      const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
      if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
        const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
        if (subdomain && subdomain !== "my") {
          redirectUrl = `${protocol}//${subdomain}.${ROOT_DOMAIN}${port}/`;
        }
      }
    }

    // Fallback to global root home if no valid subdomain is detected
    window.location.href = redirectUrl || getRootHomeUrl();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-bold">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
