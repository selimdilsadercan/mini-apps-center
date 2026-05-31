import type { AppAssistantDefinition } from "../lib/assistant-types";

export const memedexAssistantDefinition: AppAssistantDefinition = {
  appId: "memedex",
  name: "Memedex",
  description: "Meme kayıtlarını yönetir.",
  schema: "memedex",
  tools: [
    {
      name: "list_memes",
      description: "Meme listesini getirir.",
      permission: "read",
      parameters: {
        search: { type: "string", description: "Arama metni" },
      },
    },
    {
      name: "create_meme",
      description: "Yeni meme ekler.",
      permission: "create",
      parameters: {
        title: { type: "string", required: true, description: "Başlık" },
        description: { type: "string", description: "Açıklama" },
        context: { type: "string", description: "Bağlam" },
        example: { type: "string", description: "Örnek kullanım" },
        trendStatus: { type: "string", description: "Trend durumu" },
        mediaUrl: { type: "string", description: "Medya URL" },
        tags: { type: "array", description: "Etiketler" },
      },
    },
    {
      name: "update_meme",
      description: "Meme günceller.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
        title: { type: "string", required: true, description: "Başlık" },
        trendStatus: { type: "string", required: true, description: "Trend" },
        mediaUrl: { type: "string", required: true, description: "Medya URL" },
      },
    },
    {
      name: "delete_meme",
      description: "Meme siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
      },
    },
    {
      name: "like_meme",
      description: "Meme beğenir.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
      },
    },
  ],
};
