import { api, APIError, ErrCode } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  status: "upcoming" | "active" | "completed";
  admin_user_id: string;
  capacity: number;
  advance_count: number;
  current_league_round: number;
  league_match_count: number;
  format: "league_knockout" | "knockout";
  start_at?: string;
  winner_id?: string;
  participants_count?: number;
  is_joined?: boolean;
}

export interface Participant {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  avatar?: string;
  points: number;
  wins: number;
  losses: number;
  average: number;
}

export interface Match {
  id: string;
  tournament_id: string;
  phase: "league" | "bracket";
  round: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  score1: number;
  score2: number;
  status: "upcoming" | "playing" | "finished" | "abandoned";
  username1?: string;
  username2?: string;
  avatar1?: string;
  avatar2?: string;
}

export interface MatchesResponse {
  matches: Match[];
}

export interface StandingsResponse {
  participants: Participant[];
}

// ==================== API ENDPOINTS ====================

/**
 * Turnuva detaylarını getirir
 */
export const getTournamentDetails = api(
  { expose: true, method: "GET", path: "/tournament/:slug" },
  async ({ slug, userId }: { slug: string; userId?: string }): Promise<Tournament> => {
    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        participants:tournament_participants(count)
      `)
      .eq("slug", slug)
      .single();

    if (error || !tournament) {
      throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    }

    let isJoined = false;
    if (userId) {
      const { data: part } = await supabase
        .from("tournament_participants")
        .select("id")
        .eq("tournament_id", tournament.id)
        .eq("user_id", userId)
        .single();
      isJoined = !!part;
    }

    return {
      ...tournament,
      participants_count: tournament.participants?.[0]?.count || 0,
      is_joined: isJoined
    } as Tournament;
  }
);

/**
 * Turnuvaya katılır
 */
export const joinTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/join" },
  async ({ slug, userId, username, avatar }: { slug: string; userId: string; username: string; avatar?: string }): Promise<{ success: boolean }> => {
    const { data: tournament, error: tError } = await supabase
      .from("tournaments")
      .select("id, status, capacity")
      .eq("slug", slug)
      .single();

    if (tError || !tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    if (tournament.status !== "upcoming") throw new APIError(ErrCode.InvalidArgument, "Turnuva zaten başladı veya bitti");

    const { error: jError } = await supabase
      .from("tournament_participants")
      .insert({
        tournament_id: tournament.id,
        user_id: userId,
        username,
        avatar
      });

    if (jError) {
      if (jError.code === "23505") throw new APIError(ErrCode.AlreadyExists, "Zaten katıldınız");
      throw new APIError(ErrCode.Internal, "Katılım başarısız");
    }

    return { success: true };
  }
);

/**
 * Turnuvayı başlatır ve ilk tur maçlarını oluşturur
 */
export const startTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/start" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { data: tournament, error: tError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tError || !tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    if (tournament.admin_user_id !== adminUserId) throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");
    
    // Katılımcıları al
    const { data: participants, error: pError } = await supabase
      .from("tournament_participants")
      .select("user_id, username")
      .eq("tournament_id", tournament.id);

    if (pError || !participants || participants.length < 2) {
      throw new APIError(ErrCode.InvalidArgument, "Yeterli katılımcı yok (En az 2)");
    }

    // Durumu güncelle
    await supabase.from("tournaments").update({ status: "active", start_at: new Date().toISOString() }).eq("id", tournament.id);

    // İlk tur lig maçlarını oluştur
    // Basit bir eşleşme mantığı: Random pairler (Round-robin için basitleştirilmiş)
    const matchesToCreate = [];
    if (tournament.format === "league_knockout") {
      // 1. Tur için her oyuncuyu bir kez eşleştir (örnek)
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          matchesToCreate.push({
            tournament_id: tournament.id,
            phase: "league",
            round: 1,
            player1_id: shuffled[i].user_id,
            player2_id: shuffled[i + 1].user_id,
            status: "upcoming"
          });
        }
      }
    }

    if (matchesToCreate.length > 0) {
      await supabase.from("tournament_matches").insert(matchesToCreate);
    }

    return { success: true };
  }
);

/**
 * Maçları getirir
 */
export const getTournamentMatches = api(
  { expose: true, method: "GET", path: "/tournament/:slug/matches" },
  async ({ slug }: { slug: string }): Promise<MatchesResponse> => {
    const { data: tournament } = await supabase.from("tournaments").select("id").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");

    const { data: matches, error } = await supabase
      .from("tournament_matches")
      .select(`
        *,
        player1:users!player1_id(username, avatar),
        player2:users!player2_id(username, avatar)
      `)
      .eq("tournament_id", tournament.id)
      .order("round", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new APIError(ErrCode.Internal, "Maçlar getirilemedi");

    return {
      matches: matches.map(m => ({
        ...m,
        username1: m.player1?.username,
        username2: m.player2?.username,
        avatar1: m.player1?.avatar,
        avatar2: m.player2?.avatar
      })) as Match[]
    };
  }
);

/**
 * Puan durumunu getirir
 */
export const getStandings = api(
  { expose: true, method: "GET", path: "/tournament/:slug/standings" },
  async ({ slug }: { slug: string }): Promise<StandingsResponse> => {
    const { data: tournament } = await supabase.from("tournaments").select("id").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");

    const { data: standings, error } = await supabase
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("points", { ascending: false })
      .order("average", { ascending: false });

    if (error) throw new APIError(ErrCode.Internal, "Puan durumu getirilemedi");

    return { participants: standings as Participant[] };
  }
);

/**
 * Maç skorunu günceller
 */
export const updateMatchScore = api(
  { expose: true, method: "POST", path: "/tournament/match/:matchId/score" },
  async ({ matchId, score1, score2, adminUserId }: { matchId: string; score1: number; score2: number; adminUserId: string }): Promise<{ success: boolean }> => {
    // Önce maçı doğrula
    const { data: match, error: mError } = await supabase
      .from("tournament_matches")
      .select("*, tournament:tournaments(admin_user_id)")
      .eq("id", matchId)
      .single();

    if (mError || !match) throw new APIError(ErrCode.NotFound, "Maç bulunamadı");
    // @ts-ignore
    if (match.tournament.admin_user_id !== adminUserId) throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");

    const winnerId = score1 > score2 ? match.player1_id : (score2 > score1 ? match.player2_id : null);

    const { error: uError } = await supabase
      .from("tournament_matches")
      .update({
        score1,
        score2,
        winner_id: winnerId,
        status: "finished"
      })
      .eq("id", matchId);

    if (uError) throw new APIError(ErrCode.Internal, "Skor güncellenemedi");

    // İlgili katılımcıların istatistiklerini güncelle (Sadeleştirilmiş logic)
    // Gerçek bir sistemde bu bir trigger veya daha sağlam bir function olmalı
    return { success: true };
  }
);

/**
 * Lig aşamasını bitirir ve Bracket (Eleme) aşamasını başlatır
 */
export const advanceToBracket = api(
  { expose: true, method: "POST", path: "/tournament/:slug/advance-to-bracket" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { data: tournament } = await supabase.from("tournaments").select("*").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    if (tournament.admin_user_id !== adminUserId) throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");

    // İlk N oyuncuyu al
    const { data: topPlayers } = await supabase
      .from("tournament_participants")
      .select("user_id")
      .eq("tournament_id", tournament.id)
      .order("points", { ascending: false })
      .order("average", { ascending: false })
      .limit(tournament.advance_count);

    if (!topPlayers || topPlayers.length < 2) throw new APIError(ErrCode.InvalidArgument, "Yeterli oyuncu yok");

    // Bracket maçlarını oluştur (Örn: Çeyrek Final)
    const bracketMatches = [];
    const count = topPlayers.length;
    
    // Klasik Seeding: 1v8, 2v7, 3v6, 4v5 (Yarısı kadar maç)
    for (let i = 0; i < count / 2; i++) {
        bracketMatches.push({
            tournament_id: tournament.id,
            phase: "bracket",
            round: 1, // Bracket'ın 1. Turu (Çeyrek Final vb.)
            player1_id: topPlayers[i].user_id,
            player2_id: topPlayers[count - 1 - i].user_id,
            status: "upcoming"
        });
    }

    if (bracketMatches.length > 0) {
        await supabase.from("tournament_matches").insert(bracketMatches);
        // Turnuvayı bracket moduna geçir ve turu sıfırla/güncelle
        await supabase.from("tournaments").update({ current_league_round: 0 }).eq("id", tournament.id);
    }
    
    return { success: true };
  }
);
