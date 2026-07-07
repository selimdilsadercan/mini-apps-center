"use client";

import { useEffect, useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { App } from "@capacitor/app";
import { createBrowserClient } from "@/lib/api";
import { Loader2, Download, CheckCircle2 } from "lucide-react";
import {
  formatCapgoVersion,
  getEffectiveBuildNumber,
  notifyOTAReady,
  recoverFailedBundles,
} from "@/lib/ota-build";
import { otaDebugLog, setOTAServerInfo } from "@/lib/ota-debug";

interface OTAState {
  isDownloading: boolean;
  progress: number;
  isReady: boolean;
}

async function applyDownloadedBundle(bundle: { id: string }) {
  otaDebugLog(`Bundle uygulanıyor: ${bundle.id} → next + reload`);
  sessionStorage.setItem("ota_reloaded", "true");
  await CapacitorUpdater.next({ id: bundle.id });
  await CapacitorUpdater.reload();
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
      await recoverFailedBundles();

      const platform = Capacitor.getPlatform();
      const currentBuildNumber = await getEffectiveBuildNumber();
      otaDebugLog(`checkUpdate: effective=b${currentBuildNumber}`);
      const api = createBrowserClient();

      const result = await api.ota.checkUpdate({
        platform,
        currentBuildNumber,
      });

      setOTAServerInfo(
        result.latestBundle?.build_number ?? null,
        result.updateAvailable ?? false
      );

      if (result.updateAvailable && result.latestBundle) {
        const latestBuild = result.latestBundle.build_number;
        otaDebugLog(`Sunucu: b${latestBuild} mevcut (şu an b${currentBuildNumber})`);

        if (latestBuild <= currentBuildNumber) {
          otaDebugLog("Güncelleme atlandı: zaten güncel");
          isUpdatingRef.current = false;
          return;
        }

        const capgoVersion = formatCapgoVersion(result.latestBundle.version, latestBuild);
        otaDebugLog(`İndirme başlıyor: ${capgoVersion}`);
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
          otaDebugLog(`İndirme tamam: ${bundle.id}`);
          await new Promise((r) => setTimeout(r, 400));
          await applyDownloadedBundle(bundle);
        } finally {
          listener.remove();
        }
      } else {
        otaDebugLog("Sunucuda yeni güncelleme yok");
        isUpdatingRef.current = false;
      }
    } catch (error) {
      otaDebugLog(`Kritik hata: ${error}`, "error");
      setState((s) => ({ ...s, isDownloading: false, isReady: false, progress: 0 }));
      isUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void notifyOTAReady().catch((e) => {
      console.error("[OTA] notifyAppReady backup failed:", e);
    });

    const hadReload = sessionStorage.getItem("ota_reloaded") === "true";
    if (hadReload) {
      sessionStorage.removeItem("ota_reloaded");
      otaDebugLog("OTA reload sonrası açılış");
    }

    const updateTimer = window.setTimeout(() => {
      void checkAndApplyUpdates();
    }, hadReload ? 2500 : 1500);

    const resumeListener = App.addListener("resume", () => {
      otaDebugLog("App resume");
      void notifyOTAReady().catch(() => {});
      if (!isUpdatingRef.current) {
        void recoverFailedBundles().then(() => checkAndApplyUpdates());
      }
    });

    const failedListener = CapacitorUpdater.addListener("updateFailed", (ev) => {
      otaDebugLog(`updateFailed event: ${ev?.bundle?.id ?? "?"}`, "rollback");
      isUpdatingRef.current = false;
      void recoverFailedBundles().then(() => checkAndApplyUpdates());
    });

    const downloadFailedListener = CapacitorUpdater.addListener("downloadFailed", (ev) => {
      otaDebugLog(`downloadFailed: ${JSON.stringify(ev)}`, "error");
    });

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
        await applyDownloadedBundle(result);
      } catch (err) {
        console.error("[OTA] Manuel kurulum hatası:", err);
        setState((s) => ({ ...s, isDownloading: false, isReady: false, progress: 0 }));
        isUpdatingRef.current = false;
      } finally {
        dlListener?.remove();
      }
    };

    window.addEventListener("ota-force-install", handleForceInstall);

    return () => {
      window.clearTimeout(updateTimer);
      void resumeListener.then((l) => l.remove());
      void failedListener.then((l) => l.remove());
      void downloadFailedListener.then((l) => l.remove());
      window.removeEventListener("ota-force-install", handleForceInstall);
    };
  }, []);

  return (
    <>
      {(state.isDownloading || state.isReady) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAF9F7]/95 backdrop-blur-sm px-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            {state.isDownloading ? (
              <>
                <div className="relative w-20 h-20 mx-auto mb-6 text-[#FF6B35]">
                  <Download className="w-10 h-10 absolute inset-0 m-auto animate-bounce text-[#FF6B35]" />
                  <svg className="w-20 h-20 rotate-[-90deg]">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={226}
                      strokeDashoffset={226 - (226 * state.progress) / 100}
                      className="text-[#FF6B35] transition-all duration-300"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Güncelleme</h2>
                <p className="text-gray-600 text-sm mb-4">Yeni sürüm indiriliyor...</p>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#FF6B35] h-full transition-all duration-300" style={{ width: `${state.progress}%` }} />
                </div>
                <p className="text-gray-500 text-sm font-medium mt-3">%{Math.round(state.progress)}</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-14 h-14 text-[#FF6B35] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tamamlandı</h2>
                <p className="text-gray-600 text-sm">Uygulama yeni sürümle açılıyor...</p>
                <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin mx-auto mt-4" />
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </>
  );
}
