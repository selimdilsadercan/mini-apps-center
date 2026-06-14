import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import {
  buildNotificationCopy,
  fetchWeatherSnapshot,
} from "./weather_provider";
import { getIstanbulClock, markNotifiedToday, sendWeatherPush } from "./push";
import type { WeatherPreferences } from "./api";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

/** Her dakika İstanbul saatine göre eşleşen kullanıcılara sabah bildirimi gönderir. */
export const dispatchMorningNotifications = api(
  {},
  async (): Promise<{ checked: number; sent: number; skipped: number }> => {
    const { hour, minute, dateKey } = getIstanbulClock();

    const { data: rows, error } = await supabase
      .schema("daily_weather")
      .from("preferences")
      .select("*, user:user_id(clerk_id)")
      .eq("notifications_enabled", true)
      .eq("notify_hour", hour)
      .eq("notify_minute", minute);

    if (error) {
      console.error("dispatchMorningNotifications:", error);
      return { checked: 0, sent: 0, skipped: 0 };
    }

    let sent = 0;
    let skipped = 0;

    for (const row of rows ?? []) {
      const prefs = row as any;
      const clerkId = prefs.user?.clerk_id;

      if (!clerkId || prefs.last_notified_date === dateKey) {
        skipped++;
        continue;
      }

      try {
        const weather = await fetchWeatherSnapshot(prefs.city, "tr");
        const copy = buildNotificationCopy(
          weather,
          "tr",
          prefs.notify_hour,
          prefs.notify_minute ?? 0,
        );
        const payload = {
          title: copy.title,
          body: copy.body,
          data: {
            type: "daily_weather" as const,
            city: prefs.city,
            notifyHour: prefs.notify_hour,
            notifyMinute: prefs.notify_minute ?? 0,
            tempC: weather.tempC,
            tempMinC: weather.tempMinC,
            tempMaxC: weather.tempMaxC,
            condition: weather.condition,
            sentAt: new Date().toISOString(),
          },
        };

        const { pushSent } = await sendWeatherPush(supabase, clerkId, payload);
        if (pushSent) {
          await markNotifiedToday(supabase, prefs.user_id, dateKey);
          sent++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`dispatchMorningNotifications user ${prefs.user_id}:`, err);
        skipped++;
      }
    }

    return { checked: rows?.length ?? 0, sent, skipped };
  },
);

const _ = new CronJob("daily-weather-morning-push", {
  title: "Daily Weather — sabah bildirimleri (İstanbul)",
  every: "1m",
  endpoint: dispatchMorningNotifications,
});
