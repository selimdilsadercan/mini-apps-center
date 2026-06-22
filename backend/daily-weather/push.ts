import type { SupabaseClient } from "@supabase/supabase-js";
import { secret } from "encore.dev/config";
import {
  configureFcm,
  isFcmConfigured,
  sendPushToTokens,
} from "../lib/fcm";

const firebaseServiceAccount = secret("FirebaseServiceAccount");
let fcmInitAttempted = false;

function ensureFcmConfigured(): void {
  if (fcmInitAttempted) return;
  fcmInitAttempted = true;
  configureFcm(firebaseServiceAccount());
}

export interface WeatherPushPayload {
  title: string;
  body: string;
  data: {
    type: string;
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

export function getIstanbulClock(): { hour: number; minute: number; dateKey: string } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  return {
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export async function fetchUserFcmTokens(
  supabase: SupabaseClient,
  clerkId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_fcm_tokens")
    .select("fcm_token")
    .eq("clerk_id", clerkId);

  if (error) {
    console.error("fetchUserFcmTokens:", error);
    return [];
  }
  return (data ?? []).map((r) => r.fcm_token).filter(Boolean);
}

export function payloadToFcmData(payload: WeatherPushPayload): Record<string, string> {
  return {
    type: payload.data.type,
    city: payload.data.city,
    notifyHour: String(payload.data.notifyHour),
    notifyMinute: String(payload.data.notifyMinute),
    tempC: String(payload.data.tempC),
    tempMinC: String(payload.data.tempMinC),
    tempMaxC: String(payload.data.tempMaxC),
    condition: payload.data.condition,
    sentAt: payload.data.sentAt,
  };
}

export async function sendWeatherPush(
  supabase: SupabaseClient,
  clerkId: string,
  payload: WeatherPushPayload,
): Promise<{ deviceCount: number; pushSent: boolean; message: string }> {
  const tokens = await fetchUserFcmTokens(supabase, clerkId);
  const deviceCount = tokens.length;

  if (deviceCount === 0) {
    return {
      deviceCount: 0,
      pushSent: false,
      message: "Kayıtlı cihaz yok. Mobil uygulamada bildirim izni verin.",
    };
  }

  ensureFcmConfigured();

  if (!isFcmConfigured()) {
    return {
      deviceCount,
      pushSent: false,
      message:
        "FCM yapılandırılmadı. Encore secret: FirebaseServiceAccount (service account JSON).",
    };
  }

  const result = await sendPushToTokens(
    tokens,
    payload.title,
    payload.body,
    payloadToFcmData(payload),
  );

  const pushSent = result.successCount > 0;
  const message = pushSent
    ? `${result.successCount} cihaza bildirim gönderildi.`
    : result.failureCount > 0
      ? `${result.failureCount} cihaza gönderilemedi.`
      : "Bildirim gönderilemedi.";

  return { deviceCount, pushSent, message };
}

export async function markNotifiedToday(
  supabase: SupabaseClient,
  userId: string,
  dateKey: string,
): Promise<void> {
  const { error } = await supabase
    .schema("daily_weather")
    .from("preferences")
    .update({ last_notified_date: dateKey, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error?.message?.includes("last_notified_date")) {
    console.warn("markNotifiedToday: last_notified_date column missing — run migration 03");
    return;
  }
  if (error) {
    console.error("markNotifiedToday:", error);
  }
}
