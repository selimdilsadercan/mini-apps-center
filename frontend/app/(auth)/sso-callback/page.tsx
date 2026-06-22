"use client";

import { useEffect } from "react";

// This page acts as a bridge for OAuth.
// - For NATIVE apps (source=native): Forwards auth back via Deep Link
// - For WEB users: Processes normally

export default function SSOCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    let isFromNativeApp = searchParams.get("source") === "native";

    if (hash && !isFromNativeApp) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const state = hashParams.get("state");
      if (state) {
        const decodedState = decodeURIComponent(state);
        isFromNativeApp = decodedState.includes("source=native");
      }
    }

    let token = null;

    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      token = hashParams.get("id_token");
    }

    if (!token) {
      token = searchParams.get("id_token") || searchParams.get("token");
    }

    if (token && isFromNativeApp) {
      const appUrl = `com.everything.apps://oauth-native-callback?token=${encodeURIComponent(token)}`;
      window.location.href = appUrl;
    } else if (token && !isFromNativeApp) {
      console.log("Web login detected, processing token...");
    }
  }, []);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF9F7] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Giriş Yapılıyor</h1>
        <p className="text-gray-600">Lütfen bekleyin, uygulamaya yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
