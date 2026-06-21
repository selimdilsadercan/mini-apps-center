"use client";

import { useEffect, useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { createBrowserClient } from "@/lib/api";
import { APP_CONFIG } from "@/lib/config";
import { Loader2, Download, CheckCircle2 } from "lucide-react";

interface OTAState {
  isDownloading: boolean;
  progress: number;
  isReady: boolean;
}

const OTA_BUILD_STORAGE_KEY = "ota_installed_build_number";

function formatCapgoVersion(version: string, buildNumber: number) {
  return `${version}-b${buildNumber}`;
}

function parseBuildFromCapgoVersion(version: string): number | null {
  const match = version.match(/-b(\d+)$/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function getEffectiveBuildNumber(): Promise<number> {
  let build = Number(APP_CONFIG.buildNumber);

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(OTA_BUILD_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed)) {
        build = Math.max(build, parsed);
      }
    }
  }

  try {
    const { bundle } = await CapacitorUpdater.current();
    if (bundle.id !== "builtin") {
      const capgoBuild = parseBuildFromCapgoVersion(bundle.version);
      if (capgoBuild !== null) {
        build = Math.max(build, capgoBuild);
      }
    }
  } catch {
    // Capgo current() bazen ilk açılışta hazır olmayabilir
  }

  return build;
}

function persistInstalledBuild(buildNumber: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OTA_BUILD_STORAGE_KEY, String(buildNumber));
}

export default function OTAProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OTAState>({
    isDownloading: false,
    progress: 0,
    isReady: false,
  });

  const isUpdatingRef = useRef(false);

  const checkAndApplyUpdates = async () => {
    if (isUpdatingRef.current) return;

    try {
      isUpdatingRef.current = true;
      const platform = Capacitor.getPlatform();
      const currentBuildNumber = await getEffectiveBuildNumber();
      const api = createBrowserClient();

      const result = await api.ota.checkUpdate({
        platform,
        currentBuildNumber,
      });

      if (result.updateAvailable && result.latestBundle) {
        const latestBuild = result.latestBundle.build_number;

        if (latestBuild <= currentBuildNumber) {
          isUpdatingRef.current = false;
          return;
        }

        const capgoVersion = formatCapgoVersion(result.latestBundle.version, latestBuild);
        setState((s) => ({ ...s, isDownloading: true }));

        const listener = await CapacitorUpdater.addListener("download", (data) => {
          setState((s) => ({ ...s, progress: data.percent }));
        });

        try {
          const downloadPromise = CapacitorUpdater.download({
            url: result.latestBundle.bundle_url,
            version: capgoVersion,
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("İndirme zaman aşımına uğradı (60sn)")), 60000)
          );

          const bundle = (await Promise.race([downloadPromise, timeoutPromise])) as Awaited<
            ReturnType<typeof CapacitorUpdater.download>
          >;

          setState((s) => ({ ...s, isDownloading: false, isReady: true, progress: 100 }));

          await new Promise((r) => setTimeout(r, 1000));

          sessionStorage.setItem("ota_reloaded", "true");
          persistInstalledBuild(latestBuild);
          await CapacitorUpdater.set(bundle);
        } finally {
          listener.remove();
        }
      } else {
        isUpdatingRef.current = false;
      }
    } catch (error) {
      console.error("[OTA] Kritik Hata:", error);
      setState((s) => ({ ...s, isDownloading: false, isReady: false, progress: 0 }));
      isUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initOTA = async () => {
      try {
        if (Capacitor.getPlatform() !== "web") {
          await CapacitorUpdater.notifyAppReady();
        }
      } catch (e) {
        console.error("[OTA] notifyAppReady failed:", e);
      }
    };

    initOTA();

    const hasReloaded = sessionStorage.getItem("ota_reloaded");

    if (hasReloaded) {
      sessionStorage.removeItem("ota_reloaded");
    } else {
      setTimeout(() => {
        checkAndApplyUpdates();
      }, 3000);
    }

    const handleForceInstall = async (e: Event) => {
      const bundle = (e as CustomEvent).detail;
      if (!bundle) return;

      setState((s) => ({ ...s, isDownloading: true, progress: 0, isReady: false }));

      let dlListener: Awaited<ReturnType<typeof CapacitorUpdater.addListener>> | null = null;
      try {
        dlListener = await CapacitorUpdater.addListener("download", (data) => {
          setState((s) => ({ ...s, progress: data.percent }));
        });

        const capgoVersion = formatCapgoVersion(bundle.version, bundle.build_number);
        const result = await CapacitorUpdater.download({
          url: bundle.bundle_url,
          version: capgoVersion,
        });

        setState((s) => ({ ...s, isDownloading: false, isReady: true, progress: 100 }));

        sessionStorage.setItem("ota_reloaded", "true");
        persistInstalledBuild(bundle.build_number);
        await CapacitorUpdater.set(result);
      } catch (err) {
        console.error("[OTA] Manuel kurulum hatası:", err);
        setState((s) => ({ ...s, isDownloading: false, isReady: false, progress: 0 }));
      } finally {
        dlListener?.remove();
      }
    };

    window.addEventListener("ota-force-install", handleForceInstall);

    return () => {
      window.removeEventListener("ota-force-install", handleForceInstall);
    };
  }, []);

  return (
    <>
      {(state.isDownloading || state.isReady) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md px-4">
          <div className="max-w-xs w-full px-6 py-8 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl text-center">
            {state.isDownloading ? (
              <>
                <div className="relative w-20 h-20 mx-auto mb-6 text-emerald-400">
                  <Download className="w-10 h-10 absolute inset-0 m-auto animate-bounce" />
                  <svg className="w-20 h-20 rotate-[-90deg]">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-700" />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={226}
                      strokeDashoffset={226 - (226 * state.progress) / 100}
                      className="text-emerald-500 transition-all duration-300"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-black text-white mb-2 italic tracking-tight uppercase">Güncelleme</h2>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-4">
                  <div className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_10px_#10b981]" style={{ width: `${state.progress}%` }} />
                </div>
                <p className="text-emerald-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">Yükleniyor: %{Math.round(state.progress)}</p>
              </>
              ) : (
              <>
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-black text-white mb-2 italic">TAMAMLANDI</h2>
                <p className="text-slate-400 text-sm">Uygulama taze kodlarla açılıyor...</p>
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mt-4" />
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </>
  );
}
