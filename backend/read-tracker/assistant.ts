import { requireString } from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { read_tracker } from "~encore/clients";

export const readTrackerAssistant: AppAssistantModule = {
  appId: "read-tracker",
  name: "ReadTracker",
  description: "Kitap okuma alışkanlığı kazan, kitaplarını kütüphanende listele ve haftalık okuma hedefleri belirle.",
  schema: "read_tracker",
  tools: [
    {
      name: "list_books",
      description: "Kullanıcının kütüphanesindeki tüm kitapları listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "list_weekly_goals",
      description: "Kullanıcının haftalık kitap okuma hedeflerini listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    list_books: async ({ userId }) => {
      if (!userId) return [];
      const res = await read_tracker.getBooks({ userId });
      return res.books;
    },
    list_weekly_goals: async ({ userId }) => {
      if (!userId) return [];
      const res = await read_tracker.getWeeklyGoals({ userId });
      return res.goals;
    },
  },
};
