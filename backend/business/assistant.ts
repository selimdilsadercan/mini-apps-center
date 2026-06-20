import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { business } from "~encore/clients";

export const businessAssistant: AppAssistantModule = {
  appId: "business",
  name: "Business Manager",
  description: "İşletme profillerini ve dükkan yönetim panellerini kontrol eder.",
  schema: "business",
  tools: [
    {
      name: "get_owned_businesses",
      description: "Kullanıcının sahibi olduğu tüm işletme profillerini listeler.",
      permission: "read",
      parameters: {
        userId: { type: "string", description: "Kullanıcı ID'si", required: true },
      },
    },
  ],
  executors: {
    get_owned_businesses: async ({ args }) => {
      const res = await business.getOwnedBusinesses({
        userId: requireString(args, "userId"),
      });
      return res.businesses;
    },
  },
};
