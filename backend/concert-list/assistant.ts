import {
  optionalNumber,
  optionalString,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { concert_list } from "~encore/clients";

export const concertListAssistant: AppAssistantModule = {
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
  executors: {
    list_concerts: async ({ userId }) => {
      const res = await concert_list.getConcerts({ userId });
      return res.concerts;
    },
    add_concert: async ({ userId, args }) => {
      const rating = optionalNumber(args, "rating");
      const res = await concert_list.addConcert({
        userId,
        artist: requireString(args, "artist"),
        date: requireString(args, "date"),
        venue: optionalString(args, "venue") ?? undefined,
        notes: optionalString(args, "notes") ?? undefined,
        rating: rating !== null ? rating : undefined,
      });
      return res.concert ? [res.concert] : [];
    },
    delete_concert: async ({ userId, args }) => {
      const res = await concert_list.deleteConcert({
        id: requireString(args, "id"),
        userId,
      });
      return res;
    },
  },
};
