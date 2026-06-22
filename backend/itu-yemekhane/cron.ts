import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { fetchMenu } from "./menu_provider";
import { buildMealNotificationCopy, type MealSlot } from "./notification_copy";
import { getIstanbulClock, markMealNotified, sendMealPush } from "./push";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

const LUNCH_HOUR = 8;
const DINNER_HOUR = 15;

interface NotificationPrefsRow {
  user_id: string;
  notifications_enabled: boolean;
  last_lunch_notified_date: string | null;
  last_dinner_notified_date: string | null;
  user: { clerk_id: string } | null;
}

function activeSlots(hour: number, minute: number): MealSlot[] {
  if (minute !== 0) return [];
  const slots: MealSlot[] = [];
  if (hour === LUNCH_HOUR) slots.push("lunch");
  if (hour === DINNER_HOUR) slots.push("dinner");
  return slots;
}

async function fetchDislikedDishes(clerkId: string): Promise<string[]> {
  const { data, error } = await supabase.schema("itu_yemekhane").rpc("get_dislikes", {
    clerk_id_param: clerkId,
  });
  if (error) {
    console.error("fetchDislikedDishes:", error);
    return [];
  }
  return ((data as { dish_name: string }[]) ?? []).map((row) => row.dish_name);
}

/** Her dakika İstanbul saatine göre 08:00 öğle / 15:00 akşam menü bildirimi gönderir. */
export const dispatchMealNotifications = api(
  {},
  async (): Promise<{ checked: number; sent: number; skipped: number }> => {
    const { hour, minute, dateKey } = getIstanbulClock();
    const slots = activeSlots(hour, minute);

    if (slots.length === 0) {
      return { checked: 0, sent: 0, skipped: 0 };
    }

    const { data: rows, error } = await supabase
      .schema("itu_yemekhane")
      .from("notification_preferences")
      .select("*, user:user_id(clerk_id)")
      .eq("notifications_enabled", true);

    if (error) {
      console.error("dispatchMealNotifications:", error);
      return { checked: 0, sent: 0, skipped: 0 };
    }

    let sent = 0;
    let skipped = 0;
    let checked = 0;

    for (const slot of slots) {
      let menu;
      try {
        menu = await fetchMenu(true);
      } catch (err) {
        console.error(`dispatchMealNotifications menu (${slot}):`, err);
        continue;
      }

      for (const row of (rows ?? []) as NotificationPrefsRow[]) {
        checked++;
        const clerkId = row.user?.clerk_id;
        if (!clerkId) {
          skipped++;
          continue;
        }

        const lastKey =
          slot === "lunch" ? row.last_lunch_notified_date : row.last_dinner_notified_date;
        if (lastKey === dateKey) {
          skipped++;
          continue;
        }

        try {
          const disliked = await fetchDislikedDishes(clerkId);
          const copy = buildMealNotificationCopy(slot, menu, disliked);
          const payload = {
            title: copy.title,
            body: copy.body,
            data: {
              type: "itu_yemekhane" as const,
              mealSlot: slot,
              mealType: menu.mealType,
              menuDate: menu.date,
              sentAt: new Date().toISOString(),
            },
          };

          const { pushSent } = await sendMealPush(supabase, clerkId, payload);
          if (pushSent) {
            await markMealNotified(supabase, row.user_id, slot, dateKey);
            sent++;
          } else {
            skipped++;
          }
        } catch (err) {
          console.error(`dispatchMealNotifications user ${row.user_id} (${slot}):`, err);
          skipped++;
        }
      }
    }

    return { checked, sent, skipped };
  },
);

const _ = new CronJob("itu-yemekhane-meal-push", {
  title: "ITU Yemekhane — öğle (08:00) ve akşam (15:00) menü bildirimleri",
  every: "1m",
  endpoint: dispatchMealNotifications,
});
