import {
  optionalString,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { campus_concerts } from "~encore/clients";

export const campusConcertsAssistant: AppAssistantModule = {
  appId: "campus-concerts",
  name: "Campus Concerts",
  description: "Kampüs konserlerini ve kullanıcı katılım durumlarını yönetir.",
  schema: "campus_concerts",
  tools: [
    {
      name: "list_campus_concerts",
      description: "Kampüslerdeki konserleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_campus_concert",
      description: "Yeni bir kampüs konseri ekler veya önerir.",
      permission: "create",
      parameters: {
        artist: { type: "string", description: "Sanatçı veya Grup adı", required: true },
        campus: { type: "string", description: "Üniversite/Kampüs adı (örneğin: İTÜ Ayazağa, Boğaziçi Güney Kampüs)", required: true },
        date: { type: "string", description: "Konser tarihi (YYYY-MM-DD)", required: true },
        description: { type: "string", description: "Konser açıklaması/detayı" },
        imageUrl: { type: "string", description: "Görsel URL'i" },
      },
    },
    {
      name: "set_campus_concert_attendance",
      description: "Bir kampüs konserine katılım durumunu günceller.",
      permission: "update",
      parameters: {
        concertId: { type: "string", description: "Konser benzersiz kimliği (UUID)", required: true },
        status: { type: "string", description: "Katılım durumu ('went', 'going', 'interested', 'none')", required: true },
      },
    },
  ],
  executors: {
    list_campus_concerts: async ({ userId }) => {
      const res = await campus_concerts.getConcerts({ userId });
      return res.concerts;
    },
    add_campus_concert: async ({ userId, args }) => {
      const res = await campus_concerts.addConcert({
        userId,
        artist: requireString(args, "artist"),
        campus: requireString(args, "campus"),
        date: requireString(args, "date"),
        description: optionalString(args, "description") ?? undefined,
        imageUrl: optionalString(args, "imageUrl") ?? undefined,
      });
      return res.concert ? [res.concert] : [];
    },
    set_campus_concert_attendance: async ({ userId, args }) => {
      const res = await campus_concerts.setAttendance({
        userId,
        concertId: requireString(args, "concertId"),
        status: requireString(args, "status"),
      });
      return res;
    },
  },
};
