import type { AppAssistantDefinition } from "../lib/assistant-types";

export const iskambilAssistantDefinition: AppAssistantDefinition = {
  appId: "iskambil",
  name: "Card Game Codex",
  description: "Oyun favorileri, bilinen oyunlar ve notları günceller.",
  schema: "iskambil",
  tools: [
    {
      name: "list_games",
      description: "Kart oyunlarını listeler.",
      permission: "read",
      parameters: {
        userId: { type: "string", description: "Clerk user id (opsiyonel filtre)" },
      },
    },
    {
      name: "toggle_favorite",
      description: "Oyunu favorilere ekler/çıkarır.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
      },
    },
    {
      name: "toggle_known",
      description: "Oyunu bilinen olarak işaretler.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
      },
    },
    {
      name: "save_note",
      description: "Oyun için kişisel not kaydeder.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
        note: { type: "string", required: true, description: "Not metni" },
      },
    },
  ],
};
