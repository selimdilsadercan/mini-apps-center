import {
  optionalString,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { kim_gelir } from "~encore/clients";

export const kimGelirAssistant: AppAssistantModule = {
  appId: "kim-gelir",
  name: "Ne Yapsak?",
  description: "Aktivite davetleri ve anketleri oluşturup arkadaşlarının katılım durumlarını yönetir.",
  schema: "kim_gelir",
  tools: [
    {
      name: "list_activities",
      description: "Kullanıcının katıldığı veya oluşturduğu aktif aktiviteleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_activity",
      description: "Yeni bir aktivite daveti oluşturur.",
      permission: "create",
      parameters: {
        title: { type: "string", required: true, description: "Aktivite başlığı (örn: Spora gitmek, Kahve içmek)" },
        location: { type: "string", required: true, description: "Aktivite lokasyonu (örn: MacFit, İTÜ çevresi)" },
        timeOption: { type: "string", required: true, description: "Zaman seçeneği (şimdi, 30_dakika_sonra, bugun_aksam, yarin, custom)" },
        customTime: { type: "string", description: "Özel tarih/saat string'i (custom seçildiyse)" },
      },
    },
    {
      name: "respond_activity",
      description: "Bir aktiviteye katılım durumunu (gelirim, belki, gelemem) günceller.",
      permission: "update",
      parameters: {
        activityId: { type: "string", required: true, description: "Aktivite ID'si (UUID)" },
        status: { type: "string", required: true, description: "Katılım durumu (gelirim, belki, gelemem)" },
      },
    },
  ],
  executors: {
    list_activities: async ({ userId }) => {
      const res = await kim_gelir.getActivities({ userId });
      return res.activities;
    },
    create_activity: async ({ userId, args }) => {
      const res = await kim_gelir.createActivity({
        creatorId: userId,
        title: requireString(args, "title"),
        location: requireString(args, "location"),
        timeOption: requireString(args, "timeOption"),
        customTime: optionalString(args, "customTime") ?? undefined,
        invitedUserIds: [],
      });
      return [res];
    },
    respond_activity: async ({ userId, args }) => {
      const res = await kim_gelir.respondToActivity({
        activityId: requireString(args, "activityId"),
        userId,
        status: requireString(args, "status") as any,
      });
      return [res];
    },
  },
};
