import type { AppAssistantDefinition } from "../lib/assistant-types";

export const usersAssistantDefinition: AppAssistantDefinition = {
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
};
