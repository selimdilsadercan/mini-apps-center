import {
  optionalNumber,
  optionalString,
  requireNumber,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { tournament } from "~encore/clients";

export const tournamentAssistant: AppAssistantModule = {
  appId: "tournament",
  name: "Turnuva Merkezi",
  description: "Turnuva oluşturur ve skorları günceller.",
  schema: "tournament",
  tools: [
    {
      name: "list_tournaments",
      description: "Turnuvaları listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_tournament",
      description: "Yeni turnuva oluşturur.",
      permission: "create",
      parameters: {
        name: { type: "string", required: true, description: "Turnuva adı" },
        slug: { type: "string", required: true, description: "URL slug" },
        capacity: { type: "number", required: true, description: "Kapasite" },
        format: {
          type: "string",
          required: true,
          description: "league_knockout | knockout",
        },
        icon: { type: "string", description: "İkon" },
        leagueMatchCount: { type: "number", description: "Lig maç sayısı" },
        advanceCount: { type: "number", description: "Üst tura çıkan" },
        playersPerMatch: { type: "number", description: "Maç başına oyuncu" },
      },
    },
    {
      name: "join_tournament",
      description: "Turnuvaya katılır.",
      permission: "create",
      parameters: {
        slug: { type: "string", required: true, description: "Turnuva slug" },
        username: { type: "string", required: true, description: "Kullanıcı adı" },
        avatar: { type: "string", description: "Avatar URL" },
        avoidList: { type: "array", description: "Kaçınılacak oyuncu id listesi" },
      },
    },
    {
      name: "update_match_score",
      description: "Maç skorunu günceller.",
      permission: "update",
      parameters: {
        matchId: { type: "string", required: true, description: "Maç id" },
        scores: {
          type: "object",
          required: true,
          description: "participantId -> skor",
        },
      },
    },
    {
      name: "delete_tournament",
      description: "Turnuvayı siler.",
      permission: "delete",
      parameters: {
        slug: { type: "string", required: true, description: "Turnuva slug" },
      },
    },
  ],
  executors: {
    list_tournaments: async () => {
      const res = await tournament.getTournaments();
      return res.tournaments;
    },
    create_tournament: async ({ userId, args }) => {
      const res = await tournament.createTournament({
        name: requireString(args, "name"),
        slug: requireString(args, "slug"),
        icon: optionalString(args, "icon") ?? "🏆",
        capacity: requireNumber(args, "capacity"),
        format: requireString(args, "format") as any,
        leagueMatchCount: optionalNumber(args, "leagueMatchCount") ?? 3,
        advanceCount: optionalNumber(args, "advanceCount") ?? 4,
        playersPerMatch: optionalNumber(args, "playersPerMatch") ?? 2,
        adminUserId: userId,
      });
      return res ? [res] : [];
    },
    join_tournament: async ({ userId, args }) => {
      const res = await tournament.joinTournament({
        slug: requireString(args, "slug"),
        userId: userId,
        username: requireString(args, "username"),
        avatar: optionalString(args, "avatar") ?? undefined,
        avoidList: (args.avoidList as any) ?? [],
      });
      return res;
    },
    update_match_score: async ({ args }) => {
      const res = await tournament.updateMatchScore({
        matchId: requireString(args, "matchId"),
        scores: (args.scores as any) ?? {},
      });
      return res;
    },
    delete_tournament: async ({ userId, args }) => {
      const res = await tournament.deleteTournament({
        slug: requireString(args, "slug"),
        adminUserId: userId,
      });
      return res;
    },
  },
};
