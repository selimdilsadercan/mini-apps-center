import type { AppAssistantModule } from "../lib/assistant-types";
import { feed } from "~encore/clients";

export const feedAssistant: AppAssistantModule = {
  appId: "feed",
  name: "Feed",
  description: "Arkadaşların ve kullanıcının son sosyal hareketlerini ve akışını görüntüler.",
  schema: "feed",
  tools: [
    {
      name: "get_feed",
      description: "Sosyal akıştaki etkinlikleri listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    get_feed: async ({ userId }) => {
      const res = await feed.getFeed({ userId });
      return res.events;
    },
  },
};
