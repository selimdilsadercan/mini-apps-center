import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { users } from "~encore/clients";
import { createSupabaseClient } from "../lib/supabase";
import {
  buildNotificationCopy,
  fetchWeatherSnapshot,
  type WeatherSnapshot,
} from "./weather_provider";
import { sendWeatherPush } from "./push";
import { buildWeatherRecommendations, type WeatherRecommendation } from "./recommendations";

export type { WeatherSnapshot } from "./weather_provider";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface WeatherPreferences {
  user_id: string;
  notifications_enabled: boolean;
  notify_hour: number;
  notify_minute: number;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface WeatherNotificationPayload {
  title: string;
  body: string;
  data: {
    type: "daily_weather";
    city: string;
    notifyHour: number;
    notifyMinute: number;
    tempC: number;
    tempMinC: number;
    tempMaxC: number;
    condition: string;
    sentAt: string;
  };
}

const DEFAULT_PREFERENCES = (userId: string): WeatherPreferences => ({
  user_id: userId,
  notifications_enabled: true,
  notify_hour: 7,
  notify_minute: 0,
  city: "Istanbul",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

async function ensurePublicUser(clerkId: string): Promise<void> {
  const { user } = await users.getOrCreateUser({ clerkId });
  if (!user) {
    throw APIError.internal("Could not ensure user record in public.users");
  }
}

function validateNotifyTime(hour: number, minute: number) {
  if (hour < 0 || hour > 23) {
    throw APIError.invalidArgument("notifyHour must be between 0 and 23");
  }
  if (minute < 0 || minute > 59) {
    throw APIError.invalidArgument("notifyMinute must be between 0 and 59");
  }
}

function normalizePreferences(
  row: WeatherPreferences | null,
  userId: string,
): WeatherPreferences {
  if (!row) return DEFAULT_PREFERENCES(userId);
  return { ...row, notify_minute: row.notify_minute ?? 0 };
}

function buildNotificationPayload(
  prefs: WeatherPreferences,
  weather: WeatherSnapshot,
  locale: "tr" | "en" = "tr",
): WeatherNotificationPayload {
  const copy = buildNotificationCopy(
    weather,
    locale,
    prefs.notify_hour,
    prefs.notify_minute,
  );
  return {
    title: copy.title,
    body: copy.body,
    data: {
      type: "daily_weather",
      city: prefs.city,
      notifyHour: prefs.notify_hour,
      notifyMinute: prefs.notify_minute,
      tempC: weather.tempC,
      tempMinC: weather.tempMinC,
      tempMaxC: weather.tempMaxC,
      condition: weather.condition,
      sentAt: new Date().toISOString(),
    },
  };
}

interface GetPreferencesRequest {
  userId: string;
}

interface GetPreferencesResponse {
  preferences: WeatherPreferences;
}

interface UpsertPreferencesRequest {
  userId: string;
  notificationsEnabled: boolean;
  notifyHour: number;
  notifyMinute?: number;
  city?: string;
}

interface UpsertPreferencesResponse {
  preferences: WeatherPreferences;
}

export type { WeatherRecommendation } from "./recommendations";

interface GetWeatherRequest {
  city?: string;
  locale?: string;
}

interface GetWeatherResponse {
  weather: WeatherSnapshot;
  recommendations: WeatherRecommendation[];
}

interface TestNotificationRequest {
  userId: string;
  locale?: string;
}

interface TestNotificationResponse {
  payload: WeatherNotificationPayload;
  deviceCount: number;
  pushSent: boolean;
  message: string;
}

export const getWeather = api(
  { expose: true, method: "GET", path: "/daily-weather/weather" },
  async ({ city, locale }: GetWeatherRequest): Promise<GetWeatherResponse> => {
    const lang = locale === "en" ? "en" : "tr";
    try {
      const weather = await fetchWeatherSnapshot(city ?? "Istanbul", lang);
      const recommendations = buildWeatherRecommendations(weather, lang);
      return { weather, recommendations };
    } catch (err) {
      if (err instanceof APIError) throw err;
      console.error("getWeather error:", err);
      throw APIError.unavailable("Could not fetch weather data");
    }
  },
);

export const getPreferences = api(
  { expose: true, method: "GET", path: "/daily-weather/preferences/:userId" },
  async ({ userId }: GetPreferencesRequest): Promise<GetPreferencesResponse> => {
    const { data, error } = await supabase.schema("daily_weather").rpc("get_preferences", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getPreferences error:", error);
      throw APIError.internal(`Failed to load preferences: ${error.message}`);
    }

    return { preferences: normalizePreferences(data as WeatherPreferences | null, userId) };
  },
);

export const upsertPreferences = api(
  { expose: true, method: "POST", path: "/daily-weather/preferences" },
  async ({
    userId,
    notificationsEnabled,
    notifyHour,
    notifyMinute = 0,
    city,
  }: UpsertPreferencesRequest): Promise<UpsertPreferencesResponse> => {
    validateNotifyTime(notifyHour, notifyMinute);
    await ensurePublicUser(userId);

    const { data, error } = await supabase.schema("daily_weather").rpc("upsert_preferences", {
      clerk_id_param: userId,
      notifications_enabled_param: notificationsEnabled,
      notify_hour_param: notifyHour,
      notify_minute_param: notifyMinute,
      city_param: city ?? "Istanbul",
    });

    if (error) {
      console.error("upsertPreferences error:", error);
      throw APIError.internal(`Failed to save preferences: ${error.message}`);
    }

    return { preferences: normalizePreferences(data as WeatherPreferences | null, userId) };
  },
);

export const sendTestNotification = api(
  { expose: true, method: "POST", path: "/daily-weather/test-notification" },
  async (req: TestNotificationRequest): Promise<TestNotificationResponse> => {
    const { userId } = req;
    const { data: prefRow, error: prefError } = await supabase
      .schema("daily_weather")
      .rpc("get_preferences", { clerk_id_param: userId });

    if (prefError) {
      throw APIError.internal(`Failed to load preferences: ${prefError.message}`);
    }

    const prefs = normalizePreferences(prefRow as WeatherPreferences | null, userId);
    const lang = req.locale === "en" ? "en" : "tr";
    const weather = await fetchWeatherSnapshot(prefs.city, lang);
    const payload = buildNotificationPayload(prefs, weather, lang);

    const { deviceCount, pushSent, message } = await sendWeatherPush(
      supabase,
      userId,
      payload,
    );

    return { payload, deviceCount, pushSent, message };
  },
);
