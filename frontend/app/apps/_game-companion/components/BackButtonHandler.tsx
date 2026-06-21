"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { App } from "@capacitor/app";

export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only set up the listener on mobile devices
    const setupListener = async () => {
      const listener = await App.addListener("backButton", (data) => {
        // If we're at the root of game-companion or home page, we might want to exit or let Capacitor handle it
        if (pathname === "/apps/game-companion" || pathname === "/") {
          // You could call App.exitApp() here if you want to close the app on back button from home
          return;
        }
        
        // Otherwise, navigate back in the Next.js router
        router.back();
      });

      return () => {
        listener.remove();
      };
    };

    setupListener();
  }, [router, pathname]);

  return null;
}
