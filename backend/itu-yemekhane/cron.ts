import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import {
  listNotificationOptInUsers,
  mergeNotificationAppOptIn,
  NOTIFICATION_APP_KEYS,
  type ItuYemekhaneNotificationOptIn,
} from "../lib/notification_opt_ins";
import { createSupabaseClient } from "../lib/supabase";
import { fetchMenu } from "./menu_provider";
import { buildMealNotificationCopy, type MealSlot } from "./notification_copy";
import { getIstanbulClock, sendMealPush } from "./push";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

const LUNCH_HOUR = 8;
const DINNER_HOUR = 15;
const APP_KEY = NOTIFICATION_APP_KEYS.ITU_YEMEKHANE;

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

    let rows;
    try {
      rows = await listNotificationOptInUsers(supabase, APP_KEY);
    } catch (error) {
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

      for (const row of rows) {
        checked++;
        const clerkId = row.clerk_id;
        if (!clerkId) {
          skipped++;
          continue;
        }

        const appData = row.app_data as ItuYemekhaneNotificationOptIn;
        const lastKey =
          slot === "lunch" ? appData.last_lunch_notified_date : appData.last_dinner_notified_date;
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
            const patch =
              slot === "lunch"
                ? { last_lunch_notified_date: dateKey }
                : { last_dinner_notified_date: dateKey };
            await mergeNotificationAppOptIn(supabase, clerkId, APP_KEY, patch);
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
