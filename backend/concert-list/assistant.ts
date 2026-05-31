import type { AppAssistantDefinition } from "../lib/assistant-types";

export const concertListAssistantDefinition: AppAssistantDefinition = {
  appId: "concert-list",
  name: "My Concert List",
  description: "Konser kayıtlarını yönetir.",
  schema: "concert_list",
  tools: [
    {
      name: "list_concerts",
      description: "Kullanıcının konser listesini getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_concert",
      description: "Yeni konser ekler.",
      permission: "create",
      parameters: {
        artist: { type: "string", description: "Sanatçı", required: true },
        date: { type: "string", description: "YYYY-MM-DD", required: true },
        venue: { type: "string", description: "Mekan" },
        notes: { type: "string", description: "Notlar" },
        rating: { type: "number", description: "1-5 puan" },
      },
    },
    {
      name: "delete_concert",
      description: "Konser kaydını siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", description: "Konser id", required: true },
      },
    },
  ],
};
