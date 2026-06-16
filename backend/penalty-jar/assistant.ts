import {
  optionalString,
  requireString,
  requireNumber,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { penalty_jar } from "~encore/clients";

export const penaltyJarAssistant: AppAssistantModule = {
  appId: "penalty-jar",
  name: "Ceza Kavanozu",
  description: "Arkadaşlarınla kural ihlallerini ve ceza puanlarını takip ettiğin eğlenceli bir oda (lobby) sistemi.",
  schema: "penalty_jar",
  tools: [
    {
      name: "list_lobbies",
      description: "Kullanıcının katıldığı veya oluşturduğu tüm ceza kavanozu odalarını listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "get_lobby_details",
      description: "Belirli bir ceza kavanozu odasının detaylarını, üyelerini, puanlarını ve ceza geçmişini getirir.",
      permission: "read",
      parameters: {
        lobbyId: { type: "string", required: true, description: "Oda ID'si (UUID)" },
      },
    },
  ],
  executors: {
    list_lobbies: async ({ userId }) => {
      const res = await penalty_jar.getUserLobbies({ userId });
      return res.lobbies;
    },
    get_lobby_details: async ({ args }) => {
      const lobbyId = requireString(args, "lobbyId");
      const res = await penalty_jar.getLobby({ lobbyId });
      return res.lobby;
    },
  },
};
