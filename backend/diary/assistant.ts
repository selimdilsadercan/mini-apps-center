import {
  requireString,
  optionalString,
  optionalNumber,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { diary } from "~encore/clients";

export const diaryAssistant: AppAssistantModule = {
  appId: "diary",
  name: "Diary",
  description: "Kullanıcının günlük aktivitelerini (sinema, kafe, spor, vb.) kaydettiği, arkadaşlarıyla paylaştığı ve aylık özet çıkardığı Günlük uygulamasını yönetir.",
  schema: "diary",
  tools: [
    {
      name: "get_diary_logs",
      description: "Kullanıcının eklediği tüm günlük aktivitelerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_diary_log",
      description: "Günlüğe yeni bir aktivite kaydı ekler. Sinema, kafe ziyareti, çalışma, spor vb. her şeyi kaydedebilir.",
      permission: "update",
      parameters: {
        activityType: { type: "string", description: "Aktivite kategorisi (cafe, restaurant, cinema, sport, study, social, outdoor, event, custom)", required: true },
        title: { type: "string", description: "Aktivite başlığı (örn: IMAX Oppenheimer, Starbucks Çalışma, Belgrad Ormanı Koşusu)", required: true },
        location: { type: "string", description: "Mekan veya konum bilgisi", required: false },
        date: { type: "string", description: "Aktivite tarihi (ISO String veya YYYY-MM-DD), varsayılan bugündür", required: false },
        notes: { type: "string", description: "Kişisel yorum veya notlar", required: false },
        rating: { type: "number", description: "1-5 arası değerlendirme puanı", required: false },
      },
    },
    {
      name: "delete_diary_log",
      description: "Belirtilen aktivite kaydını günlükten siler.",
      permission: "update",
      parameters: {
        logId: { type: "string", description: "Silinecek log kaydının ID'si", required: true },
      },
    },
  ],
  executors: {
    get_diary_logs: async ({ userId }) => {
      const res = await diary.getLogs({ userId });
      return res;
    },
    add_diary_log: async ({ userId, args }) => {
      const res = await diary.addLog({
        userId,
        activityType: requireString(args, "activityType"),
        title: requireString(args, "title"),
        location: optionalString(args, "location") ?? undefined,
        date: optionalString(args, "date") || new Date().toISOString(),
        notes: optionalString(args, "notes") ?? undefined,
        rating: optionalNumber(args, "rating") ?? undefined,
      });
      return res;
    },
    delete_diary_log: async ({ userId, args }) => {
      const res = await diary.deleteLog({
        userId,
        logId: requireString(args, "logId"),
      });
      return res;
    },
  },
};
