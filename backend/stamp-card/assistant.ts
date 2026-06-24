import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { stamp_card } from "~encore/clients";

export const stampCardAssistant: AppAssistantModule = {
  appId: "stamp-card",
  name: "Müdavim Kartı",
  description: "Dijital sadakat ve kaşe kartı uygulamasını yönetir. İşletmelerin kartlarını listeler, kaşe ekler ve ödülleri yönetir.",
  schema: "stamp_card",
  tools: [
    {
      name: "get_user_stamp_data",
      description: "Kullanıcının tüm aktif kaşe kartlarını, kazandığı ödülleri ve sahip olduğu işletmeleri getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_stamp_to_card",
      description: "Belirtilen işletmenin kartına kaşe ekler. İşletmenin PIN kodunu gerektirir.",
      permission: "update",
      parameters: {
        businessId: { type: "string", description: "İşletmenin benzersiz ID'si", required: true },
        pin: { type: "string", description: "İşletmenin 4 haneli şifresi (PIN)", required: true },
      },
    },
    {
      name: "use_redeemed_reward",
      description: "Kazanılmış bir ödül kuponunu kullanıldı olarak işaretler.",
      permission: "update",
      parameters: {
        rewardId: { type: "string", description: "Ödül kuponu benzersiz ID'si", required: true },
      },
    },
  ],
  executors: {
    get_user_stamp_data: async ({ userId }) => {
      const res = await stamp_card.getUserData({ userId });
      return res;
    },
    add_stamp_to_card: async ({ userId, args }) => {
      const res = await stamp_card.addStamp({
        userId,
        businessId: requireString(args, "businessId"),
        pin: requireString(args, "pin"),
      });
      return res;
    },
    use_redeemed_reward: async ({ userId, args }) => {
      const res = await stamp_card.useReward({
        userId,
        rewardId: requireString(args, "rewardId"),
      });
      return res;
    },
  },
};
