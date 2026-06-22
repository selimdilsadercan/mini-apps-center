import type { SupabaseClient } from "@supabase/supabase-js";
import { secret } from "encore.dev/config";
import { configureFcm, isFcmConfigured, sendPushToTokens } from "../lib/fcm";
import type { MealSlot } from "./notification_copy";

const firebaseServiceAccount = secret("FirebaseServiceAccount");
let fcmInitAttempted = false;

function ensureFcmConfigured(): void {
  if (fcmInitAttempted) return;
  fcmInitAttempted = true;
  configureFcm(firebaseServiceAccount());
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

export interface MealPushPayload {
  title: string;
  body: string;
  data: {
    type: "itu_yemekhane";
    mealSlot: MealSlot;
    mealType: string;
    menuDate: string;
    sentAt: string;
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

function payloadToFcmData(payload: MealPushPayload): Record<string, string> {
  return {
    type: payload.data.type,
    mealSlot: payload.data.mealSlot,
    mealType: payload.data.mealType,
    menuDate: payload.data.menuDate,
    sentAt: payload.data.sentAt,
  };
}

export async function sendMealPush(
  supabase: SupabaseClient,
  clerkId: string,
  payload: MealPushPayload,
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
      message: "FCM yapılandırılmadı. Encore secret: FirebaseServiceAccount.",
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
