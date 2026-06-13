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
  Sparkle,
  Info,
  Warning,
  CloudSnow,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { createBrowserClient } from "@/lib/api";
import { useNotifications } from "@/hooks/use-notifications";
import type { daily_weather } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import { calculateSmartRecommendations } from "./suggestion";

export interface DailyWeatherSnapshot {
  city: string;
  dateLabel: string;
  condition: string;
  tempC: number;
  tempMinC: number;
  tempMaxC: number;
  humidity: number;
  windKmh: number;
  icon: "sun" | "cloud" | "rain" | "partly" | "snow";
  maxPrecipitationProbability?: number;
  eveningTempC?: number;
  eveningPrecipitationProbability?: number;
  hourlyData?: {
    time: string;
    tempC: number;
    precipProb: number;
    weatherCode: number;
  }[];
  dailyForecast?: {
    dayLabel: string;
    dateLabel: string;
    condition: string;
    tempC: number;
    tempMinC: number;
    tempMaxC: number;
    humidity: number;
    windKmh: number;
    maxPrecipitationProbability: number;
    icon: "sun" | "cloud" | "rain" | "partly" | "snow";
    weatherCode: number;
    hourlyData: {
      time: string;
      tempC: number;
      precipProb: number;
      weatherCode: number;
    }[];
  }[];
}

function WeatherIcon({ icon, size = 72 }: { icon: DailyWeatherSnapshot["icon"]; size?: number }) {
  const className = "text-sky-400 filter drop-shadow-sm";
  switch (icon) {
    case "sun":
      return <Sun size={size} weight="duotone" className="text-amber-400" />;
    case "cloud":
      return <Cloud size={size} weight="duotone" className={className} />;
    case "rain":
      return <CloudRain size={size} weight="duotone" className="text-blue-400" />;
    case "snow":
      return <CloudSnow size={size} weight="duotone" className="text-sky-300" />;
    default:
      return <CloudSun size={size} weight="duotone" className="text-amber-400" />;
  }
}

