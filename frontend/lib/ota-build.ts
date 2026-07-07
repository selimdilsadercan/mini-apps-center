import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { APP_CONFIG } from "@/lib/config";

export const OTA_BUILD_STORAGE_KEY = "ota_installed_build_number";

export function formatCapgoVersion(version: string, buildNumber: number) {
  return `${version}-b${buildNumber}`;
}

export function parseBuildFromCapgoVersion(version: string): number | null {
  const match = version.match(/-b(\d+)$/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function persistInstalledBuild(buildNumber: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OTA_BUILD_STORAGE_KEY, String(buildNumber));
}

export function clearPersistedBuild() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OTA_BUILD_STORAGE_KEY);
}

/**
 * Gerçekte çalışan bundle'ın build numarası.
 * Capgo rollback sonrası localStorage şişmesini önler.
 */
export async function getEffectiveBuildNumber(): Promise<number> {
  const builtinBuild = Number(APP_CONFIG.buildNumber);

  try {
    const { bundle } = await CapacitorUpdater.current();

    if (bundle.id !== "builtin") {
      const capgoBuild = parseBuildFromCapgoVersion(bundle.version);
      if (capgoBuild !== null) {
        persistInstalledBuild(capgoBuild);
        return capgoBuild;
      }
      return builtinBuild;
    }

    // builtin'e düşüldüyse localStorage'daki yüksek build'e güvenme
    clearPersistedBuild();
    return builtinBuild;
  } catch {
    return builtinBuild;
  }
}

export async function notifyOTAReady(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() === "web") return;
  await CapacitorUpdater.notifyAppReady();
}

// React yüklenmeden önce Capgo'ya "uygulama hazır" de (30sn rollback penceresini kaçırmamak için)
if (typeof window !== "undefined") {
  void notifyOTAReady().catch((error) => {
    console.error("[OTA] early notifyAppReady failed:", error);
  });
}
