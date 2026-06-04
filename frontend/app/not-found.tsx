"use client";

import { useEffect } from "react";
import { getRootHomeUrl } from "@/lib/apps";

export default function NotFound() {
  useEffect(() => {
    // Redirect to root domain home
    window.location.href = getRootHomeUrl();
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
