import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { itu_yemekhane } from "~encore/clients";

export const ituYemekhaneAssistant: AppAssistantModule = {
  appId: "itu-yemekhane",
  name: "İTÜ Yemekhane",
  description: "Menüyü okur ve yemek beğenmeme durumunu günceller.",
  schema: "itu_yemekhane",
  tools: [
    {
      name: "get_menu",
      description: "Günlük menüyü getirir.",
      permission: "read",
      parameters: {
        date: { type: "string", description: "YYYY-MM-DD" },
      },
    },
    {
      name: "toggle_dislike",
      description: "Yemeği beğenmeme listesine ekler/çıkarır.",
      permission: "update",
      parameters: {
        dishName: { type: "string", required: true, description: "Yemek adı" },
      },
    },
    {
      name: "list_disliked",
      description: "Beğenilmeyen yemekleri listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    get_menu: async () => {
      return await itu_yemekhane.getMenu();
    },
    toggle_dislike: async ({ userId, args }) => {
      const res = await itu_yemekhane.toggleDislike({
        userId,
        dishName: requireString(args, "dishName"),
      });
      return res;
    },
    list_disliked: async ({ userId }) => {
      const res = await itu_yemekhane.getDislikedDishes({ userId });
      // Map string[] to object array to match static-chat expected structure
      return res.dishes.map(name => ({ dish_name: name }));
    },
  },
};
