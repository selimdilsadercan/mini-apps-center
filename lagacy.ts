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
    // Önce clerk_id'yi gerçek users.id (UUID) değerine dönüştürmeliyiz
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", params.adminUserId)
      .single();

    if (userError || !userData) {
      console.error("User not found for clerk_id:", params.adminUserId);
      throw new APIError(ErrCode.NotFound, "Yönetici kullanıcı bulunamadı. Lütfen giriş yaptığınızdan emin olun.");
    }

    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name: params.name,
        slug: params.slug,
        icon: params.icon || "🏆",
        capacity: params.capacity,
        format: params.format,
        league_match_count: params.leagueMatchCount || 3,
        advance_count: params.advanceCount || 4,
        players_per_match: params.playersPerMatch || 2,
        admin_user_id: userData.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating tournament:", error);
      if (error.code === "23505") throw new APIError(ErrCode.AlreadyExists, "Bu slug ile bir turnuva zaten var");
      throw new APIError(ErrCode.Internal, `Turnuva oluşturulamadı: ${error.message}`);
    }

    return data as Tournament;
  }
);

/**
 * Tüm turnuvaları listeler
 */
export const getTournaments = api(
  { expose: true, method: "GET", path: "/tournaments" },
  async (): Promise<{ tournaments: Tournament[] }> => {
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching tournaments:", error);
      throw new APIError(ErrCode.Internal, "Turnuvalar getirilemedi");
    }

    // Her turnuva için katılımcı sayısını manuel alalım (daha güvenli)
    const processedTournaments = await Promise.all((tournaments || []).map(async (t) => {
      const { count } = await supabase
        .from("tournament_participants")
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", t.id);
      
      return {
        ...t,
        participants_count: count || 0
      };
    }));

    return { tournaments: processedTournaments as Tournament[] };
  }
);

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

    let internalUserId: string | null = null;
    
    // Eğer manual_ ile başlamıyorsa gerçek bir kullanıcıdır, UUID'sini bulmalıyız
    if (!userId.startsWith("manual_")) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();
      
      if (userData) {
        internalUserId = userData.id;
      }
    }

    const { error: jError } = await supabase
      .from("tournament_participants")
      .insert({
        tournament_id: tournament.id,
        user_id: internalUserId,
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
 * Oyuncu bilgilerini günceller
 */
export const updateParticipant = api(
  { expose: true, method: "PATCH", path: "/tournament/participant/:id" },
  async ({ id, username, avatar }: { id: string; username: string; avatar: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from("tournament_participants")
      .update({ username, avatar })
      .eq("id", id);

    if (error) {
      console.error("updateParticipant error:", error);
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
    // Maçı ve turnuvayı getir
    const { data: match, error: mError } = await supabase
      .from("tournament_matches")
      .select("*, tournament:tournaments(*)")
      .eq("id", id)
      .single();

    if (mError || !match) throw new APIError(ErrCode.NotFound, "Maç bulunamadı");

    const ppm = match.tournament.players_per_match || 2;
    // Skorları eşleştir ve updateData'yı hazırla
    const updateData: any = {
      scores: scores, // Esnek JSON alanı
      status: "finished",
      updated_at: new Date().toISOString()
    };

    // 2 kişilik maç ise kazananı belirle
    if (ppm === 2) {
      const s1 = scores[match.player1_id] || 0;
      const s2 = scores[match.player2_id] || 0;
      if (s1 > s2) updateData.winner_id = match.player1_id;
      else if (s2 > s1) updateData.winner_id = match.player2_id;
    }

    const { error: updateError } = await supabase
      .from("tournament_matches")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw new APIError(ErrCode.Internal, "Skor güncellenemedi");

    return { success: true };
  }
);

/**
 * Bir katılımcıyı siler
 */
export const deleteParticipant = api(
  { expose: true, method: "DELETE", path: "/tournament/participant/:id" },
  async ({ id }: { id: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from("tournament_participants")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("deleteParticipant error:", error);
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
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tError || !tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");

    const { count, error: cError } = await supabase
      .from("tournament_participants")
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
      .from("tournament_participants")
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
    // Önce clerk_id'yi gerçek users.id'ye dönüştür
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", adminUserId)
      .single();

    if (!userData) throw new APIError(ErrCode.PermissionDenied, "Kullanıcı bulunamadı");

    // Turnuvayı getir
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, admin_user_id")
      .eq("slug", slug)
      .single();

    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    if (tournament.admin_user_id !== userData.id) throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");

    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournament.id);

    if (error) {
      console.error("deleteTournament error:", error);
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
    const { data, error } = await supabase
      .from("tournament_templates")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getTournamentTemplates error:", error);
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
    const { data: tournament, error: tError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tError || !tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    
    // Clerk ID'yi gerçek ID'ye dönüştür
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", adminUserId)
      .single();

    if (!userData || tournament.admin_user_id !== userData.id) {
      throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");
    }
    
    // Katılımcıları al
    const { data: participants, error: pError } = await supabase
      .from("tournament_participants")
      .select("id, username")
      .eq("tournament_id", tournament.id);

    if (pError || !participants || participants.length < 2) {
      throw new APIError(ErrCode.InvalidArgument, "Yeterli katılımcı yok (En az 2)");
    }

    // Durumu güncelle
    await supabase.from("tournaments").update({ status: "active", start_at: new Date().toISOString() }).eq("id", tournament.id);

    // İlk tur lig maçlarını oluştur
    const matchesToCreate = [];
    if (tournament.format === "league_knockout") {
      const ppm = tournament.players_per_match || 2;
      const roundCount = tournament.league_match_count || 3;

      for (let r = 1; r <= roundCount; r++) {
        // Her turda farklı eşleşmeler olması için karıştır
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffled.length; i += ppm) {
          const matchPlayers = shuffled.slice(i, i + ppm);
          if (matchPlayers.length >= 2) { // En az 2 kişi lazım maç olması için
            matchesToCreate.push({
              tournament_id: tournament.id,
              phase: "league",
              round: r,
              player1_id: matchPlayers[0]?.id || null,
              player2_id: matchPlayers[1]?.id || null,
              player3_id: matchPlayers[2]?.id || null,
              player4_id: matchPlayers[3]?.id || null,
              status: "upcoming"
            });
          }
        }
      }
    }

    if (matchesToCreate.length > 0) {
      const { error: matchError } = await supabase.from("tournament_matches").insert(matchesToCreate);
      if (matchError) {
        console.error("Match creation error:", matchError);
        throw new APIError(ErrCode.Internal, "Maçlar oluşturulurken bir hata oluştu");
      }
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
        player1:tournament_participants!player1_id(username, avatar),
        player2:tournament_participants!player2_id(username, avatar),
        player3:tournament_participants!player3_id(username, avatar),
        player4:tournament_participants!player4_id(username, avatar)
      `)
      .eq("tournament_id", tournament.id)
      .order("round", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getTournamentMatches error details:", error);
      throw new APIError(ErrCode.Internal, `Maçlar getirilemedi: ${error.message}`);
    }

    return {
      matches: matches.map(m => ({
        ...m,
        username1: m.player1?.username,
        username2: m.player2?.username,
        username3: m.player3?.username,
        username4: m.player4?.username,
        avatar1: m.player1?.avatar,
        avatar2: m.player2?.avatar,
        avatar3: m.player3?.avatar,
        avatar4: m.player4?.avatar
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
      .order("joined_at", { ascending: true });

    if (error) throw new APIError(ErrCode.Internal, "Puan durumu getirilemedi");

    return { participants: standings as Participant[] };
  }
);


/**
 * Turnuvayı bir sonraki raunda veya aşamaya taşır
 */
export const advanceTournament = api(
  { expose: true, method: "POST", path: "/tournament/:slug/advance" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { data: tournament } = await supabase.from("tournaments").select("*").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");
    
    // Admin yetki kontrolü
    const { data: userData } = await supabase.from("users").select("id").eq("clerk_id", adminUserId).single();
    if (!userData || tournament.admin_user_id !== userData.id) {
      throw new APIError(ErrCode.PermissionDenied, "Yetkiniz yok");
    }

    if (tournament.format === "league_knockout") {
      const currentLeagueRound = tournament.current_league_round || 0;
      
      // Eğer hala lig aşamasındaysak
      if (currentLeagueRound > 0 && currentLeagueRound < (tournament.league_match_count || 0)) {
        // Sonraki tura geç
        const { error } = await supabase
          .from("tournaments")
          .update({ current_league_round: currentLeagueRound + 1 })
          .eq("id", tournament.id);

        if (error) throw new APIError(ErrCode.Internal, "Tur atlatılamadı");
        return { success: true };
      } else if (currentLeagueRound > 0) {
        // Lig bitti, eleme aşamasına (Bracket) geç
        return await advanceToBracketLogic(tournament);
      } else {
        // Eleme (Bracket) aşamasındayız, bir sonraki raundu oluştur
        return await advanceBracketRoundLogic(tournament);
      }
    }

    return { success: true };
  }
);

/**
 * Eleme aşamasında bir sonraki raundu oluşturur
 */
async function advanceBracketRoundLogic(tournament: any): Promise<{ success: boolean }> {
    // Mevcut en yüksek raundu bul
    const { data: matches } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournament.id)
        .eq("phase", "bracket")
        .order("round", { ascending: false });

    if (!matches || matches.length === 0) return { success: false };

    const currentRound = matches[0].round;
    const currentRoundMatches = matches.filter(m => m.round === currentRound);

    // Tüm maçlar bitti mi?
    const unfinished = currentRoundMatches.filter(m => m.status !== "finished");
    if (unfinished.length > 0) {
        // Eğer maçlar bitmemişse ama skorları varsa otomatik bitirebiliriz veya hata verebiliriz
        // Şimdilik hata verelim (veya skor varsa bitmiş sayalım)
    }

    // Kazananları belirle
    const winners = currentRoundMatches.map(m => {
        if (!m.scores || Object.keys(m.scores).length === 0) return null;
        const winnerId = Object.keys(m.scores).sort((a, b) => Number(m.scores[b]) - Number(m.scores[a]))[0];
        return winnerId;
    }).filter(Boolean);

    if (winners.length < 2) {
        // Turnuva bitti demektir (Sadece 1 kazanan kaldı)
        await supabase.from("tournaments").update({ status: "completed" }).eq("id", tournament.id);
        return { success: true };
    }

    // Bir sonraki tur maçlarını oluştur
    const nextRoundMatches = [];
    const ppm = tournament.players_per_match || 2;

    for (let i = 0; i < winners.length; i += ppm) {
        const matchPlayers = winners.slice(i, i + ppm);
        if (matchPlayers.length >= 2) {
            nextRoundMatches.push({
                tournament_id: tournament.id,
                phase: "bracket",
                round: currentRound + 1,
                player1_id: matchPlayers[0] || null,
                player2_id: matchPlayers[1] || null,
                player3_id: matchPlayers[2] || null,
                player4_id: matchPlayers[3] || null,
                status: "upcoming"
            });
        }
    }

    if (nextRoundMatches.length > 0) {
        // Mevcut turun maçlarını bitmiş olarak işaretle
        await supabase
            .from("tournament_matches")
            .update({ status: "finished" })
            .eq("tournament_id", tournament.id)
            .eq("phase", "bracket")
            .eq("round", currentRound);

        await supabase.from("tournament_matches").insert(nextRoundMatches);
    } else if (winners.length === 1) {
        // Şampiyon belli oldu
        await supabase
            .from("tournament_matches")
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
    const { data: participants } = await supabase.from("tournament_participants").select("*").eq("tournament_id", tournament.id);
    
    // Maçları getir (puanı girilmiş olan her şeyi dahil et)
    const { data: matches } = await supabase
      .from("tournament_matches")
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
        await supabase.from("tournament_matches").insert(bracketMatches);
        // Turnuvayı güncelle: Lig bitti, Bracket başladı (round 0)
        await supabase.from("tournaments").update({ current_league_round: 0 }).eq("id", tournament.id);
    }
    
    return { success: true };
}

/**
 * Lig aşamasını bitirir ve Bracket (Eleme) aşamasını başlatır (API Export)
 */
export const advanceToBracket = api(
  { expose: true, method: "POST", path: "/tournament/:slug/advance-to-bracket" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { data: tournament } = await supabase.from("tournaments").select("*").eq("slug", slug).single();
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
    const { data: tournament } = await supabase.from("tournaments").select("*").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");

    // Mevcut turu ve fazı belirle
    let currentRound = tournament.current_league_round;
    let currentPhase = "league";

    if (currentRound === 0) {
      // Bracket aşamasındaysak en güncel bracket roundunu bul
      const { data: lastMatch } = await supabase
        .from("tournament_matches")
        .select("round")
        .eq("tournament_id", tournament.id)
        .eq("phase", "bracket")
        .order("round", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastMatch) {
        currentRound = lastMatch.round;
        currentPhase = "bracket";
      }
    }

    const { data: matches } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournament.id)
      .eq("phase", currentPhase)
      .eq("round", currentRound)
      .neq("status", "finished"); // Zaten bitmiş olanlara dokunma

    if (!matches || matches.length === 0) return { success: true };

    const matchUpdates: any[] = [];

    for (const match of matches) {
      const pIds = [match.player1_id, match.player2_id, match.player3_id, match.player4_id].filter(Boolean);
      const scores: { [id: string]: number } = {};
      
      // Rastgele skorlar üret
      pIds.forEach((pid) => {
        scores[pid!] = Math.floor(Math.random() * 11); // 0-10 arası
      });

      matchUpdates.push({
        id: match.id,
        tournament_id: tournament.id,
        phase: match.phase, // Zorunlu alanları ekleyelim
        round: match.round, // Zorunlu alanları ekleyelim
        scores: scores,
        status: "playing",
        updated_at: new Date().toISOString()
      });
    }

    if (matchUpdates.length > 0) {
      const { error: upsertError } = await supabase.from("tournament_matches").upsert(matchUpdates);
      if (upsertError) {
        console.error("Upsert Error:", upsertError);
        throw new APIError(ErrCode.Internal, `Skorlar atanamadı: ${upsertError.message}`);
      }
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
    // Turnuvayı getir
    const { data: tournament } = await supabase.from("tournaments").select("*").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");

    // 1. TÜM maçları tamamen SİL (hem lig hem bracket)
    // Bu sayede turnuva en baştan tertemiz bir şekilde başlatılabilir
    const { error: deleteError } = await supabase
      .from("tournament_matches")
      .delete()
      .eq("tournament_id", tournament.id);

    if (deleteError) throw new APIError(ErrCode.Internal, "Maçlar silinemedi");

    // 2. Turnuvayı başlangıç durumuna çek
    await supabase
      .from("tournaments")
      .update({ 
        current_league_round: 1, 
        status: "upcoming", // Tekrar "Turnuvayı Başlat" butonunun çıkması için
        start_at: null 
      })
      .eq("id", tournament.id);

    return { success: true };
  }
);

/**
 * Mevcut raundu sıfırlar (Sadece o raundun skorlarını temizler)
 */
export const resetCurrentRound = api(
  { expose: true, method: "POST", path: "/tournament/:slug/reset-round" },
  async ({ slug, adminUserId }: { slug: string; adminUserId: string }): Promise<{ success: boolean }> => {
    const { data: tournament } = await supabase.from("tournaments").select("*").eq("slug", slug).single();
    if (!tournament) throw new APIError(ErrCode.NotFound, "Turnuva bulunamadı");

    // Mevcut raundu bul
    let round = tournament.current_league_round;
    let phase = "league";

    if (round === 0) {
      // Bracket aşamasındayız, son oluşan bracket raundunu bul (en büyük round numarası)
      const { data: lastMatch } = await supabase
        .from("tournament_matches")
        .select("round")
        .eq("tournament_id", tournament.id)
        .eq("phase", "bracket")
        .order("round", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastMatch) {
        round = lastMatch.round;
        phase = "bracket";
      }
    }

    if (round === 0 && phase === "league") {
       throw new APIError(ErrCode.InvalidArgument, "Sıfırlanacak aktif bir raund bulunamadı");
    }

    // O raunddaki maçların skorlarını ve durumunu sıfırla
    const { error } = await supabase
      .from("tournament_matches")
      .update({
        scores: {},
        status: "upcoming",
        winner_id: null
      })
      .eq("tournament_id", tournament.id)
      .eq("phase", phase)
      .eq("round", round);

    if (error) throw new APIError(ErrCode.Internal, "Raund sıfırlanamadı");

    return { success: true };
  }
);
