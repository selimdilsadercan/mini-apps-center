/**
 * BoardGameClubs API Actions
 * Client-side API wrappers for BoardGameClubs operations
 */

import { createBrowserClient } from "@/lib/api";
import { isUnauthenticatedError, getErrorMessage } from "@/lib/api-error-handler";
import type { board_game_clubs, lib } from "@/lib/client";

interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Clerk ID ile Supabase user'ı getirir veya oluşturur
 */
export async function getOrCreateUserAction(
  clerkId: string
): Promise<ActionResponse<lib.User>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.getOrCreateUser({ clerkId });
    if (response.user) {
      return { data: response.user, error: null };
    }
    return { data: null, error: "Kullanıcı oluşturulamadı" };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Kullanıcının kulüplerini listeler
 */
export async function getUserClubsAction(
  userId: string
): Promise<ActionResponse<board_game_clubs.Club[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.getUserClubs(userId);
    return { data: response.clubs || [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Yeni kulüp oluşturur
 */
export async function createClubAction(params: {
  name: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
  businessId?: string;
}): Promise<ActionResponse<board_game_clubs.Club>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.createClub(params);
    return { data: response.club, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Kulüp bilgilerini günceller
 */
export async function updateClubAction(params: {
  clubId: string;
  name?: string;
  description?: string;
  logoUrl?: string;
}): Promise<ActionResponse<board_game_clubs.Club>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.updateClub(params.clubId, params);
    return { data: response.club, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Kulüp detaylarını getirir
 */
export async function getClubDetailsAction(
  clubId: string
): Promise<ActionResponse<board_game_clubs.Club>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.getClubDetails(clubId);
    return { data: response.club, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * İşletmeye bağlı kulübü getirir
 */
export async function getClubByBusinessIdAction(
  businessId: string
): Promise<ActionResponse<board_game_clubs.Club>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.getClubByBusinessId(businessId);
    return { data: response.club, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Kulüpteki oyunları getirir
 */
export async function getClubGamesAction(
  clubId: string
): Promise<ActionResponse<board_game_clubs.ClubGame[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.getClubGames(clubId);
    return { data: response.games || [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Kulübe oyun ekler
 */
export async function addClubGameAction(
  clubId: string,
  params: {
    title: string;
    bggId?: number;
    imageUrl?: string;
    minPlayers?: number;
    maxPlayers?: number;
    playingTime?: number;
    description?: string;
    condition?: "new" | "good" | "worn" | "damaged";
    status?: "available" | "borrowed" | "maintenance";
    notes?: string;
    apiKey?: string;
  }
): Promise<ActionResponse<board_game_clubs.ClubGame>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.addClubGame(clubId, params);
    return { data: response.game, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Oyunu günceller
 */
export async function updateClubGameAction(
  gameId: string,
  params: {
    title?: string;
    imageUrl?: string;
    minPlayers?: number;
    maxPlayers?: number;
    playingTime?: number;
    description?: string;
    condition?: "new" | "good" | "worn" | "damaged";
    status?: "available" | "borrowed" | "maintenance";
    notes?: string;
  }
): Promise<ActionResponse<board_game_clubs.ClubGame>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.updateClubGame(gameId, params);
    return { data: response.game, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Oyunu siler
 */
export async function deleteClubGameAction(
  gameId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.deleteClubGame(gameId);
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * BGG araması yapar
 */
export async function searchBggGamesAction(
  query: string,
  apiKey?: string
): Promise<ActionResponse<board_game_clubs.BggSearchResult[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.searchBggGames({ query, apiKey });
    return { data: response.results || [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Geeklist import eder
 */
export async function importBggGeeklistAction(
  clubId: string,
  geeklistId: string,
  apiKey?: string
): Promise<ActionResponse<{ importedCount: number; failedCount: number; games: board_game_clubs.ClubGame[] }>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.importBggGeeklist(clubId, { geeklistId, apiKey });
    return {
      data: {
        importedCount: response.importedCount,
        failedCount: response.failedCount,
        games: response.games || []
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * CSV import eder
 */
export async function importCsvGamesAction(
  clubId: string,
  csvContent: string
): Promise<ActionResponse<{ importedCount: number; failedCount: number }>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.importCsvGames(clubId, { csvContent });
    return {
      data: {
        importedCount: response.importedCount,
        failedCount: response.failedCount,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * BGG ile senkronize eder (Resimleri çeker)
 */
export async function syncBggGamesAction(
  clubId: string
): Promise<ActionResponse<{ syncedCount: number; failedCount: number }>> {
  try {
    const client = createBrowserClient();
    const response = await client.board_game_clubs.syncClubGamesWithBgg(clubId);
    return {
      data: {
        syncedCount: response.syncedCount,
        failedCount: response.failedCount,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
