import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { icon_set_guide } from "~encore/clients";

export const iconSetGuideAssistant: AppAssistantModule = {
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
  executors: {
    list_icon_sets: async ({ userId }) => {
      const res = await icon_set_guide.getIconSets({ userId });
      return res.icon_sets;
    },
    toggle_favorite: async ({ userId, args }) => {
      const res = await icon_set_guide.toggleFavorite({
        userId,
        iconSetId: requireString(args, "iconSetId"),
      });
      return res;
    },
  },
};
