import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { APP_CONFIG } from "@/lib/config";

export const OTA_DEBUG_PANEL_ENABLED = false;
export const OTA_BUILD_STORAGE_KEY = "ota_installed_build_number";

function parseBuildFromCapgoVersion(version: string): number | null {
  const match = version.match(/-b(\d+)$/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function getEffectiveBuildNumberLocal(): Promise<number> {
  const builtinBuild = Number(APP_CONFIG.buildNumber);
  if (!Capacitor.isNativePlatform()) return builtinBuild;
  try {
    const { bundle } = await CapacitorUpdater.current();
    if (bundle.id !== "builtin") {
      const capgoBuild = parseBuildFromCapgoVersion(bundle.version);
      if (capgoBuild !== null) return capgoBuild;
    }
    return builtinBuild;
  } catch {
    return builtinBuild;
  }
}

export type OTALogLevel = "info" | "warn" | "error" | "rollback";

export interface OTALogEntry {
  ts: string;
  level: OTALogLevel;
  message: string;
}

export interface OTAStatusSnapshot {
  platform: string;
  bundleId: string;
  bundleVersion: string;
  bundleStatus: string;
  isBuiltin: boolean;
  configBuild: number;
  configVersion: string;
  effectiveBuild: number;
  storedBuild: string | null;
  nativeVersion: string;
  nextBundleId: string | null;
  failedBundleId: string | null;
  localBundles: string;
  serverLatestBuild: number | null;
  serverUpdateAvailable: boolean;
  hadOtaReload: boolean;
  updatedAt: string;
}

const LAST_BUNDLE_KEY = "ota_debug_last_bundle_id";
const logs: OTALogEntry[] = [];
const listeners = new Set<() => void>();

export function otaDebugLog(message: string, level: OTALogLevel = "info") {
  const entry: OTALogEntry = {
    ts: new Date().toLocaleTimeString("tr-TR"),
    level,
    message,
  };
  logs.unshift(entry);
  if (logs.length > 100) logs.pop();
  listeners.forEach((fn) => fn());
  console.log(`[OTA:${level}] ${message}`);
}

export function subscribeOTADebug(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOTALogs(): OTALogEntry[] {
  return [...logs];
}

function detectRollback(bundleId: string) {
  if (typeof window === "undefined") return;
  const prev = sessionStorage.getItem(LAST_BUNDLE_KEY);
  if (prev && prev !== "builtin" && bundleId === "builtin") {
    otaDebugLog(`ROLLBACK: ${prev} → builtin (Capgo eski bundle'a döndü)`, "rollback");
  }
  sessionStorage.setItem(LAST_BUNDLE_KEY, bundleId);
}

let serverCache: { build: number | null; available: boolean } = {
  build: null,
  available: false,
};

export function setOTAServerInfo(build: number | null, available: boolean) {
  serverCache = { build, available };
}

export async function collectOTAStatus(): Promise<OTAStatusSnapshot> {
  const platform = Capacitor.getPlatform();
  const storedBuild =
    typeof window !== "undefined" ? localStorage.getItem(OTA_BUILD_STORAGE_KEY) : null;
  const hadOtaReload =
    typeof window !== "undefined" && sessionStorage.getItem("ota_reloaded") === "true";

  let bundleId = "?";
  let bundleVersion = "?";
  let bundleStatus = "?";
  let nativeVersion = "?";
  let nextBundleId: string | null = null;
  let failedBundleId: string | null = null;
  let localBundles = "-";
  let effectiveBuild = Number(APP_CONFIG.buildNumber);

  if (Capacitor.isNativePlatform()) {
    try {
      const current = await CapacitorUpdater.current();
      bundleId = current.bundle.id;
      bundleVersion = current.bundle.version;
      bundleStatus = current.bundle.status;
      nativeVersion = current.native;
      detectRollback(bundleId);
    } catch (e) {
      otaDebugLog(`current() hata: ${e}`, "error");
    }

    try {
      effectiveBuild = await getEffectiveBuildNumberLocal();
    } catch {
      // keep config build
    }

    try {
      const next = await CapacitorUpdater.getNextBundle();
      nextBundleId = next?.id ?? null;
    } catch {
      // ignore
    }

    try {
      const failed = await CapacitorUpdater.getFailedUpdate();
      failedBundleId = failed?.bundle?.id ?? null;
    } catch {
      // ignore
    }

    try {
      const { bundles } = await CapacitorUpdater.list();
      localBundles = bundles
        .map((b) => `${b.id.slice(0, 8)}… v${b.version} [${b.status}]`)
        .join(" | ");
    } catch {
      // ignore
    }
  }

  return {
    platform,
    bundleId,
    bundleVersion,
    bundleStatus,
    isBuiltin: bundleId === "builtin",
    configBuild: Number(APP_CONFIG.buildNumber),
    configVersion: APP_CONFIG.version,
    effectiveBuild,
    storedBuild,
    nativeVersion,
    nextBundleId,
    failedBundleId,
    localBundles,
    serverLatestBuild: serverCache.build,
    serverUpdateAvailable: serverCache.available,
    hadOtaReload,
    updatedAt: new Date().toLocaleTimeString("tr-TR"),
  };
}

export function parseCapgoBuild(version: string): string {
  const b = parseBuildFromCapgoVersion(version);
  return b !== null ? String(b) : "?";
}
