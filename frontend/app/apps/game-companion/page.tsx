"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // In UI-only mode, we just redirect to the games list
    router.replace("/apps/game-companion/games");
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-app-bg"
    >
      <div className="text-center">
        <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse mx-auto mb-4"></div>
        <p className="text-app-muted font-bold">Yükleniyor...</p>
      </div>
    </div>
  );
}
