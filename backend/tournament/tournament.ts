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
    const { data, error } = await supabase.rpc("tournament.create_tournament", {
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
    const { data, error } = await supabase.rpc("tournament.get_tournaments");

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
    const { data, error } = await supabase.rpc("tournament.get_tournament_details", {
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
  { expose: true, method: "POST", path: "/tournament/:slug/join" },
  async ({ slug, userId, username, avatar }: { slug: string; userId: string; username: string; avatar?: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.rpc("tournament.join_tournament", {
      slug_param: slug,
      clerk_id_param: userId,
      username_param: username,
      avatar_param: avatar
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
  { expose: true, method: "PATCH", path: "/tournament/participant/:id" },
  async ({ id, username, avatar }: { id: string; username: string; avatar: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.rpc("tournament.update_participant", {
      participant_id: id,
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
  { expose: true, method: "POST", path: "/tournament/match/:id/score" },
  async ({ id, scores }: { id: string; scores: { [participantId: string]: number } }): Promise<{ success: boolean }> => {
    const { error } = await supabase.rpc("tournament.update_match_score", {
      match_id: id,
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
    const { error } = await supabase.rpc("tournament.delete_participant", {
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
    const { data: tournament, error: tError } = await supabase
      .schema("tournament")
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tError || !tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");

    const { count, error: cError } = await supabase
      .schema("tournament")
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournament.id);

    const currentCount = count || 0;
    const remaining = tournament.capacity - currentCount;

    if (remaining <= 0) return { success: true };

    const mockNames = [
      "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet",
      "Kilo", "Lima", "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango",
      "Uniform", "Victor", "Whiskey", "X-ray", "Yankee", "Zulu", "Maverick", "Goose", "Iceman", "Viper",
      "Phoenix", "Rooster", "Bob", "Hangman", "Coyote", "Payback", "Fanboy"
    ];

    const participantsToInsert = [];
    for (let i = 0; i < remaining; i++) {
      const randomName = `${mockNames[Math.floor(Math.random() * mockNames.length)]}_${Math.floor(Math.random() * 999)}`;
      const manualId = `mock_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`;
      
      // Rastgele bir avatar URL'si üret (DiceBear)
      const seed = Math.random().toString(36).substring(7);
      const avatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=transparent`;

      participantsToInsert.push({
        tournament_id: tournament.id,
        user_id: null, // Manuel/Mock oyuncu
        username: randomName,
        avatar: avatar,
        joined_at: new Date().toISOString()
      });
    }

    const { error: insertError } = await supabase
      .schema("tournament")
      .from("participants")
      .insert(participantsToInsert);

    if (insertError) {
      console.error("fillWithMockPlayers error:", insertError);
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
    const { error } = await supabase.rpc("tournament.delete_tournament", {
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
    const { data, error } = await supabase.rpc("tournament.get_templates");

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
    const { error } = await supabase.rpc("tournament.start_tournament", {
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
    const { data, error } = await supabase.rpc("tournament.get_matches", {
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
    const { data, error } = await supabase.rpc("tournament.get_standings", {
      slug_param: slug
    });

    return { participants: data as Participant[] };
  }
);


/**
 * Turnuvayı bir sonraki raunda veya aşamaya taşır
 */
export const advanceTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/advance" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    }

    if (nextRoundMatches.length > 0) {
        // Mevcut turun maçlarını bitmiş olarak işaretle
        await supabase
            .schema("tournament")
            .from("matches")
            .update({ status: "finished" })
            .eq("tournament_id", tournament.id)
            .eq("phase", "bracket")
            .eq("round", currentRound);

        await supabase.schema("tournament").from("matches").insert(nextRoundMatches);
    } else if (winners.length === 1) {
        // Şampiyon belli oldu
        await supabase
            .schema("tournament")
            .from("matches")
            .update({ status: "finished" })
            .eq("tournament_id", tournament.id)
            .eq("phase", "bracket")
            .eq("round", currentRound);
            
        await supabase.from("tournaments").update({ status: "completed", winner_id: winners[0] }).eq("id", tournament.id);
    }

    return { success: true };
}

/**
 * Lig aşamasını bitirir ve Bracket (Eleme) aşamasını başlatır (İç mantık)
 */
async function advanceToBracketLogic(tournament: any): Promise<{ success: boolean }> {
    const { data: participants } = await supabase.schema("tournament").from("participants").select("*").eq("tournament_id", tournament.id);
    
    // Maçları getir (puanı girilmiş olan her şeyi dahil et)
    const { data: matches } = await supabase
      .schema("tournament")
      .from("matches")
      .select("*")
      .eq("tournament_id", tournament.id);
    
    const validMatches = matches?.filter(m => m.scores && Object.keys(m.scores).length > 0) || [];

    if (!participants) throw new APIError(ErrCode.Internal, "Katılımcılar getirilemedi");

    // Puanları hesapla
    const participantStats = participants.map(p => ({ id: p.id, points: 0, average: 0 }));
    const statsMap = new Map(participantStats.map(s => [s.id, s]));

    (validMatches || []).forEach(m => {
      const pIds = [m.player1_id, m.player2_id, m.player3_id, m.player4_id].filter(Boolean);
      pIds.forEach((pid, idx) => {
        const stat = statsMap.get(pid!);
        if (stat) {
          const score = m.scores?.[pid!] || 0;
          stat.points += score;
          stat.average += score;
        }
      });
    });

    // Sırala ve ilk X kişiyi al
    const topPlayers = participantStats
      .sort((a, b) => b.points - a.points || b.average - a.average)
      .slice(0, tournament.advance_count);

    if (!topPlayers || topPlayers.length < 2) throw new APIError(ErrCode.InvalidArgument, "Üst tura çıkacak yeterli oyuncu yok");

    // Bracket maçlarını oluştur
    const bracketMatches = [];
    const count = topPlayers.length;
    
    const ppm = tournament.players_per_match || 2;
    
    // Oyuncuları maçlara dağıt (4 kişilik veya 2 kişilik olabilir)
    for (let i = 0; i < count; i += ppm) {
        const matchPlayers = topPlayers.slice(i, i + ppm);
        if (matchPlayers.length >= 2) {
            bracketMatches.push({
                tournament_id: tournament.id,
                phase: "bracket",
                round: 1,
                player1_id: matchPlayers[0]?.id || null,
                player2_id: matchPlayers[1]?.id || null,
                player3_id: matchPlayers[2]?.id || null,
                player4_id: matchPlayers[3]?.id || null,
                status: "upcoming"
            });
        }
    }

    if (bracketMatches.length > 0) {
        await supabase.schema("tournament").from("matches").insert(bracketMatches);
        // Turnuvayı güncelle: Lig bitti, Bracket başladı (round 0)
        await supabase.schema("tournament").from("tournaments").update({ current_league_round: 0 }).eq("id", tournament.id);
    }
    
    return { success: true };
}

/**
 * Lig aşamasını bitirir ve Bracket (Eleme) aşamasını başlatır (API Export)
 */
export const advanceToBracket = api(
  { expose: true, method: "POST", path: "/tournament/:slug/advance-to-bracket" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { data: tournament } = await supabase.schema("tournament").from("tournaments").select("*").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    if (tournament.admin_user_id !== adminUserId) throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");
    return await advanceToBracketLogic(tournament);
  }
);

/**
 * Mevcut turdaki tüm maçlara otomatik skor atar (Sadece skor ekler, raundu bitirmez)
 */
export const autoScoreRound = api(
  { expose: true, method: "POST", path: "/tournament/:slug/auto-score" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase.rpc("tournament.auto_score_round", {
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
    const { error } = await supabase.rpc("tournament.reset_tournament", {
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
    const { error } = await supabase.rpc("tournament.reset_round", {
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
