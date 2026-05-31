import type { AppAssistantDefinition } from "../lib/assistant-types";

export const iconSetGuideAssistantDefinition: AppAssistantDefinition = {
  appId: "icon-set-guide",
  name: "Icon Set Guide",
  description: "İkon seti favorilerini yönetir.",
  schema: "icon_set_guide",
  tools: [
    {
      name: "list_icon_sets",
      description: "İkon setlerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "toggle_favorite",
      description: "İkon setini favorilere ekler/çıkarır.",
      permission: "update",
      parameters: {
        iconSetId: { type: "string", required: true, description: "İkon seti id" },
      },
    },
  ],
};
