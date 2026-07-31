"use client";

import { useEffect } from "react";

/** Best-effort portrait lock for PWA / mobile web (native apps use manifest/plist). */
export function PortraitOrientationLock() {
  useEffect(() => {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (!orientation?.lock) return;

    orientation.lock("portrait").catch(() => {
      // Unsupported, denied, or requires fullscreen — native lock still applies in Capacitor.
    });
  }, []);

  return null;
}
