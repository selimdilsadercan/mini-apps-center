"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  ChefHat,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/api";
import { getAppRootUrl, isCapacitorNative } from "@/lib/apps";
import { useNotifications } from "@/hooks/use-notifications";

const ITU_YEMEKHANE_APP_KEY = "itu_yemekhane";

export default function YemekhaneNotificationsPage() {
  const { user, isAuthenticated } = useAuthContext();
  const {
    permission,
    handleRequestPermission,
    loading: pushLoading,
    isNativePushSupported,
  } = useNotifications();

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const client = createBrowserClient();
      const res = await client.users.getNotificationOptIns(user.uid);
      const app = res.apps[ITU_YEMEKHANE_APP_KEY];
      setEnabled(app?.enabled === true);
    } catch (err) {
      console.error("loadPreferences:", err);
      setError("Ayarlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const saveEnabled = async (next: boolean) => {
    if (!user?.uid) return;

    setSaving(true);
    setError(null);
    try {
      const client = createBrowserClient();
      const res = await client.users.setNotificationAppOptIn({
        clerkId: user.uid,
        appKey: ITU_YEMEKHANE_APP_KEY,
        patch: { enabled: next },
      });
      setEnabled(res.app.enabled === true);
    } catch (err) {
      console.error("saveEnabled:", err);
      setError("Ayar kaydedilemedi.");
      void loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!isAuthenticated || !user?.uid) {
      setError("Bildirimler için giriş yapmalısın.");
      return;
    }

    const next = !enabled;

    if (next && isNativePushSupported) {
      await handleRequestPermission();
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive !== "granted") {
        setError("Bildirim izni verilmedi. Ayarlardan açabilirsin.");
        return;
      }
    }

    await saveEnabled(next);
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b h-16 px-4 flex items-center">
        <div className="max-w-lg mx-auto w-full flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              window.location.href = getAppRootUrl();
            }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline text-sm font-medium pr-2">Geri Dön</span>
          </button>

          <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 uppercase text-slate-800 dark:text-slate-100">
            <Bell className="w-5 h-5 text-[#EAB308]" />
            Bildirimler
          </h1>

          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        {!isAuthenticated && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-4 text-sm text-amber-900 dark:text-amber-200">
            Menü bildirimlerini açmak için giriş yap.
          </div>
        )}

        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-black text-slate-800 dark:text-white text-lg">
                Yemekhane Bildirimleri
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Açıkken günün menüsü sabah ve akşam push olarak gelir.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={!isAuthenticated || loading || saving || pushLoading}
              onClick={() => void handleToggle()}
              className={`relative shrink-0 w-14 h-8 rounded-full transition-colors ${
                enabled ? "bg-[#EAB308]" : "bg-slate-200 dark:bg-slate-700"
              } ${!isAuthenticated || loading || saving || pushLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {loading && (
            <p className="text-xs text-slate-400 mt-4">Yükleniyor...</p>
          )}
          {error && (
            <p className="text-xs text-red-500 mt-4 font-medium">{error}</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Gönderim Saatleri
          </h3>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-50/80 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
            <div className="p-3 rounded-xl bg-orange-500 text-white">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Öğle Menüsü</p>
              <p className="text-sm text-slate-500">Her gün saat 08:00</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div className="p-3 rounded-xl bg-indigo-500 text-white">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Akşam Menüsü</p>
              <p className="text-sm text-slate-500">Her gün saat 15:00</p>
            </div>
          </div>
        </section>

        {!isCapacitorNative() && (
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-600 dark:text-slate-400">
            <Smartphone className="w-5 h-5 shrink-0 mt-0.5 text-slate-400" />
            <p>
              Push bildirimler yalnızca mobil uygulamada (iOS/Android) çalışır. Web&apos;de
              ayarı kaydedebilirsin; bildirimler telefonuna gelir.
            </p>
          </div>
        )}

        {isNativePushSupported && permission === "denied" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300">
            Cihaz bildirim izni kapalı. iOS/Android ayarlarından Everything için bildirimleri
            aç.
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <ChefHat className="w-4 h-4 text-[#EAB308]" />
          <span>Sevmediğin yemekler menüdeyse uyarı bildirimi gönderilir.</span>
        </div>
      </main>
    </div>
  );
}
