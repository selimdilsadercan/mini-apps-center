"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";

export default function Page() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-2xl rotate-45 flex items-center justify-center shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20">
          <span className="text-white font-bold text-xl select-none animate-spin">✦</span>
        </div>
      </div>
    </div>
  );
}
