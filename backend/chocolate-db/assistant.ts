import type { AppAssistantDefinition } from "../lib/assistant-types";

export const chocolateDbAssistantDefinition: AppAssistantDefinition = {
  appId: "chocolate-db",
  name: "ChocolateDB",
  description: "Çikolata puanları ve kullanıcı durumlarını yönetir.",
  schema: "chocolate_db",
  tools: [
    {
      name: "list_chocolates",
      description: "Çikolata kataloğunu listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "set_user_state",
      description: "Çikolata için kullanıcı durumu ayarlar (tried, wishlist, dislike).",
      permission: "update",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata slug/id" },
        state: {
          type: "string",
          description: "tried | wishlist | dislike | boş string ile temizle",
        },
      },
    },
    {
      name: "add_review",
      description: "Çikolataya yorum ekler.",
      permission: "create",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata id" },
        rating: { type: "number", required: true, description: "1-5" },
        comment: { type: "string", description: "Yorum" },
        reviewerName: { type: "string", description: "İsim" },
      },
    },
    {
      name: "delete_review",
      description: "Kullanıcının çikolata yorumunu siler.",
      permission: "delete",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata id" },
      },
    },
  ],
};
