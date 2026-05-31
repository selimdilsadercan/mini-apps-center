import type { AppAssistantModule } from "../lib/assistant-types";
import { users } from "~encore/clients";

export const usersAssistant: AppAssistantModule = {
  appId: "users",
  name: "Users",
  description: "Kullanıcı tercihlerini (uygulama sırası) günceller.",
  schema: "public",
  tools: [
    {
      name: "get_app_order",
      description: "Kullanıcının ana ekran uygulama sırasını getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "update_app_order",
      description: "Ana ekrandaki uygulama sırasını günceller.",
      permission: "update",
      parameters: {
        appOrder: {
          type: "array",
          required: true,
          description: "Mini app id listesi",
        },
      },
    },
  ],
  executors: {
    get_app_order: async ({ userId }) => {
      const res = await users.getUserPreferences({ clerkId: userId });
      return res;
    },
    update_app_order: async ({ userId, args }) => {
      const res = await users.updateAppOrder({
        clerkId: userId,
        appOrder: (args.appOrder as any) ?? [],
      });
      return res;
    },
  },
};
