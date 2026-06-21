"use client";

import { useEffect, useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { createBrowserClient } from "@/lib/api";
import { APP_CONFIG } from "@/lib/config";
import { Loader2, Download, CheckCircle2, Terminal } from "lucide-react";

interface OTAState {
  isChecking: boolean;
  isDownloading: boolean;
  progress: number;
  isReady: boolean;
  error: string | null;
  logs: string[];
}

export default function OTAProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OTAState>({
    isChecking: false,
    isDownloading: false,
    progress: 0,
    isReady: false,
    error: null,
    logs: []
  });

  // useRef ile koruma — closure sorunlarından etkilenmez
  const isUpdatingRef = useRef(false);

  const addLog = (msg: string) => {
    setState((s) => ({ ...s, logs: [msg, ...s.logs].slice(0, 10) }));
  };

  const checkAndApplyUpdates = async () => {
    // Ref-based koruma: closure'dan bağımsız çalışır
    if (isUpdatingRef.current) {
      addLog("⏳ Güncelleme zaten devam ediyor, kontrol atlanıyor.");
      return;
    }

    // Son yüklenen bundle versiyonunu kontrol et — aynı bundle'ı tekrar indirmeyi engelle
    const lastInstalledVersion = sessionStorage.getItem("ota_last_installed_version");

    addLog(`🚀 Kontrol başlatılıyor... Build: ${APP_CONFIG.buildNumber}`);

    try {
      isUpdatingRef.current = true;
      setState((s) => ({ ...s, isChecking: true }));
      const platform = Capacitor.getPlatform();
      const currentBuildNumber = APP_CONFIG.buildNumber;

      addLog(`📡 Sunucuya soruluyor (${platform})...`);

      const api = createBrowserClient();

      // 1. Check backend using standard client
      const result = await api.ota.checkUpdate({
        platform,
        currentBuildNumber: currentBuildNumber
      });

      addLog(`✅ Sunucu cevabı: ${result.updateAvailable ? "YENİ SÜRÜM VAR" : "GÜNCELSİN"}`);

      if (result.updateAvailable && result.latestBundle) {
        // Aynı versiyonu tekrar indirmeyi engelle (döngü koruması)
        if (lastInstalledVersion === result.latestBundle.version) {
          addLog(`🔄 Bu versiyon (${result.latestBundle.version}) zaten yüklendi, atlanıyor.`);
          setState((s) => ({ ...s, isChecking: false }));
          isUpdatingRef.current = false;
          return;
        }

        addLog(`📦 Yeni paket: ${result.latestBundle.version}`);
        setState((s) => ({ ...s, isChecking: false, isDownloading: true }));

        const listener = await CapacitorUpdater.addListener("download", (data) => {
          setState((s) => ({ ...s, progress: data.percent }));
        });

        try {
          addLog("⬇️ İndirme başladı...");
          const bundle = await CapacitorUpdater.download({
            url: result.latestBundle.bundle_url,
            version: result.latestBundle.version
          });

          addLog("💾 Paket cihaza hazırlandı.");
          setState((s) => ({ ...s, isDownloading: false, isReady: true, progress: 100 }));

          // KRİTİK: set() çağrısı ZATEN otomatik reload yapıyor.
          // Bu yüzden sessionStorage flag'lerini set()'ten ÖNCE koymalıyız.
          sessionStorage.setItem("ota_reloaded", "true");
          sessionStorage.setItem("ota_last_installed_version", result.latestBundle.version);

          addLog("♻️ Bundle set ediliyor (otomatik reload olacak)...");
          await CapacitorUpdater.set(bundle);
        } finally {
          listener.remove();
        }
      } else {
        setState((s) => ({ ...s, isChecking: false }));
        isUpdatingRef.current = false;
      }
    } catch (error: any) {
      addLog(`❌ HATA: ${error.message || "Bilinmeyen hata"}`);
      console.error("[OTA] Kritik Hata:", error);
      setState((s) => ({ ...s, isChecking: false, isDownloading: false, error: error.message }));
      isUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      addLog("💻 Web platformu: OTA pasif.");
      return;
    }

    // EN KRİTİK ADIM: Capgo'ya hemen "uygulama çalışıyor" de.
    // Bu çağrı yapılmazsa, Capgo timeout sonrası otomatik rollback yapar → beyaz ekran.
    const initOTA = async () => {
      try {
        if (Capacitor.getPlatform() !== 'web') {
          addLog("📱 Mobil platform: notifyAppReady çağrılıyor...");
          await CapacitorUpdater.notifyAppReady();
          addLog("✅ notifyAppReady başarılı!");
        }
      } catch (e: any) {
        addLog(`⚠️ notifyAppReady hatası: ${e.message}`);
        console.error("[OTA] notifyAppReady failed:", e);
      }
    };

    initOTA();

    const hasReloaded = sessionStorage.getItem("ota_reloaded");

    if (hasReloaded) {
      addLog("ℹ️ Uygulama az önce güncellendi. Stabilize olması bekleniyor...");
      sessionStorage.removeItem("ota_reloaded");
    } else {
      addLog("🚀 Normal başlangıç: 3sn sonra güncelleme kontrolü...");
      setTimeout(() => {
        checkAndApplyUpdates();
      }, 3000);
    }

    // Global event listener for manual installs from Admin UI
    const handleForceInstall = async (e: any) => {
      const bundle = e.detail;
      if (!bundle) return;

      addLog(`🎯 Manuel kurulum tetiklendi: v${bundle.version}`);
      setState((s) => ({ ...s, isDownloading: true, progress: 0, isReady: false }));

      let dlListener: any = null;
      try {
        dlListener = await CapacitorUpdater.addListener("download", (data) => {
          setState((s) => ({ ...s, progress: data.percent }));
        });

        addLog("⬇️ İndiriliyor...");
        const result = await CapacitorUpdater.download({
          url: bundle.bundle_url,
          version: bundle.version
        });

        addLog("💾 Hazırlandı, uygulanıyor...");
        setState((s) => ({ ...s, isDownloading: false, isReady: true, progress: 100 }));

        sessionStorage.setItem("ota_reloaded", "true");
        addLog("♻️ Bundle set ediliyor (otomatik reload olacak)...");
        await CapacitorUpdater.set(result);
      } catch (err: any) {
        addLog(`❌ Hata: ${err.message}`);
        setState((s) => ({ ...s, isDownloading: false }));
      } finally {
        if (dlListener) dlListener.remove();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ota-force-install", handleForceInstall as any);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ota-force-install", handleForceInstall as any);
      }
    };
  }, []);

  // Debug Modu veya İndirme Ekranı
  const showDebugPanel = process.env.NODE_ENV === "development";

  return (
    <>
      {/* İndirme Overlay (Kritik Durumda) */}
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

      {/* Daimi Debug Paneli (Sadece test aşamasında, ekranın en altında) */}
      {showDebugPanel && (
        <div className="fixed bottom-24 left-4 right-4 z-[9998] pointer-events-none opacity-80 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
          <div className="p-2 border-b border-white/5 flex items-center gap-2">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-white/50 tracking-tighter">OTA DEBUG LOG</span>
          </div>
          <div className="p-3 font-mono text-[9px] text-emerald-300 flex flex-col gap-1">
            {state.logs.map((log, i) => (
              <div key={i} className={i === 0 ? "opacity-100 font-bold" : "opacity-40"}>
                {log}
              </div>
            ))}
            {state.error && <div className="text-red-400 font-bold">❌ Error: {state.error}</div>}
          </div>
        </div>
      )}

      {children}
    </>
  );
}
