import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { APP_CONFIG } from "@/lib/config";
import { otaDebugLog, OTA_BUILD_STORAGE_KEY } from "@/lib/ota-debug";

export { OTA_BUILD_STORAGE_KEY } from "@/lib/ota-debug";

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

function isNativeApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() !== "web";
}

/**
 * Gerçekte çalışan bundle'ın build numarası.
 * Capgo rollback sonrası localStorage şişmesini önler.
 */
export async function getEffectiveBuildNumber(): Promise<number> {
  const builtinBuild = Number(APP_CONFIG.buildNumber);

  if (!isNativeApp()) return builtinBuild;

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

    clearPersistedBuild();
    otaDebugLog("builtin bundle aktif — localStorage temizlendi", "warn");
    return builtinBuild;
  } catch {
    clearPersistedBuild();
    return builtinBuild;
  }
}

export async function notifyOTAReady(): Promise<void> {
  if (!isNativeApp()) return;
  await CapacitorUpdater.notifyAppReady();
}

/**
 * Rollback sonrası hatalı bundle'ları sil — Capgo aynı bundle'ı tekrar denemeyebilir.
 */
export async function recoverFailedBundles(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const failed = await CapacitorUpdater.getFailedUpdate();
    if (failed?.bundle?.id && failed.bundle.id !== "builtin") {
      otaDebugLog(`Failed bundle siliniyor: ${failed.bundle.id}`, "warn");
      try {
        await CapacitorUpdater.delete({ id: failed.bundle.id });
      } catch {
        // aktif veya next olabilir
      }
    }

    const { bundles } = await CapacitorUpdater.list();
    const { bundle: current } = await CapacitorUpdater.current();
    const next = await CapacitorUpdater.getNextBundle();

    for (const b of bundles) {
      if (b.id === "builtin" || b.id === current.id || b.id === next?.id) continue;
      if (b.status === "error") {
        try {
          await CapacitorUpdater.delete({ id: b.id });
        } catch {
          // ignore
        }
      }
    }

    if (current.id === "builtin") {
      clearPersistedBuild();
    }
  } catch (error) {
    console.error("[OTA] recoverFailedBundles:", error);
  }
}

let bootstrapStarted = false;

/**
 * Mümkün olan en erken notifyAppReady — React/provider yüklenmeden önce çalışmalı.
 */
export function startOTABootstrap() {
  if (bootstrapStarted || typeof window === "undefined" || !isNativeApp()) return;
  bootstrapStarted = true;
  otaDebugLog("Bootstrap başladı — notifyAppReady deneniyor");

  const attemptNotify = async (attempt: number): Promise<void> => {
    try {
      await CapacitorUpdater.notifyAppReady();
      otaDebugLog(`notifyAppReady OK (deneme ${attempt + 1})`);
      return;
    } catch (error) {
      if (attempt >= 40) {
        otaDebugLog(`notifyAppReady 40 denemede başarısız: ${error}`, "error");
        return;
      }
      await new Promise((r) => setTimeout(r, 250));
      return attemptNotify(attempt + 1);
    }
  };

  void attemptNotify(0);

  // İlk 15 sn boyunca güvenlik ağı
  let pings = 0;
  const interval = window.setInterval(() => {
    pings += 1;
    void CapacitorUpdater.notifyAppReady().catch(() => {});
    if (pings >= 5) window.clearInterval(interval);
  }, 3000);
}
