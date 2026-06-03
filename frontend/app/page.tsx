"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import LandingPage from "@/components/landing/LandingPage";

export default function Page() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  // If loading authentication state, show a clean loader
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl rotate-45 flex items-center justify-center">
            <span className="text-white font-bold text-xl select-none animate-spin">✦</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to home if signed in
  if (isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl rotate-45 flex items-center justify-center">
            <span className="text-white font-bold text-xl select-none animate-spin">✦</span>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show the landing page
  return <LandingPage />;
}
