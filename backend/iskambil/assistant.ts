import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { getGamesData } from "./games";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
const db = supabase.schema("iskambil");

async function loadIskambilGamesForUser(userId: string) {
  const [favsResult, knownResult, notesResult] = await Promise.all([
    db.from("favorites").select("game_id").eq("clerk_id", userId),
    db.from("known_games").select("game_id").eq("clerk_id", userId),
    db.from("notes").select("game_id, note").eq("clerk_id", userId),
  ]);

  const favoritesSet = new Set(
    favsResult.error ? [] : (favsResult.data ?? []).map((f) => f.game_id),
  );
  const knownSet = new Set(
    knownResult.error ? [] : (knownResult.data ?? []).map((k) => k.game_id),
  );
  const notesMap = new Map(
    notesResult.error ? [] : (notesResult.data ?? []).map((n) => [n.game_id, n.note]),
  );

  return getGamesData().map((g: Record<string, unknown>) => ({
    id: String(g.id),
    name: String(g.name_tr ?? g.id),
    name_tr: String(g.name_tr ?? ""),
    name_en: String(g.name_en ?? ""),
    category: String(g.category_tr ?? ""),
    category_tr: String(g.category_tr ?? ""),
    category_en: String(g.category_en ?? ""),
    is_favorite: favoritesSet.has(String(g.id)),
    is_known: knownSet.has(String(g.id)),
    user_note: notesMap.get(String(g.id)) ?? null,
    min_players: Number(g.minPlayers ?? 0),
    max_players: Number(g.maxPlayers ?? 0),
    deck_count_tr: String(g.deckCount_tr ?? ""),
    deck_count_en: String(g.deckCount_en ?? ""),
    description_tr: String(g.description_tr ?? ""),
    description_en: String(g.description_en ?? ""),
    rules_tr: (g.rules_tr as string[]) ?? (g.quickRules_tr as string[]) ?? [],
    rules_en: (g.rules_en as string[]) ?? (g.quickRules_en as string[]) ?? [],
    quick_rules_tr: (g.quickRules_tr as string[]) ?? null,
    quick_rules_en: (g.quickRules_en as string[]) ?? null,
  }));
}

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
      execute: async ({ userId }) => {
        return loadIskambilGamesForUser(userId);
      },
    },
    {
      name: "toggle_favorite",
      description: "Oyunu favorilere ekler/çıkarır.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
      },
      execute: async ({ userId, args }) => {
        return runRpc("toggle_favorite", async () =>
          await db.rpc("toggle_favorite", {
            clerk_id_param: userId,
            game_id_param: requireString(args, "gameId"),
          }),
        );
      },
    },
    {
      name: "toggle_known",
      description: "Oyunu bilinen olarak işaretler.",
      permission: "update",
      parameters: {
        gameId: { type: "string", required: true, description: "Oyun id" },
      },
      execute: async ({ userId, args }) => {
        return runRpc("toggle_known", async () =>
          await db.rpc("toggle_known", {
            clerk_id_param: userId,
            game_id_param: requireString(args, "gameId"),
          }),
        );
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
      execute: async ({ userId, args }) => {
        return runRpc("save_note", async () =>
          await db.rpc("save_note", {
            clerk_id_param: userId,
            game_id_param: requireString(args, "gameId"),
            note_param: requireString(args, "note"),
          }),
        );
      },
    },
  ],
};
