import type { AppAssistantDefinition } from "../lib/assistant-types";

export const mapTrackerAssistantDefinition: AppAssistantDefinition = {
  appId: "map-tracker",
  name: "Harita Takip",
  description: "Harita listelerini ve ziyaret durumunu yönetir.",
  schema: "map_tracker",
  tools: [
    {
      name: "get_data",
      description: "Tüm listeleri ve mekanları getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "import_items",
      description: "Yeni liste ve mekanları içe aktarır.",
      permission: "create",
      parameters: {
        listName: { type: "string", required: true, description: "Liste adı" },
        items: { type: "array", required: true, description: "Mekanlar" },
      },
    },
    {
      name: "toggle_visited",
      description: "Mekanın ziyaret edildi durumunu değiştirir.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Mekan id" },
      },
    },
  ],
};
