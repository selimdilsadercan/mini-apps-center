"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellRinging,
  CloudSun,
  Drop,
  SunHorizon,
  Wind,
  Cloud,
  CloudRain,
  Sun,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { createBrowserClient } from "@/lib/api";
import { useNotifications } from "@/hooks/use-notifications";
import { getMockIstanbulWeather, type DailyWeatherSnapshot } from "./mock-weather";
import type { daily_weather } from "@/lib/client";

function WeatherIcon({ icon }: { icon: DailyWeatherSnapshot["icon"] }) {
  const className = "text-sky-300";
  const size = 72;
  switch (icon) {
    case "sun":
      return <Sun size={size} weight="duotone" className={className} />;
    case "cloud":
      return <Cloud size={size} weight="duotone" className={className} />;
    case "rain":
      return <CloudRain size={size} weight="duotone" className={className} />;
    default:
      return <CloudSun size={size} weight="duotone" className={className} />;
  }
}

export default function DailyWeatherPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useTranslations("dailyWeather");
  const { user, isLoaded: isUserLoaded } = useUser();
  const { permission, handleRequestPermission, loading: permissionLoading } =
    useNotifications();

  const [enabled, setEnabled] = useState(true);
  const [notifyHour, setNotifyHour] = useState(7);
  const [notifyMinute, setNotifyMinute] = useState(0);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weather, setWeather] = useState<DailyWeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const lang = locale === "tr" ? "tr" : "en";

  const mapSnapshot = (w: daily_weather.WeatherSnapshot): DailyWeatherSnapshot => ({
    city: w.city,
    dateLabel: w.dateLabel,
    condition: w.condition,
    tempC: w.tempC,
    tempMinC: w.tempMinC,
    tempMaxC: w.tempMaxC,
    humidity: w.humidity,
    windKmh: w.windKmh,
    icon: w.icon,
  });

  useEffect(() => {
    let cancelled = false;
    const loadWeather = async () => {
      try {
        setWeatherLoading(true);
        const client = createBrowserClient();
        const res = await client.daily_weather.getWeather({
          city: "Istanbul",
          locale: lang,
        });
        if (!cancelled) {
          setWeather(mapSnapshot(res.weather));
        }
      } catch (err) {
        console.error("loadWeather:", err);
        if (!cancelled) {
          setWeather(getMockIstanbulWeather(lang));
        }
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    };
    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const isNative =
    typeof window !== "undefined" &&
    (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform?.();

  const loadPreferences = useCallback(async () => {
    if (!user) {
      setPrefsLoading(false);
      return;
    }
    try {
      setPrefsLoading(true);
      const client = createBrowserClient();
      const res = await client.daily_weather.getPreferences(user.id);
      setEnabled(res.preferences.notifications_enabled);
      setNotifyHour(res.preferences.notify_hour);
      setNotifyMinute(res.preferences.notify_minute ?? 0);
    } catch (err) {
      console.error("loadPreferences:", err);
    } finally {
      setPrefsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isUserLoaded) return;
    if (!user) {
      setPrefsLoading(false);
      return;
    }
    const client = createBrowserClient();
    client.users
      .getOrCreateUser({
        clerkId: user.id,
        username:
          user.username ||
          user.fullName ||
          user.primaryEmailAddress?.emailAddress?.split("@")[0],
        avatarUrl: user.imageUrl,
      })
      .catch((err) => console.error("daily-weather user sync:", err));
    loadPreferences();
  }, [isUserLoaded, user, loadPreferences]);

  const persistPreferences = async (
    nextEnabled: boolean,
    hour: number,
    minute: number,
  ) => {
    if (!user) {
      toast.error(t("notifications.signInRequired"));
      return false;
    }
    try {
      setSaving(true);
      const client = createBrowserClient();
      await client.daily_weather.upsertPreferences({
        userId: user.id,
        notificationsEnabled: nextEnabled,
        notifyHour: hour,
        notifyMinute: minute,
        city: "Istanbul",
      });
      toast.success(t("notifications.saved"));
      return true;
    } catch (err) {
      console.error("persistPreferences:", err);
      toast.error(t("notifications.saveFailed"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await persistPreferences(next, notifyHour, notifyMinute);
  };

  const handleTimeChange = async (hour: number, minute: number) => {
    setNotifyHour(hour);
    setNotifyMinute(minute);
    if (saving) return;
    await persistPreferences(enabled, hour, minute);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1929] via-[#0f2744] to-[#0a1628] text-slate-100 flex flex-col">
      <Toaster position="top-center" />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-[90px]" />
      </div>

      <header className="relative z-10 flex items-center gap-3 px-4 pt-6 pb-2 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <SunHorizon size={24} className="text-amber-300" weight="duotone" />
            {t("title")}
          </h1>
          <p className="text-sm text-slate-400 truncate">{t("subtitle")}</p>
        </div>
      </header>

      <main className="relative z-20 flex-1 px-4 pb-10 max-w-lg mx-auto w-full space-y-5 isolate">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5"
        >
          {weatherLoading || !weather ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              {t("loadingWeather")}
            </div>
          ) : (
            <>
              <p className="text-lg font-medium text-slate-200 capitalize mb-4">{weather.dateLabel}</p>

              <div className="flex items-center gap-4">
                <WeatherIcon icon={weather.icon} />
                <div>
                  <p className="text-5xl font-light tabular-nums">{weather.tempC}°</p>
                  <p className="text-slate-300 mt-1">{weather.condition}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {weather.tempMinC}° – {weather.tempMaxC}°
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/20 px-3 py-2.5 flex items-center gap-2">
                  <Drop size={18} className="text-sky-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      {t("stats.humidity")}
                    </p>
                    <p className="text-sm font-medium">{weather.humidity}%</p>
                  </div>
                </div>
                <div className="rounded-xl bg-black/20 px-3 py-2.5 flex items-center gap-2">
                  <Wind size={18} className="text-sky-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      {t("stats.wind")}
                    </p>
                    <p className="text-sm font-medium">{weather.windKmh} km/s</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.section>

        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-4 relative z-20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold flex items-center gap-2">
                <BellRinging size={20} className="text-amber-300" />
                {t("notifications.title")}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{t("notifications.description")}</p>
            </div>
            <button
              type="button"
              disabled={prefsLoading || saving || !user}
              onClick={handleToggle}
              className={`shrink-0 relative h-8 w-14 rounded-full transition-colors ${
                enabled ? "bg-sky-500" : "bg-slate-600"
              } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-pressed={enabled}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  enabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div>
            <p className="text-sm text-slate-300 mb-2">{t("notifications.hourLabel")}</p>
            <div className="flex items-center gap-2">
              <select
                aria-label={t("notifications.hourLabel")}
                value={notifyHour}
                disabled={saving}
                onChange={(e) => {
                  void handleTimeChange(Number(e.target.value), notifyMinute);
                }}
                className="flex-1 max-w-[5.5rem] rounded-xl border border-white/10 bg-[#0f2744] px-3 py-3 text-lg font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer appearance-auto"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h} className="bg-[#0f2744] text-slate-100">
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-slate-400 text-xl font-bold">:</span>
              <select
                aria-label="Dakika"
                value={notifyMinute}
                disabled={saving}
                onChange={(e) => {
                  void handleTimeChange(notifyHour, Number(e.target.value));
                }}
                className="flex-1 max-w-[5.5rem] rounded-xl border border-white/10 bg-[#0f2744] px-3 py-3 text-lg font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer appearance-auto"
              >
                {minuteOptions.map((m) => (
                  <option key={m} value={m} className="bg-[#0f2744] text-slate-100">
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isNative && permission !== "granted" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <p className="text-sm text-amber-100/90">{t("notifications.permissionHint")}</p>
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={permissionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-900 font-semibold py-2.5 text-sm hover:bg-amber-400 transition-colors disabled:opacity-60"
              >
                <Bell size={18} weight="fill" />
                {t("notifications.requestPermission")}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
