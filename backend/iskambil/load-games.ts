import type { SupabaseClient } from "@supabase/supabase-js";
import { getGamesData } from "./games";

export interface IskambilGameRow {
  id: string;
  name: string;
  name_tr: string;
  name_en: string;
  category: string;
  category_tr: string;
  category_en: string;
  is_favorite: boolean;
  is_known: boolean;
  user_note: string | null;
  min_players: number;
  max_players: number;
  deck_count_tr: string;
  deck_count_en: string;
  description_tr: string;
  description_en: string;
  rules_tr: string[];
  rules_en: string[];
  quick_rules_tr: string[] | null;
  quick_rules_en: string[] | null;
}

export async function loadIskambilGamesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<IskambilGameRow[]> {
  const db = supabase.schema("iskambil");

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
