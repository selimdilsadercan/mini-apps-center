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
  players_per_match: number;
  start_at?: string;
  winner_id?: string;
  participants_count?: number;
  is_joined?: boolean;
}

export interface Participant {
  id: string;
  tournament_id: string;
  user_id?: string;
  username: string;
  avatar?: string;
  points: number;
  wins: number;
  losses: number;
  average: number;
  is_present: boolean;
  joined_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  phase: "league" | "bracket";
  round: number;
  player1_id: string | null;
  player2_id: string | null;
  player3_id?: string | null;
  player4_id?: string | null;
  winner_id: string | null;
  status: "upcoming" | "playing" | "finished" | "abandoned";
  scores?: { [id: string]: number };
  username1?: string;
  username2?: string;
  username3?: string;
  username4?: string;
  avatar1?: string;
  avatar2?: string;
  avatar3?: string;
  avatar4?: string;
}

export interface MatchesResponse {
  matches: Match[];
}

export interface StandingsResponse {
  participants: Participant[];
}

// ==================== API ENDPOINTS ====================

/**
 * Yeni bir turnuva oluşturur
 */
export const createTournament = api(
  { expose: true, method: "POST", path: "/tournament" },
  async (params: {
    name: string;
    slug: string;
    icon?: string;
    capacity: number;
    format: "league_knockout" | "knockout";
    leagueMatchCount?: number;
    advanceCount?: number;
    playersPerMatch?: number;
    adminUserId: string;
  }): Promise<Tournament> => {  
    const { data, error } = await supabase.schema("tournament").rpc("create_tournament", {
      name_param: params.name,
      slug_param: params.slug,
      icon_param: params.icon || "🏆",
      capacity_param: params.capacity,
      format_param: params.format,
      league_match_count_param: params.leagueMatchCount || 3,
      advance_count_param: params.advanceCount || 4,
      players_per_match_param: params.playersPerMatch || 2,
      admin_clerk_id: params.adminUserId
    });

    if (error) {
      console.error("RPC error creating tournament:", error);
      if (error.code === "23505") throw new APIError(ErrCode.AlreadyExists, "Bu slug ile bir turnuva zaten var");
      throw new APIError(ErrCode.Internal, `Turnuva oluşturulamadı: ${error.message}`);
    }

    return data?.[0] as Tournament;
  }
);

/**
 * Tüm turnuvaları listeler
 */
export const getTournaments = api(
  { expose: true, method: "GET", path: "/tournaments" },
  async (): Promise<{ tournaments: Tournament[] }> => {
    const { data, error } = await supabase.schema("tournament").rpc("get_tournaments");

    if (error) {
      console.error("RPC error fetching tournaments:", error);
      throw new APIError(ErrCode.Internal, "Turnuvalar getirilemedi");
    }

    return { tournaments: data as Tournament[] };
  }
);

/**
 * Turnuva detaylarını getirir
 */
export const getTournamentDetails = api(
  { expose: true, method: "GET", path: "/tournament/:slug" },
  async ({ slug, userId }: { slug: string; userId?: string }): Promise<Tournament> => {
    const { data, error } = await supabase.schema("tournament").rpc("get_tournament_details", {
      slug_param: slug,
      viewer_clerk_id: userId
    });

    if (error || !data || data.length === 0) {
      throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    }

    return data[0] as Tournament;
  }
);

/**
 * Turnuvaya katılır
 */
export const joinTournament = api(
  { expose: true, method: "POST", path: "/tournament/join" },
  async ({ slug, userId, username, avatar, avoidList }: { slug: string; userId: string; username: string; avatar?: string; avoidList?: string[] }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("join_tournament", {
      slug_param: slug,
      clerk_id_param: userId,
      username_param: username,
      avatar_param: avatar,
      avoid_list_param: avoidList || []
    });

    if (error) {
      if (error.code === "23505") throw new APIError(ErrCode.AlreadyExists, "Zaten katıldınız");
      throw new APIError(ErrCode.Internal, error.message || "Katılım başarısız");
    }

    return { success: true };
  }
);

/**
 * Oyuncu bilgilerini günceller
 */
export const updateParticipant = api(
  { expose: true, method: "PATCH", path: "/tournament/participant/modify" },
  async ({ participantId, username, avatar }: { participantId: string; username: string; avatar: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("update_participant", {
      participant_id: participantId,
      username_param: username,
      avatar_param: avatar
    });

    if (error) {
      console.error("RPC error updating participant:", error);
      throw new APIError(ErrCode.Internal, "Oyuncu güncellenemedi");
    }

    return { success: true };
  }
);

/**
 * Maç skorunu günceller
 */
export const updateMatchScore = api(
  { expose: true, method: "POST", path: "/tournament/match/update-score" },
  async ({ matchId, scores }: { matchId: string; scores: { [participantId: string]: number } }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("update_match_score", {
      match_id: matchId,
      scores_param: scores
    });

    if (error) {
      console.error("RPC error updating match score:", error);
      throw new APIError(ErrCode.Internal, "Skor güncellenemedi");
    }

    return { success: true };
  }
);

/**
 * Bir katılımcıyı siler
 */
export const deleteParticipant = api(
  { expose: true, method: "DELETE", path: "/tournament/participant/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("delete_participant", {
      participant_id: id
    });

    if (error) {
      console.error("RPC error deleting participant:", error);
      throw new APIError(ErrCode.Internal, "Oyuncu silinemedi");
    }

    return { success: true };
  }
);

/**
 * Turnuvayı mock oyuncularla doldurur
 */