export default function DailyWeatherPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useTranslations("dailyWeather");
  const { user, isLoaded: isUserLoaded } = useUser();
  const { permission, handleRequestPermission, loading: permissionLoading, refreshSetup } =
    useNotifications();

  const [enabled, setEnabled] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [notifyHour, setNotifyHour] = useState(7);
  const [notifyMinute, setNotifyMinute] = useState(0);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weather, setWeather] = useState<DailyWeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

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
    icon: w.icon as "sun" | "cloud" | "rain" | "partly" | "snow",
    maxPrecipitationProbability: w.maxPrecipitationProbability,
    eveningTempC: w.eveningTempC,
    eveningPrecipitationProbability: w.eveningPrecipitationProbability,
    hourlyData: w.hourlyData ? w.hourlyData.map(h => ({
      time: h.time,
      tempC: h.tempC,
      precipProb: h.precipProb,
      weatherCode: h.weatherCode,
    })) : undefined,
    dailyForecast: w.dailyForecast ? w.dailyForecast.map(d => ({
      dayLabel: d.dayLabel,
      dateLabel: d.dateLabel || "",
      condition: d.condition || "",
      tempC: d.tempC ?? 0,
      tempMinC: d.tempMinC,
      tempMaxC: d.tempMaxC,
      humidity: d.humidity ?? 0,
      windKmh: d.windKmh ?? 0,
      maxPrecipitationProbability: d.maxPrecipitationProbability ?? 0,
      icon: d.icon as "sun" | "cloud" | "rain" | "partly" | "snow",
      weatherCode: d.weatherCode ?? 2,
      hourlyData: d.hourlyData ? d.hourlyData.map(h => ({
        time: h.time,
        tempC: h.tempC,
        precipProb: h.precipProb,
        weatherCode: h.weatherCode,
      })) : [],
    })) : undefined,
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
          setSelectedDayIndex(0);
        }
      } catch (err) {
        console.error("loadWeather:", err);
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

  useEffect(() => {
    if (isUserLoaded && user && isNative) {
      void refreshSetup();
    }
  }, [isUserLoaded, user, isNative, refreshSetup]);

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

  const handleTestNotification = async () => {
    if (!user) {
      toast.error(t("notifications.signInRequired"));
      return;
    }
    if (isNative && permission !== "granted") {
      toast.error(t("notifications.permissionHint"));
      return;
    }
    try {
      setTestSending(true);
      const client = createBrowserClient();
      const res = await client.daily_weather.sendTestNotification({
        userId: user.id,
        locale: lang,
      });
      if (res.pushSent) {
        toast.success(res.message || t("notifications.testSent"));
      } else {
        toast.error(res.message || t("notifications.testFailed"));
      }
    } catch (err) {
      console.error("handleTestNotification:", err);
      toast.error(t("notifications.testFailed"));
    } finally {
      setTestSending(false);
    }
  };

  const activeDay = (weather && weather.dailyForecast && weather.dailyForecast[selectedDayIndex])
    ? weather.dailyForecast[selectedDayIndex]
    : null;

  const activeSnapshot: DailyWeatherSnapshot | null = weather && activeDay ? {
    city: weather.city,
    dateLabel: activeDay.dateLabel,
    condition: activeDay.condition,
    tempC: activeDay.tempC,
    tempMinC: activeDay.tempMinC,
    tempMaxC: activeDay.tempMaxC,
    humidity: activeDay.humidity,
    windKmh: activeDay.windKmh,
    icon: activeDay.icon,
    maxPrecipitationProbability: activeDay.maxPrecipitationProbability,
    hourlyData: activeDay.hourlyData,
  } : weather;

  const recommendationsList = activeSnapshot
    ? calculateSmartRecommendations(activeSnapshot, (key, variables) => t(key, variables))
    : [];

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FFF9E6] via-[#E6F3FF] to-[#F0E6FF] text-slate-700 flex flex-col font-sans">
      <Toaster position="top-center" />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 h-80 w-80 rounded-full bg-amber-200/40 blur-[100px]" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-sky-200/40 blur-[100px]" />
      </div>

      <header className="relative z-10 flex items-center gap-3 px-4 pt-6 pb-2 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={() => {
            window.location.href = getAppRootUrl();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 border border-white/40 shadow-sm hover:bg-white/95 transition-colors text-slate-600"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-800">
            <SunHorizon size={24} className="text-amber-500" weight="duotone" />
            {t("title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium truncate">{t("subtitle")}</p>
        </div>
      </header>

      <main className="relative z-20 flex-1 px-4 pb-10 max-w-lg mx-auto w-full space-y-4 isolate">
        {/* Main Weather Card (Contains Info, Stats, and Recommendations inside) */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-lg p-5 shadow-sm space-y-5"
        >
          {weatherLoading || !weather || !activeSnapshot ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              {t("loadingWeather")}
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{activeSnapshot.dateLabel}</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <WeatherIcon icon={activeSnapshot.icon} />
                    <div>
                      <p className="text-5xl font-extrabold tracking-tight text-slate-850 tabular-nums">{activeSnapshot.tempC}°</p>
                      <p className="text-slate-700 font-semibold mt-1">{activeSnapshot.condition}</p>
                      <p className="text-sm text-slate-500 mt-0.5 font-medium">
                        {activeSnapshot.tempMinC}° – {activeSnapshot.tempMaxC}°
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2.5 min-w-[12rem] flex-1 sm:flex-initial">
                    <div className="rounded-xl bg-sky-50/50 border border-sky-100/50 px-3.5 py-2 flex items-center gap-2.5 flex-1 sm:flex-none">
                      <Drop size={18} className="text-sky-500" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">
                          {t("stats.humidity")}
                        </p>
                        <p className="text-xs font-bold text-sky-850">{activeSnapshot.humidity}%</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50/50 border border-amber-100/50 px-3.5 py-2 flex items-center gap-2.5 flex-1 sm:flex-none">
                      <Wind size={18} className="text-amber-500" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">
                          {t("stats.wind")}
                        </p>
                        <p className="text-xs font-bold text-amber-850">{activeSnapshot.windKmh} km/h</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Recommendations Section - Embedded inside Main Card under Stats */}
              {recommendationsList.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-slate-200/50">
                  {recommendationsList.map((rec) => (
                    <div
                       key={rec.id}
                       className={`flex items-start gap-3 p-3.5 rounded-xl text-sm font-semibold border ${
                        rec.id === "umbrella" || rec.id === "eveningRain" || rec.id === "storm" || rec.id === "snow"
                          ? "bg-rose-50/70 border-rose-100/60 text-rose-900"
                          : rec.id === "jacket" || rec.id === "eveningCold" || rec.id === "bigTempDiff" || rec.id === "veryCold" || rec.id === "cold" || rec.id === "windy" || rec.id === "veryWindy"
                          ? "bg-violet-50/70 border-violet-100/60 text-violet-900"
                          : "bg-emerald-50/70 border-emerald-100/60 text-emerald-900"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {rec.id === "umbrella" || rec.id === "eveningRain" || rec.id === "storm" || rec.id === "snow" ? (
                          <Warning size={18} weight="fill" className="text-rose-500" />
                        ) : rec.id === "hot" || rec.id === "moderate" || rec.id === "ideal" || rec.id === "extremeHot" ? (
                          <Sparkle size={18} weight="fill" className="text-emerald-500" />
                        ) : (
                          <Info size={18} weight="fill" className="text-violet-500" />
                        )}
                      </span>
                      <p className="leading-relaxed">{rec.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.section>

        {/* Hourly Forecast Horizontal Scroll View (WITHOUT card layout, flat design) */}
        {!weatherLoading && activeSnapshot && activeSnapshot.hourlyData && activeSnapshot.hourlyData.length > 0 && (
          <div className="py-2">
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {(() => {
                const currentHour = new Date().getHours();
                const visibleHours = selectedDayIndex === 0
                  ? activeSnapshot.hourlyData.filter(h => {
                      const hVal = parseInt(h.time.split(":")[0]);
                      return hVal >= currentHour;
                    })
                  : activeSnapshot.hourlyData;
                const listToRender = visibleHours.length > 0 ? visibleHours : activeSnapshot.hourlyData;

                return listToRender.map((hour, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center min-w-[3.4rem] py-2.5 px-2 rounded-xl bg-white/20 border border-white/10 text-slate-800"
                  >
                    <span className="text-[10px] font-bold text-slate-500">{hour.time}</span>
                    <div className="my-1.5 h-6 flex items-center justify-center">
                      {hour.precipProb > 10 ? (
                        <span className="text-[9px] font-extrabold text-blue-500">
                          %{hour.precipProb}
                        </span>
                      ) : hour.precipProb > 20 ? (
                        <CloudRain size={18} weight="duotone" className="text-blue-400" />
                      ) : hour.tempC > 22 ? (
                        <Sun size={18} weight="duotone" className="text-amber-400" />
                      ) : (
                        <CloudSun size={18} weight="duotone" className="text-slate-400" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{hour.tempC}°</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* 5-Day Daily Forecast List Card */}
        {!weatherLoading && weather && weather.dailyForecast && weather.dailyForecast.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-lg p-2.5 shadow-sm"
          >
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none justify-between">
              {weather.dailyForecast.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex-1 min-w-[3.6rem] flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 border text-center gap-1 ${
                      isSelected
                        ? "bg-white/85 border-amber-300/80 shadow-xs font-bold"
                        : "bg-transparent border-transparent hover:bg-white/20"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 capitalize">{day.dayLabel}</span>
                    <div className="my-0.5 flex items-center justify-center">
                      <WeatherIcon icon={day.icon} size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-650">
                      {day.tempMaxC}°/{day.tempMinC}°
                    </span>
                    {isSelected && (
                      <div className="h-[2px] w-3 rounded-full bg-amber-400 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}

        <section className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-lg p-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <BellRinging size={20} className="text-amber-500" weight="duotone" />
                {t("notifications.title")}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{t("notifications.description")}</p>
            </div>
            <button
              type="button"
              disabled={prefsLoading || saving || !user}
              onClick={handleToggle}
              className={`shrink-0 relative h-8 w-14 rounded-full transition-colors focus:outline-none ${
                enabled ? "bg-amber-400" : "bg-slate-300"
              } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-pressed={enabled}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  enabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("notifications.hourLabel")}</p>
            <div className="flex items-center gap-2">
              <select
                aria-label={t("notifications.hourLabel")}
                value={notifyHour}
                disabled={saving}
                onChange={(e) => {
                  void handleTimeChange(Number(e.target.value), notifyMinute);
                }}
                className="flex-1 max-w-[5.5rem] rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer shadow-sm"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h} className="bg-white text-slate-700">
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-slate-400 text-lg font-extrabold">:</span>
              <select
                aria-label="Dakika"
                value={notifyMinute}
                disabled={saving}
                onChange={(e) => {
                  void handleTimeChange(notifyHour, Number(e.target.value));
                }}
                className="flex-1 max-w-[5.5rem] rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer shadow-sm"
              >
                {minuteOptions.map((m) => (
                  <option key={m} value={m} className="bg-white text-slate-700">
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {user && (
            <button
              type="button"
              disabled={testSending || (isNative && permission !== "granted")}
              onClick={() => void handleTestNotification()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100/30 hover:bg-amber-100/60 text-amber-800 font-bold py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Bell size={18} weight="fill" className="text-amber-500" />
              {testSending ? t("notifications.sendingTest") : t("notifications.sendTest")}
            </button>
          )}

          {isNative && permission !== "granted" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <p className="text-xs text-amber-900 leading-relaxed font-medium">{t("notifications.permissionHint")}</p>
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={permissionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-slate-900 font-bold py-2.5 text-sm hover:bg-amber-350 transition-colors disabled:opacity-60 shadow-sm"
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
