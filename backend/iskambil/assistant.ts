import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { iskambil } from "~encore/clients";

export const iskambilAssistant: AppAssistantModule = {
  appId: "iskambil",
  name: "Card Game Codex",
  description: "Oyun favorileri, bilinen oyunlar ve notları günceller.",
  schema: "iskambil",
  tools: [
    {
      name: "list_games",
      description: "Kart oyunlarını listeler.",
      permission: "read",
      parameters: {
        userId: { type: "string", description: "Clerk user id (opsiyonel filtre)" },
      },
    },
    {
      name: "toggle_favorite",
      description: "Oyunu favorilere ekler/çıkarır.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
      },
    },
    {
      name: "toggle_known",
      description: "Oyunu bilinen olarak işaretler.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
      },
    },
    {
      name: "save_note",
      description: "Oyun için kişisel not kaydeder.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
        note: { type: "string", required: true, description: "Not metni" },
      },
    },
  ],
  executors: {
    list_games: async ({ userId }) => {
      const res = await iskambil.getGames({ userId });
      return res.games;
    },
    toggle_favorite: async ({ userId, args }) => {
      const res = await iskambil.toggleFavorite({
        userId,
        gameId: requireString(args, "gameId"),
      });
      return res;
    },
    toggle_known: async ({ userId, args }) => {
      const res = await iskambil.toggleKnown({
        userId,
        gameId: requireString(args, "gameId"),
      });
      return res;
    },
    save_note: async ({ userId, args }) => {
      const res = await iskambil.saveNote({
        userId,
        gameId: requireString(args, "gameId"),
        note: requireString(args, "note"),
      });
      return res;
    },
  },
};
