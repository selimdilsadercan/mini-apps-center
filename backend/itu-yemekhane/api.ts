import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { users } from "~encore/clients";
import { createSupabaseClient } from "../lib/supabase";
import { fetchMenu } from "./menu_provider";
import { buildMealNotificationCopy } from "./notification_copy";
import { sendMealPush } from "./push";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface Dish {
  id: string;
  name: string;
  category: string;
  calories: number;
}

export interface MenuResponse {
  date: string;
  mealType: string;
  dishes: Dish[];
}

export interface NotificationPreferences {
  user_id: string;
  notifications_enabled: boolean;
  last_lunch_notified_date: string | null;
  last_dinner_notified_date: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_NOTIFICATION_PREFERENCES = (userId: string): NotificationPreferences => ({
  user_id: userId,
  notifications_enabled: false,
  last_lunch_notified_date: null,
  last_dinner_notified_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

async function ensurePublicUser(clerkId: string): Promise<void> {
  const { user } = await users.getOrCreateUser({ clerkId });
  if (!user) {
    throw APIError.internal("Could not ensure user record in public.users");
  }
}

function normalizeNotificationPreferences(
  row: NotificationPreferences | null,
  userId: string,
): NotificationPreferences {
  if (!row) return DEFAULT_NOTIFICATION_PREFERENCES(userId);
  return row;
}

export const getMenu = api(
  { path: "/itu-yemekhane/menu", expose: true, method: "GET" },
  async (): Promise<MenuResponse> => {
    try {
      return await fetchMenu();
    } catch (error) {
      console.error("getMenu failed:", error);
      throw APIError.unavailable("Menü alınamadı");
    }
  },
);

export const toggleDislike = api(
  { path: "/itu-yemekhane/disliked", expose: true, method: "POST" },
  async (params: { dishName: string; userId: string }): Promise<{ status: string }> => {
    const { data, error } = await supabase.schema("itu_yemekhane").rpc("toggle_dislike", {
      clerk_id_param: params.userId,
      dish_name_param: params.dishName,
    });

    if (error) {
      console.error("toggleDislike RPC error:", error);
      throw APIError.internal(`Failed to toggle dislike: ${error.message}`);
    }

    return { status: data as string };
  },
);

export const getDislikedDishes = api(
  { path: "/itu-yemekhane/disliked/:userId", expose: true, method: "GET" },
  async ({ userId }: { userId: string }): Promise<{ dishes: string[] }> => {
    const { data, error } = await supabase.schema("itu_yemekhane").rpc("get_dislikes", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getDislikedDishes RPC error:", error);
      return { dishes: [] };
    }

    return { dishes: ((data as { dish_name: string }[]) || []).map((row) => row.dish_name) };
  },
);

export const getNotificationPreferences = api(
  { expose: true, method: "GET", path: "/itu-yemekhane/notification-preferences/:userId" },
  async ({ userId }: { userId: string }): Promise<{ preferences: NotificationPreferences }> => {
    const { data, error } = await supabase
      .schema("itu_yemekhane")
      .rpc("get_notification_preferences", { clerk_id_param: userId });

    if (error) {
      console.error("getNotificationPreferences error:", error);
      throw APIError.internal(`Failed to load preferences: ${error.message}`);
    }

    return {
      preferences: normalizeNotificationPreferences(data as NotificationPreferences | null, userId),
    };
  },
);

export const upsertNotificationPreferences = api(
  { expose: true, method: "POST", path: "/itu-yemekhane/notification-preferences" },
  async ({
    userId,
    notificationsEnabled,
  }: {
    userId: string;
    notificationsEnabled: boolean;
  }): Promise<{ preferences: NotificationPreferences }> => {
    await ensurePublicUser(userId);

    const { data, error } = await supabase
      .schema("itu_yemekhane")
      .rpc("upsert_notification_preferences", {
        clerk_id_param: userId,
        notifications_enabled_param: notificationsEnabled,
      });

    if (error) {
      console.error("upsertNotificationPreferences error:", error);
      throw APIError.internal(`Failed to save preferences: ${error.message}`);
    }

    return {
      preferences: normalizeNotificationPreferences(data as NotificationPreferences | null, userId),
    };
  },
);

export const sendTestMealNotification = api(
  { expose: true, method: "POST", path: "/itu-yemekhane/test-notification" },
  async ({
    userId,
    mealSlot = "lunch",
  }: {
    userId: string;
    mealSlot?: "lunch" | "dinner";
  }): Promise<{
    title: string;
    body: string;
    deviceCount: number;
    pushSent: boolean;
    message: string;
  }> => {
    const menu = await fetchMenu(true);
    const { data: dislikedData } = await supabase.schema("itu_yemekhane").rpc("get_dislikes", {
      clerk_id_param: userId,
    });
    const disliked = ((dislikedData as { dish_name: string }[]) ?? []).map((r) => r.dish_name);
    const copy = buildMealNotificationCopy(mealSlot, menu, disliked);

    const { deviceCount, pushSent, message } = await sendMealPush(supabase, userId, {
      title: copy.title,
      body: copy.body,
      data: {
        type: "itu_yemekhane",
        mealSlot,
        mealType: menu.mealType,
        menuDate: menu.date,
        sentAt: new Date().toISOString(),
      },
    });

    return { title: copy.title, body: copy.body, deviceCount, pushSent, message };
  },
);