export const fillWithMockPlayers = api(
  { expose: true, method: "POST", path: "/tournament/:slug/fill-mock" },
  async ({ slug }: { slug: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("fill_mock_players", {
      slug_param: slug
    });

    if (error) {
      console.error("RPC error filling mock players:", error);
      throw new APIError(ErrCode.Internal, "Mock oyuncular eklenemedi");
    }

    return { success: true };
  }
);

/**
 * Turnuvayı siler
 */
export const deleteTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/delete" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("delete_tournament", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error deleting tournament:", error);
      if (error.message === "Permission denied") throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");
      throw new APIError(ErrCode.Internal, "Turnuva silinemedi");
    }

    return { success: true };
  }
);

/**
 * Mevcut turnuva şablonlarını getirir
 */
export const getTournamentTemplates = api(
  { expose: true, method: "GET", path: "/tournament/templates" },
  async (): Promise<{ templates: any[] }> => {
    const { data, error } = await supabase.schema("tournament").rpc("get_templates");

    if (error) {
      console.error("RPC error fetching templates:", error);
      throw new APIError(ErrCode.Internal, "Şablonlar getirilemedi");
    }

    return { templates: data || [] };
  }
);

/**
 * Turnuvayı başlatır ve ilk tur maçlarını oluşturur
 */
export const startTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/start" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("start_tournament", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error starting tournament:", error);
      throw new APIError(ErrCode.Internal, error.message || "Turnuva başlatılamadı");
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
    const { data, error } = await supabase.schema("tournament").rpc("get_matches", {
      slug_param: slug
    });

    if (error) {
      console.error("RPC error fetching matches:", error);
      throw new APIError(ErrCode.Internal, `Maçlar getirilemedi: ${error.message}`);
    }

    return { matches: data as Match[] };
  }
);

/**
 * Puan durumunu getirir
 */
export const getStandings = api(
  { expose: true, method: "GET", path: "/tournament/:slug/standings" },
  async ({ slug }: { slug: string }): Promise<StandingsResponse> => {
    const { data, error } = await supabase.schema("tournament").rpc("get_standings", {
      slug_param: slug
    });

    if (error) {
      console.error("RPC error fetching standings:", error);
      throw new APIError(ErrCode.Internal, "Puan durumu getirilemedi");
    }

    return { participants: (data as Participant[]) || [] };
  }
);


/**
 * Turnuvayı bir sonraki raunda veya aşamaya taşır
 */
export const advanceTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/advance" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("advance_tournament", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error advancing tournament:", error);
      throw new APIError(ErrCode.Internal, error.message || "Tur atlatılamadı");
    }

    return { success: true };
  }
);

/**
 * Lig aşamasını bitirir ve Bracket (Eleme) aşamasını başlatır (API Export)
 */
export const advanceToBracket = api(
  { expose: true, method: "POST", path: "/tournament/:slug/advance-to-bracket" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("advance_tournament", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error advancing to bracket:", error);
      throw new APIError(ErrCode.Internal, error.message || "Eleme aşamasına geçilemedi");
    }

    return { success: true };
  }
);

/**
 * Mevcut turdaki tüm maçlara otomatik skor atar (Sadece skor ekler, raundu bitirmez)
 */
export const autoScoreRound = api(
  { expose: true, method: "POST", path: "/tournament/:slug/auto-score" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("auto_score_round", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error auto-scoring round:", error);
      throw new APIError(ErrCode.Internal, error.message || "Skorlar atanamadı");
    }

    return { success: true };
  }
);
/**
 * Turnuvayı tamamen sıfırlar (Tüm maçlar silinir, durum 'upcoming' yapılır)
 */
export const resetTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/reset" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("reset_tournament", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error resetting tournament:", error);
      throw new APIError(ErrCode.Internal, error.message || "Turnuva sıfırlanamadı");
    }

    return { success: true };
  }
);

/**
 * Mevcut raundu sıfırlar (Sadece o raundun skorlarını temizler)
 */
export const resetCurrentRound = api(
  { expose: true, method: "POST", path: "/tournament/:slug/reset-round" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("reset_round", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error resetting round:", error);
      throw new APIError(ErrCode.Internal, error.message || "Raund sıfırlanamadı");
    }

    return { success: true };
  }
);
/**
 * Turnuvadaki tüm katılımcıları siler
 */
export const clearParticipants = api(
  { expose: true, method: "POST", path: "/tournament/:slug/clear-participants" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("tournament").rpc("clear_participants", {
      slug_param: slug,
      admin_clerk_id: adminUserId
    });

    if (error) {
      console.error("RPC error clearing participants:", error);
      throw new APIError(ErrCode.Internal, error.message || "Katılımcılar temizlenemedi");
    }

    return { success: true };
  }
);

/**
 * Oyuncunun yoklamasını alır veya iptal eder
 */
export const toggleCheckIn = api(
  { expose: true, method: "POST", path: "/tournament/participant/:participantId/toggle-check-in" },
  async ({ participantId }: { participantId: string }): Promise<{ is_present: boolean }> => {
    // Önce mevcut durumu al
    const { data: current, error: getError } = await supabase
      .schema("tournament")
      .from("participants")
      .select("is_present")
      .eq("id", participantId)
      .single();

    if (getError || !current) throw new APIError(ErrCode.NotFound, "Oyuncu bulunamadı");

    const newStatus = !current.is_present;

    const { error: updateError } = await supabase
      .schema("tournament")
      .from("participants")
      .update({ is_present: newStatus })
      .eq("id", participantId);

    if (updateError) {
      console.error("Error toggling check-in:", updateError);
      throw new APIError(ErrCode.Internal, "Yoklama durumu güncellenemedi");
    }

    return { is_present: newStatus };
  }
);
