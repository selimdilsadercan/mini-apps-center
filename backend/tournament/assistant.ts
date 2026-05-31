import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import {
  optionalNumber,
  optionalString,
  requireNumber,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
const db = supabase.schema("tournament");

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
      return runRpc("list_tournaments", async () => await db.rpc("get_tournaments"));
    },
    create_tournament: async ({ userId, args }) => {
      return runRpc("create_tournament", async () =>
        await db.rpc("create_tournament", {
          name_param: requireString(args, "name"),
          slug_param: requireString(args, "slug"),
          icon_param: optionalString(args, "icon") ?? "🏆",
          capacity_param: requireNumber(args, "capacity"),
          format_param: requireString(args, "format"),
          league_match_count_param: optionalNumber(args, "leagueMatchCount") ?? 3,
          advance_count_param: optionalNumber(args, "advanceCount") ?? 4,
          players_per_match_param: optionalNumber(args, "playersPerMatch") ?? 2,
          admin_clerk_id: userId,
        }),
      );
    },
    join_tournament: async ({ userId, args }) => {
      return runRpc("join_tournament", async () =>
        await db.rpc("join_tournament", {
          slug_param: requireString(args, "slug"),
          clerk_id_param: userId,
          username_param: requireString(args, "username"),
          avatar_param: optionalString(args, "avatar"),
          avoid_list_param: args.avoidList ?? [],
        }),
      );
    },
    update_match_score: async ({ args }) => {
      return runRpc("update_match_score", async () =>
        await db.rpc("update_match_score", {
          match_id: requireString(args, "matchId"),
          scores_param: args.scores,
        }),
      );
    },
    delete_tournament: async ({ userId, args }) => {
      return runRpc("delete_tournament", async () =>
        await db.rpc("delete_tournament", {
          slug_param: requireString(args, "slug"),
          admin_clerk_id: userId,
        }),
      );
    },
  },
};
