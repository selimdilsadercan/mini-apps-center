"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  Users,
  Trophy,
  Sword,
  Gear,
  Pencil,
  Trash,
  Check,
  MagicWand,
  UserPlus,
  CaretDown,
  Crown,
  MagnifyingGlass,
  ArrowsLeftRight,
  CircleNotch,
} from "@phosphor-icons/react";
import { User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Client, { Local } from "@/lib/client";
import PlayerSetupModal from "@/components/apps/tournament/PlayerSetupModal";
import ScoreUpdateModal from "@/components/apps/tournament/ScoreUpdateModal";
import { toast } from "react-hot-toast";

const client = new Client(Local);

function TournamentDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: userLoaded } = useUser();
  const slug = searchParams.get("slug");

  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"standings" | "matches">(
    "standings",
  );
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  // States that were missing
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlayerMenuOpen, setIsPlayerMenuOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [viewedStep, setViewedStep] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { leagueRounds, bracketRounds, totalSteps } = useMemo(() => {
    if (!tournament)
      return { leagueRounds: 0, bracketRounds: 0, totalSteps: 1 };
    const lr = tournament.league_match_count || 0;
    let br = 0;
    if (tournament.advance_count > 1) {
      br = Math.ceil(
        Math.log(tournament.advance_count) /
          Math.log(tournament.players_per_match || 2),
      );
    }
    return { leagueRounds: lr, bracketRounds: br, totalSteps: lr + br + 1 };
  }, [tournament]);

  const currentStep = useMemo(() => {
    if (!tournament) return 1;
    const activeRound = tournament.current_league_round || 0;

    if (activeRound === 0 || tournament.phase === "bracket") {
      const unfinishedBracketMatch = matches
        .filter((m) => m.phase === "bracket" && m.status !== "finished")
        .sort((a, b) => a.round - b.round)[0];

      if (unfinishedBracketMatch)
        return leagueRounds + unfinishedBracketMatch.round;

      const lastBracketMatch = matches
        .filter((m) => m.phase === "bracket")
        .sort((a, b) => b.round - a.round)[0];

      return leagueRounds + (lastBracketMatch?.round || 1);
    }

    return activeRound;
  }, [tournament, matches, leagueRounds]);

  const isFinalStep = currentStep === totalSteps - 1;

  useEffect(() => {
    if (tournament && currentStep > 1 && viewedStep === null) {
      setViewedStep(currentStep);
    }
  }, [currentStep, tournament, viewedStep]);

  useEffect(() => {
    if (userLoaded && slug) {
      fetchDetailData();
    } else if (userLoaded && !slug) {
      router.push("/apps/tournament-editor");
    }
  }, [userLoaded, slug]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const tData = await client.tournament.getTournamentDetails(
        slug as string,
        { userId: user?.id },
      );
      setTournament(tData);
      const mData = await client.tournament.getTournamentMatches(
        slug as string,
      );
      setMatches(mData.matches);
      const sData = await client.tournament.getStandings(slug as string);
      setStandings(sData.participants);

      if (viewedStep === null) {
        setViewedStep(tData.current_league_round || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatedStandings = useMemo(() => {
    const currentStandings = standings || [];
    const currentMatches = matches || [];

    const stats = currentStandings.map((p: any) => ({
      ...p,
      points: 0,
      wins: 0,
      losses: 0,
      average: 0,
    }));

    const statsMap = new Map(stats.map((s: any) => [s.id, s]));

    currentMatches
      .filter((m: any) => m.scores && Object.keys(m.scores).length > 0)
      .forEach((m: any) => {
        const pIds = [
          m.player1_id,
          m.player2_id,
          m.player3_id,
          m.player4_id,
        ].filter(Boolean);
        const ppm = tournament?.players_per_match || 2;

        pIds.forEach((pid: any, idx: number) => {
          const pStat = statsMap.get(pid);
          if (pStat) {
            const score = m.scores?.[pid] ?? (m[`score${idx + 1}`] || 0);
            pStat.points += score;
            pStat.average += score;

            if (ppm === 2) {
              const opponentId = pIds.find((id) => id !== pid);
              const opponentScore = opponentId
                ? (m.scores?.[opponentId] ??
                  (m[`score${pIds.indexOf(opponentId) + 1}`] || 0))
                : 0;
              if (score > opponentScore) pStat.wins += 1;
              else if (score < opponentScore) pStat.losses += 1;
            } else {
              if (score === 10) pStat.wins += 1;
              else pStat.losses += 1;
            }
          }
        });
      });

    return stats.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.username.localeCompare(b.username);
    });
  }, [standings, matches, tournament?.players_per_match]);

  const handleJoin = async (data: { username: string; avatar: string }) => {
    if (!slug) return;

    setIsJoining(true);
    try {
      const manualPlayerId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const res = await client.tournament.joinTournament({
        slug,
        userId: manualPlayerId,
        username: data.username,
        avatar: data.avatar,
      });

      if (res.success) {
        toast.success("Oyuncu başarıyla eklendi!");
        setIsSetupOpen(false);
        fetchDetailData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Katılım sırasında bir hata oluştu.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <CircleNotch size={48} className="animate-spin text-blue-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-12">
    <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/apps/tournament-editor")}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <ArrowLeft size={24} weight="bold" />
            </button>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase">
                {tournament?.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Users size={14} weight="bold" />{" "}
                  {tournament?.participants_count} Katılımcı
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {tournament?.status === "upcoming" && (
                <button
                  onClick={async () => {
                    if (!slug || !user?.id) return;
                    if (
                      !confirm(
                        "Turnuvayı başlatmak istediğinize emin misiniz? Maçlar oluşturulacak ve artık yeni oyuncu eklenemeyecek.",
                      )
                    )
                      return;

                    setIsJoining(true);
                    try {
                      const res = await client.tournament.startTournament(
                        slug,
                        { adminUserId: user.id },
                      );
                      if (res.success) {
                        toast.success("Turnuva Başladı! Maçlar oluşturuldu.");
                        fetchDetailData();
                      }
                    } catch (err: any) {
                      toast.error(
                        err.message || "Turnuva başlatılırken hata oluştu",
                      );
                    } finally {
                      setIsJoining(false);
                    }
                  }}
                  disabled={isJoining || tournament?.participants_count < 2}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isJoining ? (
                    <CircleNotch size={18} className="animate-spin" />
                  ) : (
                    <Sword size={18} weight="bold" />
                  )}
                  BAŞLAT
                </button>
              )}
              <div className="relative">
                  <button
                    onClick={() => setIsPlayerMenuOpen(!isPlayerMenuOpen)}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <UserPlus size={18} weight="bold" />
                    OYUNCU İŞLEMLERİ
                    <CaretDown
                      size={14}
                      weight="bold"
                      className={`transition-transform duration-300 ${isPlayerMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isPlayerMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsPlayerMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-64 bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => {
                                setEditingPlayer(null);
                                setIsSetupOpen(true);
                                setIsPlayerMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-blue-500/10 text-blue-400 transition-colors group"
                            >
                              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <UserPlus size={20} weight="bold" />
                              </div>
                              <div className="flex flex-col items-start text-left">
                                <span className="text-xs font-black uppercase tracking-widest text-white/90">
                                  Manuel Ekle
                                </span>
                                <span className="text-[9px] font-medium text-slate-500">
                                  Tek tek oyuncu girişi
                                </span>
                              </div>
                            </button>

                            <label className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-emerald-500/10 text-emerald-400 transition-colors group cursor-pointer">
                              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                <Sword size={20} weight="bold" />
                              </div>
                              <div className="flex flex-col items-start text-left">
                                <span className="text-xs font-black uppercase tracking-widest text-white/90">
                                  CSV ile Ekle
                                </span>
                                <span className="text-[9px] font-medium text-slate-500">
                                  Dosyadan toplu yükle
                                </span>
                              </div>
                              <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !slug) return;
                                  setIsPlayerMenuOpen(false);
                                  setIsJoining(true);

                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const text = event.target?.result as string;
                                    const lines = text.split(/\r?\n/);
                                    const players: {
                                      name: string;
                                      gender?: string;
                                      avoidList?: string[];
                                    }[] = [];

                                    for (let i = 1; i < lines.length; i++) {
                                      const line = lines[i].trim();
                                      if (!line) continue;

                                      const parts = line.includes(";")
                                        ? line.split(";")
                                        : line.split(",");
                                      const name = parts[1]?.trim();
                                      const gender = parts[2]
                                        ?.trim()
                                        .toLowerCase();
                                      const avoidStr = parts[3]?.trim();
                                      const avoidList = avoidStr
                                        ? avoidStr
                                            .split(";")
                                            .map((s) => s.trim())
                                        : [];

                                      if (name)
                                        players.push({
                                          name,
                                          gender,
                                          avoidList,
                                        });
                                    }

                                    if (players.length === 0) {
                                      toast.error(
                                        "Dosyada geçerli oyuncu bulunamadı.",
                                      );
                                      setIsJoining(false);
                                      return;
                                    }

                                    let successCount = 0;
                                    for (const p of players) {
                                      try {
                                        const isFemale =
                                          p.gender?.startsWith("k") ||
                                          p.gender?.startsWith("f");
                                        let avatarUrl = `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`;

                                        if (isFemale) {
                                          avatarUrl +=
                                            "&backgroundColor=ffd5dc&topType=LongHair,Bob,Curly,Curvy";
                                        } else {
                                          avatarUrl +=
                                            "&backgroundColor=b6e3f4&topType=ShortHairFlat,ShortHairRound,Sides,TheCaesar";
                                        }

                                        const manualPlayerId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                                        await client.tournament.joinTournament({
                                          slug,
                                          userId: manualPlayerId,
                                          username: p.name,
                                          avatar: avatarUrl,
                                          avoidList: p.avoidList,
                                        });
                                        successCount++;
                                      } catch (err) {
                                        console.error(`Hata: ${p.name}`, err);
                                      }
                                    }

                                    toast.success(
                                      `${successCount} oyuncu başarıyla eklendi!`,
                                    );
                                    fetchDetailData();
                                    setIsJoining(false);
                                  };
                                  reader.readAsText(file);
                                }}
                              />
                            </label>

                            <button
                              onClick={async () => {
                                if (!slug) return;
                                setIsPlayerMenuOpen(false);
                                setIsJoining(true);
                                try {
                                  await client.tournament.fillWithMockPlayers(
                                    slug,
                                  );
                                  toast.success("Mock oyuncular eklendi!");
                                  fetchDetailData();
                                } catch (err) {
                                  toast.error("Hata oluştu");
                                } finally {
                                  setIsJoining(false);
                                }
                              }}
                              className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/5 text-slate-300 transition-colors group"
                            >
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <MagicWand size={20} weight="bold" />
                              </div>
                              <div className="flex flex-col items-start text-left">
                                <span className="text-xs font-black uppercase tracking-widest text-white/90">
                                  Otomatik Doldur
                                </span>
                                <span className="text-[9px] font-medium text-slate-500">
                                  Boş kontenjanları doldur
                                </span>
                              </div>
                            </button>

                            <div className="h-px bg-white/5 mx-2 my-1" />

                            <button
                              onClick={async () => {
                                if (!slug || !user?.id) return;
                                if (
                                  !confirm(
                                    "TÜM OYUNCULARI silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
                                  )
                                )
                                  return;
                                setIsPlayerMenuOpen(false);
                                setIsJoining(true);
                                try {
                                  await client.tournament.clearParticipants(
                                    slug,
                                    { adminUserId: user.id },
                                  );
                                  toast.success("Tüm oyuncular temizlendi!");
                                  fetchDetailData();
                                } catch (err) {
                                  toast.error("Temizleme hatası");
                                } finally {
                                  setIsJoining(false);
                                }
                              }}
                              className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-colors group"
                            >
                              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                <Trash size={20} weight="bold" />
                              </div>
                              <div className="flex flex-col items-start text-left">
                                <span className="text-xs font-black uppercase tracking-widest">
                                  Tümünü Sil
                                </span>
                                <span className="text-[9px] font-medium opacity-50">
                                  Oyuncu listesini boşalt
                                </span>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-3 rounded-2xl transition-all border ${isMenuOpen ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}
              >
                <Gear size={22} weight={isMenuOpen ? "fill" : "bold"} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-[#1a1a20] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-2 space-y-1">
                        {tournament?.status === "active" && (
                          <>
                            <button
                              onClick={async () => {
                                if (!slug || !user?.id) return;
                                if (
                                  !confirm(
                                    "Sadece BU RAUNDUN skorları sıfırlanacak. Emin misiniz?",
                                  )
                                )
                                  return;
                                setIsMenuOpen(false);
                                setIsJoining(true);
                                try {
                                  await client.tournament.resetCurrentRound(
                                    slug,
                                    { adminUserId: user.id },
                                  );
                                  toast.success("Raund skorları sıfırlandı!");
                                  fetchDetailData();
                                } catch (err) {
                                  toast.error("Raund sıfırlama hatası");
                                } finally {
                                  setIsJoining(false);
                                }
                              }}
                              className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-blue-500/10 text-blue-400 transition-colors group"
                            >
                              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <CircleNotch size={20} weight="bold" />
                              </div>
                              <div className="flex flex-col items-start text-left">
                                <span className="text-xs font-black uppercase tracking-widest">
                                  Raundu Sıfırla
                                </span>
                                <span className="text-[9px] font-medium opacity-50">
                                  Sadece mevcut maçları temizler
                                </span>
                              </div>
                            </button>

                            <button
                              onClick={async () => {
                                if (!slug || !user?.id) return;
                                if (
                                  !confirm(
                                    "Tüm maç skorları ve puanlar sıfırlanacak. Bu işlem geri alınamaz. Emin misiniz?",
                                  )
                                )
                                  return;
                                setIsMenuOpen(false);
                                setIsJoining(true);
                                try {
                                  await client.tournament.resetTournament(
                                    slug,
                                    { adminUserId: user.id },
                                  );
                                  toast.success("Turnuva sıfırlandı!");
                                  setViewedStep(1);
                                  fetchDetailData();
                                } catch (err) {
                                  toast.error("Sıfırlama hatası");
                                } finally {
                                  setIsJoining(false);
                                }
                              }}
                              className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-orange-500/10 text-orange-500 transition-colors group"
                            >
                              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                <Trash size={20} weight="bold" />
                              </div>
                              <div className="flex flex-col items-start text-left">
                                <span className="text-xs font-black uppercase tracking-widest">
                                  Turnuvayı Sıfırla
                                </span>
                                <span className="text-[9px] font-medium opacity-50">
                                  Tüm turları ve puanları temizler
                                </span>
                              </div>
                            </button>
                          </>
                        )}

                        <button
                          onClick={async () => {
                            if (!slug || !user?.id) return;
                            if (
                              confirm(
                                "Bu turnuvayı ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
                              )
                            ) {
                              try {
                                await client.tournament.deleteTournament(slug, {
                                  adminUserId: user.id,
                                });
                                toast.success("Turnuva başarıyla silindi");
                                router.push("/apps/tournament-editor");
                              } catch (err) {
                                toast.error(
                                  "Silme işlemi sırasında bir hata oluştu",
                                );
                              }
                            }
                          }}
                          className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                            <Trash size={20} weight="bold" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-black uppercase tracking-widest">
                              Turnuvayı Sil
                            </span>
                            <span className="text-[8px] text-red-500/50 uppercase font-bold tracking-tight">
                              Tüm veriler temizlenir
                            </span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Maç Yapısı
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white">
                {tournament?.players_per_match} KİŞİLİK
              </span>
              <Users size={24} className="text-blue-500/50" weight="duotone" />
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Kapasite
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white">
                {tournament?.participants_count}{" "}
                <span className="text-slate-700 text-sm">
                  / {tournament?.capacity}
                </span>
              </span>
              <Users size={24} className="text-blue-500/50" weight="duotone" />
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Format
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white">
                {tournament?.format === "league_knockout"
                  ? "LİG + ELEME"
                  : "ELEME"}
              </span>
              <Sword
                size={24}
                className="text-purple-500/50"
                weight="duotone"
              />
            </div>
          </div>
          {tournament?.format === "league_knockout" && (
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Lig Maçı
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">
                  {tournament?.league_match_count} MAÇ
                </span>
                <Trophy
                  size={24}
                  className="text-yellow-500/50"
                  weight="duotone"
                />
              </div>
            </div>
          )}

          {tournament?.status !== "upcoming" && (
            <div className="bg-white/[0.02] border border-white/5 p-6 pb-16 rounded-[2.5rem] col-span-2 md:col-span-4">
              <div className="flex items-center justify-between mb-8 px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Turnuva İlerlemesi
                </span>
              </div>

              <div className="relative flex items-center justify-between px-4">
                <div className="absolute left-10 right-10 h-0.5 bg-white/5 top-1/2 -translate-y-1/2 z-0" />

                {Array.from({ length: totalSteps }).map((_, i) => {
                  const stepNum = i + 1;
                  const isResultsStep = stepNum === totalSteps;
                  const isLeague = stepNum <= leagueRounds;
                  const isCompleted =
                    stepNum < currentStep || tournament.status === "completed";
                  const isActive =
                    stepNum === currentStep &&
                    tournament.status !== "completed";

                  let label = "";
                  if (isResultsStep) {
                    label = "SONUÇLAR";
                  } else if (isLeague) {
                    label = `${stepNum}. TUR`;
                  } else {
                    const bracketRound = stepNum - leagueRounds;
                    const roundsLeft = bracketRounds - bracketRound;
                    label =
                      roundsLeft === 0
                        ? "FİNAL"
                        : roundsLeft === 1
                          ? "YARI FİNAL"
                          : `${bracketRound}. ELEME`;
                  }

                  return (
                    <div
                      key={i}
                      className="relative z-10 flex flex-col items-center gap-3 cursor-pointer"
                      onClick={() => setViewedStep(stepNum)}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                          viewedStep === stepNum
                            ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/40 scale-110"
                            : isCompleted
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500"
                              : isActive
                                ? "bg-blue-600/20 border-blue-400/50 text-blue-400 shadow-lg shadow-blue-500/20"
                                : "bg-[#1a1a20] border-white/10 text-slate-600 hover:border-white/30"
                        }`}
                      >
                        {isCompleted && viewedStep !== stepNum ? (
                          <Check size={20} weight="bold" />
                        ) : isResultsStep ? (
                          <Trophy size={20} weight="bold" />
                        ) : (
                          <span className="text-xs font-black">{stepNum}</span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest absolute -bottom-8 whitespace-nowrap transition-colors ${
                          viewedStep === stepNum
                            ? "text-white"
                            : isActive
                              ? "text-blue-400/70"
                              : isCompleted
                                ? "text-emerald-500/50"
                                : "text-slate-600"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2 bg-[#121216] p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab("standings")}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "standings" ? "bg-blue-600 text-white shadow-xl" : "text-slate-500 hover:text-white"}`}
            >
              {tournament?.status === "active" &&
              matches.some((m) => m.phase === "bracket")
                ? "Eleme Ağacı"
                : "Puan Durumu"}
            </button>
            <button
              onClick={() => setActiveTab("matches")}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "matches" ? "bg-blue-600 text-white shadow-xl" : "text-slate-500 hover:text-white"}`}
            >
              Aktif Maçlar
            </button>
          </div>

          <div className="flex items-center gap-3">
            {tournament?.status === "active" && activeTab === "matches" && (
              <button
                onClick={async () => {
                  if (!slug || !user?.id) return;
                  if (
                    !confirm(
                      "Bu turdaki TÜM maçlara otomatik skor atanacak. Emin misiniz?",
                    )
                  )
                    return;
                  setIsJoining(true);
                  try {
                    await client.tournament.autoScoreRound(slug, {
                      adminUserId: user.id,
                    });
                    toast.success("Tur otomatik skorlandı!");
                    fetchDetailData();
                  } catch (err) {
                    toast.error("Skorlama hatası");
                  } finally {
                    setIsJoining(false);
                  }
                }}
                disabled={isJoining}
                className="px-6 py-2.5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group shadow-xl shadow-orange-500/5"
              >
                <MagicWand
                  size={16}
                  weight="bold"
                  className={isJoining ? "animate-spin" : ""}
                />
                OTOMATİK SKORLA
              </button>
            )}

            {tournament?.status === "active" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/apps/tournament-editor/tournament/matchmaking?slug=${slug}`,
                    )
                  }
                  className="px-6 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl"
                >
                  <ArrowsLeftRight size={16} weight="bold" />
                  MASALARI DÜZENLE
                </button>

                <button
                  onClick={async () => {
                    if (!slug || !user) return;
                    const confirmMsg = isFinalStep
                      ? "Turnuvayı bitirmek istediğinize emin misiniz?"
                      : "Bu raundu bitirip bir sonraki tura geçmek istediğinize emin misiniz?";

                    if (!confirm(confirmMsg)) return;
                    setIsJoining(true);
                    try {
                      const res = await client.tournament.advanceTournament(
                        slug,
                        { adminUserId: user.id },
                      );
                      if (res.success) {
                        toast.success(
                          isFinalStep
                            ? "Turnuva başarıyla tamamlandı!"
                            : "Raund tamamlandı, yeni tura geçildi!",
                        );
                        setViewedStep((prev) => (prev || 0) + 1);
                        fetchDetailData();
                      }
                    } catch (err: any) {
                      toast.error(
                        err.message || "Tur atlatılırken hata oluştu",
                      );
                    } finally {
                      setIsJoining(false);
                    }
                  }}
                  disabled={isJoining}
                  className={`px-8 py-2.5 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95 ${
                    isFinalStep
                      ? "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                  }`}
                >
                  {isJoining ? (
                    <CircleNotch size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} weight="bold" />
                  )}
                  {isFinalStep ? "TURNUVAYI BİTİR" : "RAUNDU BİTİR"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {activeTab === "standings" ? (
              <motion.div
                key="standings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {matches.some((m) => m.phase === "bracket") ? (
                  <div className="overflow-x-auto pb-12 scrollbar-hide">
                    <div className="flex gap-20 min-w-max px-8">
                      {(() => {
                        const bracketMatches = matches.filter(
                          (m) => m.phase === "bracket",
                        );
                        const rounds = [
                          ...new Set(bracketMatches.map((m) => m.round)),
                        ].sort((a, b) => a - b);

                        const displayRounds = [...rounds];
                        const isSemiFinalOnly =
                          rounds.length === 1 && bracketMatches.length > 1;
                        if (isSemiFinalOnly) displayRounds.push(rounds[0] + 1);

                        return displayRounds.map((roundNum, rIdx) => {
                          const roundMatches = bracketMatches.filter(
                            (m) => m.round === roundNum,
                          );
                          const isPlaceholder = roundMatches.length === 0;
                          const isFinal = rIdx === displayRounds.length - 1;

                          return (
                            <div
                              key={roundNum}
                              className="flex flex-col gap-8 w-64"
                            >
                              <div className="flex items-center gap-3 px-4 mb-6">
                                <Trophy
                                  size={18}
                                  className={
                                    isFinal
                                      ? "text-yellow-500"
                                      : "text-blue-500/50"
                                  }
                                  weight="bold"
                                />
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
                                  {isFinal
                                    ? "FİNAL"
                                    : displayRounds.length - rIdx === 2
                                      ? "YARI FİNAL"
                                      : `${roundNum}. ELEME`}
                                </span>
                              </div>

                              <div className="flex flex-col justify-around flex-1 gap-12">
                                {isPlaceholder ? (
                                  <div className="bg-[#121216]/80 border border-white/10 border-dashed rounded-[2rem] overflow-hidden opacity-90 shadow-2xl">
                                    {Array.from({
                                      length:
                                        tournament?.players_per_match || 2,
                                    }).map((_, slotIdx) => (
                                      <div
                                        key={slotIdx}
                                        className="flex items-center justify-between p-4 border-b border-white/[0.03] last:border-0"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border bg-white/5 border-white/5 border-dashed">
                                            <UserIcon
                                              size={14}
                                              className="text-slate-600"
                                            />
                                          </div>
                                          <span className="text-xs font-bold truncate text-slate-500 italic">
                                            Bekleniyor...
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  roundMatches.map((m, mIdx) => (
                                    <div
                                      key={m.id}
                                      className="relative group flex items-center"
                                    >
                                      <div className="bg-[#121216] border border-white/5 rounded-[2rem] overflow-hidden group-hover:border-blue-500/30 transition-all shadow-2xl w-full z-10">
                                        {Array.from({
                                          length:
                                            tournament?.players_per_match || 2,
                                        }).map((_, slotIdx) => {
                                          const p = [
                                            {
                                              id: m.player1_id,
                                              username: (m as any).username1,
                                              avatar: (m as any).avatar1,
                                              score:
                                                (m.scores &&
                                                  m.scores[m.player1_id]) ||
                                                0,
                                            },
                                            {
                                              id: m.player2_id,
                                              username: (m as any).username2,
                                              avatar: (m as any).avatar2,
                                              score:
                                                (m.scores &&
                                                  m.scores[m.player2_id]) ||
                                                0,
                                            },
                                            {
                                              id: m.player3_id,
                                              username: (m as any).username3,
                                              avatar: (m as any).avatar3,
                                              score:
                                                (m.scores &&
                                                  m.scores[m.player3_id]) ||
                                                0,
                                            },
                                            {
                                              id: m.player4_id,
                                              username: (m as any).username4,
                                              avatar: (m as any).avatar4,
                                              score:
                                                (m.scores &&
                                                  m.scores[m.player4_id]) ||
                                                0,
                                            },
                                          ][slotIdx];

                                          const hasScores =
                                            m.scores &&
                                            Object.keys(m.scores).length > 0;
                                          const isWinner =
                                            hasScores &&
                                            p?.id &&
                                            p.score ===
                                              Math.max(
                                                ...Object.values(
                                                  m.scores || {},
                                                ).map((s: any) => Number(s)),
                                              );

                                          return (
                                            <div
                                              key={slotIdx}
                                              className={`flex items-center justify-between p-4 border-b border-white/[0.03] last:border-0 ${isWinner ? "bg-blue-500/5" : ""}`}
                                            >
                                              <div className="flex items-center gap-4 min-w-0">
                                                <div
                                                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border ${p?.id ? "bg-slate-800 border-white/10" : "bg-transparent"}`}
                                                >
                                                  {p?.avatar ? (
                                                    <img
                                                      src={p.avatar}
                                                      className="w-full h-full object-contain"
                                                    />
                                                  ) : p?.id ? (
                                                    <UserIcon
                                                      size={14}
                                                      className="text-slate-600"
                                                    />
                                                  ) : null}
                                                </div>
                                                <span
                                                  className={`text-xs font-bold truncate ${isWinner ? "text-blue-400" : p?.id ? "text-slate-200" : "text-slate-800"}`}
                                                >
                                                  {p?.username ||
                                                    "Bekleniyor..."}
                                                </span>
                                              </div>
                                              {p?.id && (
                                                <span className="text-[11px] font-black text-slate-600 ml-2">
                                                  {p.score}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {!isFinal && (
                                        <div className="absolute -right-20 top-1/2 w-20 pointer-events-none z-0">
                                          <svg className="overflow-visible w-full h-px">
                                            <path
                                              d="M 0 0 L 80 0"
                                              fill="none"
                                              stroke="rgba(255,255,255,0.25)"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="relative group mb-6">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                        <MagnifyingGlass size={20} weight="bold" />
                      </div>
                      <input
                        type="text"
                        placeholder="Oyuncu ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#121216] border border-white/5 rounded-3xl py-5 pl-16 pr-8 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all shadow-xl"
                      />
                    </div>

                    <div className="bg-[#121216] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl shadow-black/40">
                      {calculatedStandings.filter((p: any) =>
                        p.username
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      ).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                            <Users
                              size={32}
                              weight="bold"
                              className="text-slate-600"
                            />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {searchQuery
                              ? "Sonuç Bulunamadı"
                              : "Henüz Oyuncu Yok"}
                          </h3>
                          <p className="text-slate-500 text-sm max-w-xs mx-auto">
                            {searchQuery
                              ? `"${searchQuery}" aramasına uygun oyuncu bulunamadı.`
                              : "Turnuva henüz başlamadı."}
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr>
                              <th className="px-8 py-5 w-20 text-center">#</th>
                              <th className="px-8 py-5">Oyuncu</th>
                              {tournament?.status === "upcoming" ? (
                                <th className="px-8 py-5 text-center">
                                  Katılım (Burada mı?)
                                </th>
                              ) : (
                                <>
                                  <th className="px-4 py-5 text-center">G</th>
                                  <th className="px-4 py-5 text-center">M</th>
                                  <th className="px-8 py-5 text-center">
                                    Puan
                                  </th>
                                </>
                              )}
                              <th className="px-4 py-5"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {calculatedStandings
                              .filter((p: any) =>
                                p.username
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()),
                              )
                              .map((p: any, idx: number) => (
                                <tr
                                  key={p.id}
                                  className={`group hover:bg-white/[0.02] transition-all ${p.is_present && tournament?.status === "upcoming" ? "bg-emerald-500/[0.03]" : ""}`}
                                >
                                  <td
                                    className={`px-8 py-6 text-center font-black text-lg ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : "text-slate-600"}`}
                                  >
                                    {idx + 1}
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {p.avatar ? (
                                          <img
                                            src={p.avatar}
                                            alt={p.username}
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <UserIcon className="w-5 h-5 text-slate-600" />
                                        )}
                                      </div>
                                      <span className="font-bold text-slate-200">
                                        {p.username}
                                      </span>
                                    </div>
                                  </td>
                                  {tournament?.status === "upcoming" ? (
                                    <td className="px-8 py-6 text-center">
                                      <button
                                        onClick={async () => {
                                          try {
                                            await client.tournament.toggleCheckIn(
                                              p.id,
                                            );
                                            fetchDetailData();
                                          } catch (err) {
                                            toast.error("Yoklama alınamadı");
                                          }
                                        }}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-all ${p.is_present ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-slate-600 hover:bg-white/10"}`}
                                      >
                                        <Check
                                          size={24}
                                          weight="bold"
                                          className={
                                            p.is_present
                                              ? "opacity-100"
                                              : "opacity-20"
                                          }
                                        />
                                      </button>
                                    </td>
                                  ) : (
                                    <>
                                      <td className="px-4 py-6 text-center font-black text-emerald-500/50">
                                        {p.wins || 0}
                                      </td>
                                      <td className="px-4 py-6 text-center font-black text-red-500/50">
                                        {p.losses || 0}
                                      </td>
                                      <td className="px-8 py-6 text-center font-black text-blue-500 text-xl">
                                        {p.points}
                                      </td>
                                    </>
                                  )}
                                  <td className="px-4 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditingPlayer(p);
                                          setIsSetupOpen(true);
                                        }}
                                        className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-slate-500 hover:text-blue-400"
                                      >
                                        <Pencil size={18} weight="bold" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (
                                            confirm(
                                              `${p.username} isimli oyuncuyu silmek istediğinize emin misiniz?`,
                                            )
                                          ) {
                                            try {
                                              await client.tournament.deleteParticipant(
                                                p.id,
                                              );
                                              toast.success("Oyuncu silindi");
                                              fetchDetailData();
                                            } catch (err) {
                                              toast.error("Silme hatası");
                                            }
                                          }
                                        }}
                                        className="p-2 bg-white/5 rounded-xl hover:bg-red-500/10 transition-colors text-slate-500 hover:text-red-500"
                                      >
                                        <Trash size={18} weight="bold" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="matches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {(() => {
                  if (viewedStep === totalSteps) {
                    const finalMatch = matches.find(
                      (m) =>
                        m.phase === "bracket" &&
                        matches.filter(
                          (m2) => m2.phase === "bracket" && m2.round > m.round,
                        ).length === 0,
                    );
                    const results = finalMatch
                      ? [
                          {
                            id: finalMatch.player1_id,
                            username: finalMatch.username1,
                            avatar: finalMatch.avatar1,
                            score:
                              finalMatch.scores?.[finalMatch.player1_id] || 0,
                          },
                          {
                            id: finalMatch.player2_id,
                            username: finalMatch.username2,
                            avatar: finalMatch.avatar2,
                            score:
                              finalMatch.scores?.[finalMatch.player2_id] || 0,
                          },
                          {
                            id: finalMatch.player3_id,
                            username: finalMatch.username3,
                            avatar: finalMatch.avatar3,
                            score:
                              finalMatch.scores?.[finalMatch.player3_id] || 0,
                          },
                          {
                            id: finalMatch.player4_id,
                            username: finalMatch.username4,
                            avatar: finalMatch.avatar4,
                            score:
                              finalMatch.scores?.[finalMatch.player4_id] || 0,
                          },
                        ]
                          .filter((p) => p.id)
                          .sort((a, b) => b.score - a.score)
                      : [];

                    return (
                      <div className="flex flex-col items-center justify-center py-12 space-y-12">
                        <div className="relative">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-32 h-32 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]"
                          >
                            <Trophy
                              size={64}
                              weight="fill"
                              className="text-yellow-500"
                            />
                          </motion.div>
                          <div className="absolute -top-4 -right-4 bg-yellow-500 text-black px-4 py-1 rounded-full font-black text-xs uppercase tracking-tighter shadow-xl">
                            Şampiyon
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                          {results.map((p, idx) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`relative p-8 rounded-[2.5rem] border flex flex-col items-center gap-4 text-center ${idx === 0 ? "bg-yellow-500/10 border-yellow-500/30 shadow-2xl" : "bg-[#121216] border-white/5"}`}
                            >
                              <div
                                className={`w-20 h-20 rounded-full border-2 overflow-hidden flex items-center justify-center bg-slate-800 ${idx === 0 ? "border-yellow-500" : "border-white/10"}`}
                              >
                                {p.avatar ? (
                                  <img
                                    src={p.avatar}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <UserIcon
                                    size={32}
                                    className="text-slate-600"
                                  />
                                )}
                              </div>
                              <div>
                                <h3 className="font-black text-xl text-white uppercase tracking-tight">
                                  {p.username}
                                </h3>
                                <p className="text-sm font-bold text-slate-500">
                                  {idx + 1}. Sıra • {p.score} Puan
                                </p>
                              </div>
                              {idx === 0 && (
                                <Crown
                                  size={32}
                                  weight="fill"
                                  className="text-yellow-500 absolute -top-4 -right-4 rotate-12"
                                />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const filteredMatches = matches.filter((m) => {
                    if (viewedStep! <= leagueRounds)
                      return m.phase === "league" && m.round === viewedStep;
                    return (
                      m.phase === "bracket" &&
                      m.round === viewedStep! - leagueRounds
                    );
                  });

                  const isReadOnly = viewedStep !== currentStep;

                  if (filteredMatches.length === 0) {
                    return (
                      <div className="bg-[#121216] p-12 rounded-[2.5rem] border border-white/5 text-center">
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                          Bu turda maç bulunamadı
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMatches.map((match, mIdx) => {
                        const isFourPlayer =
                          tournament?.players_per_match === 4;
                        const getScore = (pId: string) =>
                          (match.scores && match.scores[pId]) || 0;
                        const matchPlayers = [
                          {
                            id: match.player1_id,
                            username: (match as any).username1,
                            avatar: (match as any).avatar1,
                            score: getScore(match.player1_id),
                          },
                          {
                            id: match.player2_id,
                            username: (match as any).username2,
                            avatar: (match as any).avatar2,
                            score: getScore(match.player2_id),
                          },
                          {
                            id: match.player3_id,
                            username: (match as any).username3,
                            avatar: (match as any).avatar3,
                            score: getScore(match.player3_id),
                          },
                          {
                            id: match.player4_id,
                            username: (match as any).username4,
                            avatar: (match as any).avatar4,
                            score: getScore(match.player4_id),
                          },
                        ]
                          .filter((p) => p.id)
                          .sort((a, b) => (b.score || 0) - (a.score || 0));

                        return (
                          <div
                            key={match.id}
                            onClick={() => {
                              if (isReadOnly) {
                                toast(
                                  "Bu tur tamamlandığı için skor düzenlenemez.",
                                  { icon: "🔒" },
                                );
                                return;
                              }
                              setSelectedMatch(match);
                              setIsScoreModalOpen(true);
                            }}
                            className={`bg-[#121216] border p-6 rounded-[2rem] transition-all group shadow-2xl relative ${
                              isReadOnly
                                ? "border-white/5 opacity-80 cursor-default"
                                : "border-white/5 hover:border-blue-500/50 hover:bg-white/[0.03] cursor-pointer"
                            }`}
                          >


                            <div className="flex items-center justify-between mb-6 px-2">
                              <div className="flex items-center gap-2">
                                {match.phase === "bracket" ? (
                                  <Trophy
                                    size={18}
                                    weight="bold"
                                    className="text-blue-500/50"
                                  />
                                ) : (
                                  <Users
                                    size={18}
                                    weight="bold"
                                    className="text-blue-500/50"
                                  />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                                  {match.phase === "bracket"
                                    ? matches.filter(
                                        (m) =>
                                          m.phase === "bracket" &&
                                          m.round === match.round,
                                      ).length === 1
                                      ? "FİNAL"
                                      : "YARI FİNAL"
                                    : `Masa ${mIdx + 1}`}
                                </span>
                              </div>
                            </div>
                            {isFourPlayer ? (
                              <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, slotIdx) => {
                                  const p = matchPlayers[slotIdx];
                                  const isSlotActive = !!p?.id;
                                  return (
                                    <div
                                      key={slotIdx}
                                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${p && slotIdx === 0 && match.scores && Object.keys(match.scores).length > 0 ? "bg-blue-500/10 border-blue-500/20" : isSlotActive ? "bg-white/[0.02] border-white/5" : "bg-white/[0.01] border-white/5 border-dashed opacity-40"}`}
                                    >
                                      <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${p && slotIdx === 0 && match.status === "finished" ? "bg-blue-500 text-white" : "bg-white/5 text-slate-500"}`}
                                        >
                                          {slotIdx + 1}
                                        </div>
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 border ${isSlotActive ? "bg-slate-800 border-white/10" : "bg-transparent border-white/10"}`}
                                        >
                                          {p?.avatar ? (
                                            <img
                                              src={p.avatar}
                                              alt={p.username}
                                              className="w-full h-full object-contain"
                                            />
                                          ) : isSlotActive ? (
                                            <UserIcon className="w-4 h-4 text-slate-600" />
                                          ) : null}
                                        </div>
                                        <span
                                          className={`font-bold text-sm truncate ${isSlotActive ? "text-slate-200" : "text-slate-700"}`}
                                        >
                                          {p?.username || "Bekleniyor..."}
                                        </span>
                                      </div>
                                      {isSlotActive && (
                                        <div className="flex items-center gap-2">
                                          <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg">
                                            <span className="text-xs font-black text-white">
                                              {p.score || 0}{" "}
                                              <span className="text-[10px] text-slate-500">
                                                P
                                              </span>
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 flex flex-col items-start gap-2">
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                    {match.avatar1 ? (
                                      <img
                                        src={match.avatar1}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <UserIcon size={20} />
                                    )}
                                  </div>
                                  <span className="font-bold text-sm truncate w-full">
                                    {match.username1 || "Bilinmiyor"}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-3 font-black text-2xl text-white">
                                    <span>
                                      {(match.scores &&
                                        match.scores[match.player1_id]) ||
                                        0}
                                    </span>
                                    <span className="text-slate-800">-</span>
                                    <span>
                                      {(match.scores &&
                                        match.scores[match.player2_id]) ||
                                        0}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 flex flex-col items-end gap-2">
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                                    {match.avatar2 ? (
                                      <img
                                        src={match.avatar2}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <UserIcon size={20} />
                                    )}
                                  </div>
                                  <span className="font-bold text-sm text-right truncate w-full">
                                    {match.username2 || "Bilinmiyor"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      <PlayerSetupModal
        isOpen={isSetupOpen}
        onClose={() => {
          setIsSetupOpen(false);
          setEditingPlayer(null);
        }}
        onSuccess={fetchDetailData}
        tournamentSlug={slug as string}
        client={client}
        initialData={editingPlayer}
      />
      <ScoreUpdateModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        onSuccess={fetchDetailData}
        match={selectedMatch}
        playersPerMatch={tournament?.players_per_match || 2}
        client={client}
      />
    </div>
  </div>
  );
}

export default function TournamentDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <CircleNotch size={48} className="animate-spin text-blue-500" />
      </div>
    }>
      <TournamentDetailContent />
    </Suspense>
  );
}

