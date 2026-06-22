import type { SupabaseClient } from "@supabase/supabase-js";

/** Bildirim izni verilen uygulama anahtarları (JSON içindeki key'ler). */
export const NOTIFICATION_APP_KEYS = {
  ITU_YEMEKHANE: "itu_yemekhane",
  DAILY_WEATHER: "daily_weather",
} as const;

export type NotificationAppKey =
  (typeof NOTIFICATION_APP_KEYS)[keyof typeof NOTIFICATION_APP_KEYS];

export type NotificationAppsJson = Record<string, Record<string, unknown>>;

export interface NotificationOptInsRow {
  user_id: string;
  apps: NotificationAppsJson;
  updated_at: string;
}

export interface ItuYemekhaneNotificationOptIn {
  enabled?: boolean;
  last_lunch_notified_date?: string | null;
  last_dinner_notified_date?: string | null;
}

export function getAppOptIn<T extends Record<string, unknown>>(
  apps: NotificationAppsJson | null | undefined,
  appKey: string,
): T {
  const raw = apps?.[appKey];
  if (!raw || typeof raw !== "object") return {} as T;
  return raw as T;
}

export function isAppNotificationEnabled(
  apps: NotificationAppsJson | null | undefined,
  appKey: string,
): boolean {
  return getAppOptIn<{ enabled?: boolean }>(apps, appKey).enabled === true;
}

export async function getNotificationOptIns(
  supabase: SupabaseClient,
  clerkId: string,
): Promise<NotificationOptInsRow | null> {
  const { data, error } = await supabase.rpc("get_notification_opt_ins", {
    clerk_id_param: clerkId,
  });

  if (error) {
    throw error;
  }

  const row = (data as NotificationOptInsRow[] | null)?.[0];
  return row ?? null;
}

export async function mergeNotificationAppOptIn(
  supabase: SupabaseClient,
  clerkId: string,
  appKey: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc("merge_notification_app_opt_in", {
    clerk_id_param: clerkId,
    app_key_param: appKey,
    patch_param: patch,
  });

  if (error) {
    throw error;
  }

  return (data as Record<string, unknown>) ?? {};
}

export interface OptInUserRow {
  user_id: string;
  clerk_id: string;
  app_data: Record<string, unknown>;
}

export async function listNotificationOptInUsers(
  supabase: SupabaseClient,
  appKey: string,
): Promise<OptInUserRow[]> {
  const { data, error } = await supabase.rpc("list_notification_opt_in_users", {
    app_key_param: appKey,
  });

  if (error) {
    throw error;
  }

  return (data as OptInUserRow[]) ?? [];
}
