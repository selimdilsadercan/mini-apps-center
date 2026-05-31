import type { AppAssistantDefinition } from "../lib/assistant-types";

export const ituYemekhaneAssistantDefinition: AppAssistantDefinition = {
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
};
