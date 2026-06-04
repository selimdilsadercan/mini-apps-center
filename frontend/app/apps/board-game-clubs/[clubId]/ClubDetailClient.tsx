"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MagnifyingGlass, 
  Funnel, 
  Plus, 
  DownloadSimple, 
  Trash, 
  PencilSimple, 
  Clock, 
  Users, 
  CheckCircle, 
  ClockClockwise, 
  Wrench, 
  CircleNotch,
  BookOpen,
  Warning,
  Sparkle,
  GameController,
  X
} from "@phosphor-icons/react";
import { 
  getClubDetailsAction, 
  getClubGamesAction, 
  addClubGameAction, 
  updateClubGameAction, 
  deleteClubGameAction, 
  searchBggGamesAction, 
  importBggGeeklistAction 
} from "../actions";
import type { board_game_clubs } from "@/lib/client";

// Status Badge Styling — Forest-themed for light mode
const STATUS_STYLES: Record<string, { bg: string; label: string; icon: React.ElementType }> = {
  available: { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", label: "Mevcut", icon: CheckCircle },
  borrowed: { bg: "bg-amber-50 border-amber-200 text-amber-700", label: "Ödünç Verildi", icon: ClockClockwise },
  maintenance: { bg: "bg-red-50 border-red-200 text-red-700", label: "Bakımda", icon: Wrench },
};

// Condition Badges
const CONDITION_LABELS: Record<string, { text: string; color: string }> = {
  new: { text: "Yeni Gibi", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  good: { text: "İyi", color: "text-amber-700 bg-amber-50 border-amber-200" },
  worn: { text: "Yıpranmış", color: "text-orange-700 bg-orange-50 border-orange-200" },
  damaged: { text: "Hasarlı", color: "text-red-700 bg-red-50 border-red-200" },
};

export default function ClubDetailClient({ clubId }: { clubId: string }) {
  const router = useRouter();

  const [club, setClub] = useState<board_game_clubs.Club | null>(null);
  const [games, setGames] = useState<board_game_clubs.ClubGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeeklistModalOpen, setIsGeeklistModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Import / Create game states
  const [manualTitle, setManualTitle] = useState("");
  const [manualMinPlayers, setManualMinPlayers] = useState("");
  const [manualMaxPlayers, setManualMaxPlayers] = useState("");
  const [manualPlayTime, setManualPlayTime] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [submittingGame, setSubmittingGame] = useState(false);

  // BGG Search states
  const [bggSearchQuery, setBggSearchQuery] = useState("");
  const [bggSearchResults, setBggSearchResults] = useState<board_game_clubs.BggSearchResult[]>([]);
  const [bggSearching, setBggSearching] = useState(false);
  const [bggImportingId, setBggImportingId] = useState<number | null>(null);

  // Geeklist Import states
  const [geeklistId, setGeeklistId] = useState("");
  const [importingGeeklist, setImportingGeeklist] = useState(false);

  // BGG API Key state
  const [bggApiKey, setBggApiKey] = useState("");

  // Edit Game states
  const [selectedGame, setSelectedGame] = useState<board_game_clubs.ClubGame | null>(null);
  const [editCondition, setEditCondition] = useState<"new" | "good" | "worn" | "damaged">("good");
  const [editStatus, setEditStatus] = useState<"available" | "borrowed" | "maintenance">("available");
  const [editNotes, setEditNotes] = useState("");
  const [updatingGame, setUpdatingGame] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("bgg_api_key");
      if (savedKey) {
        setBggApiKey(savedKey);
      } else if (process.env.NEXT_PUBLIC_BGG_API_KEY) {
        setBggApiKey(process.env.NEXT_PUBLIC_BGG_API_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (clubId) {
      loadClubData();
    }
  }, [clubId]);

  async function loadClubData() {
    try {
      setLoading(true);
      const [clubRes, gamesRes] = await Promise.all([
        getClubDetailsAction(clubId),
        getClubGamesAction(clubId),
      ]);

      if (clubRes.data) {
        setClub(clubRes.data);
      } else {
        setError(clubRes.error || "Kulüp bulunamadı.");
      }

      if (gamesRes.data) {
        setGames(gamesRes.data);
      }
    } catch (err) {
      console.error(err);
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // BGG Search
  async function handleBggSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!bggSearchQuery.trim()) return;

    try {
      setBggSearching(true);
      const res = await searchBggGamesAction(bggSearchQuery.trim(), bggApiKey || undefined);
      if (res.data) {
        setBggSearchResults(res.data);
      } else {
        alert(res.error || "Arama sırasında bir hata oluştu.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBggSearching(false);
    }
  }

  // Import a single game from BGG
  async function handleImportBggGame(bggId: number, title: string) {
    try {
      setBggImportingId(bggId);
      const res = await addClubGameAction(clubId, {
        title,
        bggId,
        apiKey: bggApiKey || undefined
      });

      if (res.error || !res.data) {
        alert(res.error || "Oyun import edilemedi.");
      } else {
        setGames((prev) => [...prev, res.data!].sort((a, b) => a.title.localeCompare(b.title)));
        setIsAddModalOpen(false);
        setBggSearchQuery("");
        setBggSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBggImportingId(null);
    }
  }

  // Add Manual Game
  async function handleAddManualGame(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    try {
      setSubmittingGame(true);
      const res = await addClubGameAction(clubId, {
        title: manualTitle.trim(),
        minPlayers: manualMinPlayers ? parseInt(manualMinPlayers) : undefined,
        maxPlayers: manualMaxPlayers ? parseInt(manualMaxPlayers) : undefined,
        playingTime: manualPlayTime ? parseInt(manualPlayTime) : undefined,
        notes: manualNotes.trim() || undefined,
        condition: "good",
        status: "available",
      });

      if (res.error || !res.data) {
        alert(res.error || "Oyun eklenemedi.");
      } else {
        setGames((prev) => [...prev, res.data!].sort((a, b) => a.title.localeCompare(b.title)));
        setIsAddModalOpen(false);
        setManualTitle("");
        setManualMinPlayers("");
        setManualMaxPlayers("");
        setManualPlayTime("");
        setManualNotes("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingGame(false);
    }
  }

  // Import Geeklist
  async function handleImportGeeklist(e: React.FormEvent) {
    e.preventDefault();
    if (!geeklistId.trim()) return;

    try {
      setImportingGeeklist(true);
      const res = await importBggGeeklistAction(clubId, geeklistId.trim(), bggApiKey || undefined);
      if (res.error || !res.data) {
        alert(res.error || "Geeklist aktarılamadı.");
      } else {
        alert(`Başarıyla ${res.data.importedCount} yeni oyun aktarıldı, ${res.data.failedCount} oyun başarısız oldu.`);
        setGames(res.data.games);
        setIsGeeklistModalOpen(false);
        setGeeklistId("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImportingGeeklist(false);
    }
  }

  function handleApiKeyChange(val: string) {
    setBggApiKey(val);
    localStorage.setItem("bgg_api_key", val);
  }

  // Open Edit Modal
  function openEditModal(game: board_game_clubs.ClubGame) {
    setSelectedGame(game);
    setEditCondition(game.condition);
    setEditStatus(game.status);
    setEditNotes(game.notes || "");
    setIsEditModalOpen(true);
  }

  // Update Game
  async function handleUpdateGame(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGame) return;

    try {
      setUpdatingGame(true);
      const res = await updateClubGameAction(selectedGame.id, {
        condition: editCondition,
        status: editStatus,
        notes: editNotes.trim(),
      });

      if (res.error || !res.data) {
        alert(res.error || "Güncelleme başarısız.");
      } else {
        setGames((prev) => prev.map((g) => (g.id === selectedGame.id ? res.data! : g)));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingGame(false);
    }
  }

  // Delete Game
  async function handleDeleteGame(gameId: string) {
    if (!confirm("Bu oyunu kütüphaneden silmek istediğinize emin misiniz?")) return;

    try {
      const res = await deleteClubGameAction(gameId);
      if (res.data) {
        setGames((prev) => prev.filter((g) => g.id !== gameId));
      } else {
        alert(res.error || "Oyun silinemedi.");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Filtered games logic
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = game.title.toLowerCase().includes(query);
        const matchesDesc = game.description?.toLowerCase().includes(query);
        const matchesNotes = game.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesNotes) return false;
      }

      // Player count filter
      if (selectedPlayers !== null) {
        const min = game.min_players || 0;
        const max = game.max_players || 99;
        
        if (selectedPlayers === 5) {
          if (max < 5) return false;
        } else {
          if (selectedPlayers < min || selectedPlayers > max) return false;
        }
      }

      // Status filter
      if (selectedStatus) {
        if (game.status !== selectedStatus) return false;
      }

      return true;
    });
  }, [games, searchQuery, selectedPlayers, selectedStatus]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfbf7] text-[#0a120a]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-200/50 blur-xl animate-pulse" />
            <CircleNotch size={44} className="animate-spin text-amber-700 relative" />
          </div>
          <p className="text-stone-600 font-medium text-sm">Kulüp detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-[#fbf9f4] text-stone-850 flex flex-col justify-center items-center p-6">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl" />
          <Warning size={48} className="text-red-500 relative" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">{error || "Kulüp bulunamadı."}</h2>
        <button 
          onClick={() => router.push("/apps/board-game-clubs")}
          className="mt-6 flex items-center gap-2.5 bg-white border border-[#e8e4d9] hover:border-amber-600/30 px-5 py-2.5 rounded-xl text-sm text-stone-750 font-semibold transition-all duration-300 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Kulüplere Geri Dön</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-stone-850 bg-[#fbf9f4] flex flex-col relative overflow-x-hidden">
      {/* Background patterns */}
      <div className="fixed inset-0 bg-[#fbf9f4] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(#8b735510_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,115,85,0.06),transparent_70%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-[#e8e4d9] px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/apps/board-game-clubs")}
            className="p-2 hover:bg-stone-200/50 rounded-xl text-stone-500 hover:text-stone-850 transition-all duration-300 border border-transparent hover:border-stone-300/40"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} className="w-10 h-10 rounded-xl object-cover border border-[#e8e4d9] shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                <Users size={20} className="text-stone-400" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-base leading-tight text-stone-800">{club.name}</h1>
              <p className="text-[11px] text-stone-500 truncate max-w-xs font-bold">{club.description || "Açıklama belirtilmemiş"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsGeeklistModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-stone-50 border border-[#e8e4d9] hover:border-amber-600/20 px-4 py-2.5 rounded-xl text-stone-600 hover:text-amber-800 transition-all duration-300 text-xs font-bold shadow-sm"
          >
            <DownloadSimple size={16} />
            <span className="hidden sm:inline">Geeklist Aktar</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="group flex items-center gap-1.5 bg-amber-700 hover:bg-amber-600 active:scale-[0.97] text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-md text-xs"
          >
            <Plus size={16} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Oyun Ekle</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 relative z-10 flex flex-col gap-6">
        
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white border border-[#e8e4d9] p-4 rounded-2xl shadow-sm">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Oyun adı, açıklama veya notlarda ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-550/15 transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-stone-100/60 border border-stone-200/50 rounded-xl text-xs text-stone-550 font-bold">
              <Funnel size={14} />
              <span>Filtreler:</span>
            </div>

            {/* Players Filter */}
            <select
              value={selectedPlayers || ""}
              onChange={(e) => setSelectedPlayers(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 bg-white border border-[#e8e4d9] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-amber-600 cursor-pointer shadow-sm"
            >
              <option value="">Oyuncu (Tümü)</option>
              <option value="1">1 Solo</option>
              <option value="2">2 Oyuncu</option>
              <option value="3">3 Oyuncu</option>
              <option value="4">4 Oyuncu</option>
              <option value="5">5+ Oyuncu</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus || ""}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="px-3 py-2 bg-white border border-[#e8e4d9] rounded-xl text-xs text-stone-700 focus:outline-none focus:border-amber-600 cursor-pointer shadow-sm"
            >
              <option value="">Durum (Tümü)</option>
              <option value="available">Mevcut</option>
              <option value="borrowed">Ödünç Verildi</option>
              <option value="maintenance">Bakımda</option>
            </select>

            {/* Reset Filters */}
            {(selectedPlayers !== null || selectedStatus !== null || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedPlayers(null);
                  setSelectedStatus(null);
                  setSearchQuery("");
                }}
                className="text-xs text-amber-700 hover:text-amber-600 px-2.5 py-1.5 font-bold transition-colors"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="bg-stone-200/50 border border-stone-300/30 px-3 py-1.5 rounded-lg font-bold text-stone-600 shadow-sm">
            {filteredGames.length} / {games.length} oyun
          </span>
          {searchQuery && (
            <span className="text-amber-700 italic">&quot;{searchQuery}&quot; araması</span>
          )}
        </div>

        {/* Games Library Grid */}
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4 border border-dashed border-[#e6e1d4] rounded-3xl bg-white/40 shadow-sm relative overflow-hidden">
            <div className="relative mb-4">
              <div className="bg-white border border-[#e6e1d4] p-5 rounded-2xl shadow-sm">
                <BookOpen size={40} className="text-amber-700/40" />
              </div>
            </div>
            <h3 className="font-bold text-stone-800 text-lg">Kriterlere Uygun Oyun Bulunamadı</h3>
            <p className="text-stone-500 text-xs mt-2 max-w-sm">
              Filtreleri değiştirebilir veya sağ üstten kütüphanenize yeni bir kutu oyunu ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => {
              const StatusStyle = STATUS_STYLES[game.status] || STATUS_STYLES.available;
              const StatusIcon = StatusStyle.icon;
              const conditionInfo = CONDITION_LABELS[game.condition] || CONDITION_LABELS.good;

              return (
                <div
                  key={game.id}
                  className="group relative bg-white border border-[#e8e4d9] hover:border-amber-600/40 rounded-2xl p-4 flex flex-col justify-between transition-all duration-500 shadow-sm hover:shadow-md"
                >
                  <div className="space-y-3 relative">
                    {/* Game Header */}
                    <div className="flex items-start gap-3.5">
                      {game.image_url ? (
                        <img
                          src={game.image_url}
                          alt={game.title}
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-sm group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-stone-50 border border-stone-250 flex items-center justify-center group-hover:bg-amber-50 transition-all duration-300">
                          <GameController size={28} className="text-stone-400 group-hover:text-amber-700/60 transition-colors" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${StatusStyle.bg} mb-1.5 shadow-sm`}>
                          <StatusIcon size={10} weight="fill" />
                          <span>{StatusStyle.label}</span>
                        </span>
                        
                        <h4 className="font-bold text-stone-800 group-hover:text-amber-800 transition-colors duration-300 text-sm truncate" title={game.title}>
                          {game.title}
                        </h4>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${conditionInfo.color} shadow-sm`}>
                            {conditionInfo.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 text-stone-600 text-xs shadow-inner">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-stone-400" />
                        <span>
                          {game.min_players && game.max_players
                            ? game.min_players === game.max_players
                              ? `${game.min_players} Kişi`
                              : `${game.min_players}-${game.max_players} Kişi`
                            : "Belirtilmemiş"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-stone-400" />
                        <span>
                          {game.playing_time ? `${game.playing_time} Dk` : "Belirtilmemiş"}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {game.notes && (
                      <p className="text-[11px] text-stone-500 leading-relaxed italic bg-stone-50 border-l-2 border-amber-600/30 pl-3 py-1.5 rounded-r">
                        {game.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => openEditModal(game)}
                      className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-amber-600/30 hover:text-amber-800 rounded-lg text-stone-450 transition-all duration-300 shadow-sm"
                      title="Durumu Düzenle"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      className="p-2 bg-stone-50 hover:bg-red-50 border border-stone-200 hover:border-red-300 hover:text-red-600 rounded-lg text-stone-450 transition-all duration-300 shadow-sm"
                      title="Kütüphaneden Çıkar"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: Add Board Game */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm"
          onClick={() => {
            setIsAddModalOpen(false);
            setBggSearchResults([]);
            setBggSearchQuery("");
          }}
        >
          <div 
            className="w-full max-w-2xl bg-white border border-[#e8e4d9] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-850">Koleksiyona Oyun Ekle</h3>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setBggSearchResults([]);
                  setBggSearchQuery("");
                }}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-850 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-6">
              {/* BGG Search Import */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Sparkle size={16} weight="fill" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">BGG Üzerinden Arayıp Ekle (Önerilen)</h4>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Oyunun bilgilerini (oyuncu sayısı, görsel, süre vb.) BoardGameGeek veritabanından otomatik çeker.
                  </p>

                  <form onSubmit={handleBggSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={bggSearchQuery}
                      onChange={(e) => setBggSearchQuery(e.target.value)}
                      placeholder="BGG oyun adı (örn: Ticket to Ride, Catan)..."
                      className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-xs focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-550/15 transition-all placeholder:text-stone-400"
                    />
                    <button
                      type="submit"
                      disabled={bggSearching}
                      className="flex items-center justify-center bg-amber-700 hover:bg-amber-600 disabled:bg-amber-700/50 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                    >
                      {bggSearching ? <CircleNotch size={14} className="animate-spin" /> : "BGG'de Ara"}
                    </button>
                  </form>

                  {/* BGG Search Results */}
                  {bggSearchResults.length > 0 && (
                    <div className="bg-stone-50 border border-stone-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-stone-250/50 shadow-inner">
                      {bggSearchResults.map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 text-xs hover:bg-stone-100/50 transition-colors">
                          <div>
                            <p className="font-bold text-stone-800">{result.title}</p>
                            {result.year_published && (
                              <p className="text-[10px] text-stone-400 mt-0.5">Yıl: {result.year_published}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={bggImportingId !== null}
                            onClick={() => handleImportBggGame(result.id, result.title)}
                            className="flex items-center gap-1.5 bg-white border border-stone-200 hover:border-amber-600/30 hover:text-amber-800 px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-stone-500 shadow-sm"
                          >
                            {bggImportingId === result.id ? (
                              <CircleNotch size={12} className="animate-spin" />
                            ) : (
                              <DownloadSimple size={12} />
                            )}
                            <span>{bggImportingId === result.id ? "İndiriliyor..." : "Koleksiyona Ekle"}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-stone-200 my-2" />

              {/* Manual Game Entry */}
              <form onSubmit={handleAddManualGame} className="space-y-4">
                <div className="flex items-center gap-2 text-stone-400">
                  <PencilSimple size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Manuel Oyun Bilgileri Ekle</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1.5 tracking-wide uppercase">Oyun Adı *</label>
                    <input
                      type="text"
                      required={bggSearchResults.length === 0}
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Örn: Monopol"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-xs focus:outline-none focus:border-amber-600 transition-all placeholder:text-stone-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1.5 tracking-wide uppercase">Ortalama Süre (Dk)</label>
                    <input
                      type="number"
                      value={manualPlayTime}
                      onChange={(e) => setManualPlayTime(e.target.value)}
                      placeholder="Örn: 60"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-xs focus:outline-none focus:border-amber-600 transition-all placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1.5 tracking-wide uppercase">Min Oyuncu</label>
                    <input
                      type="number"
                      value={manualMinPlayers}
                      onChange={(e) => setManualMinPlayers(e.target.value)}
                      placeholder="Örn: 2"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-xs focus:outline-none focus:border-amber-600 transition-all placeholder:text-stone-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1.5 tracking-wide uppercase">Maks Oyuncu</label>
                    <input
                      type="number"
                      value={manualMaxPlayers}
                      onChange={(e) => setManualMaxPlayers(e.target.value)}
                      placeholder="Örn: 4"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-xs focus:outline-none focus:border-amber-600 transition-all placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1.5 tracking-wide uppercase">Özel Notlar</label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Örn: Eksik pulu var, kutusu bantlı..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-xs focus:outline-none focus:border-amber-600 resize-none transition-all placeholder:text-stone-400"
                  />
                </div>

                {manualTitle.trim() && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingGame}
                      className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                    >
                      {submittingGame && <CircleNotch size={12} className="animate-spin" />}
                      <span>Oluştur ve Ekle</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Geeklist Import */}
      {isGeeklistModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm"
          onClick={() => setIsGeeklistModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white border border-[#e8e4d9] rounded-3xl p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <h3 className="text-base font-bold text-stone-800 mb-1.5">
                BGG Geeklist'ten Toplu Oyun Aktar
              </h3>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                Oyun kulübü veya kafesinin BoardGameGeek geeklist ID'sini veya doğrudan liste linkini girerek tüm kütüphaneyi tek seferde çekin.
              </p>

              <form onSubmit={handleImportGeeklist} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-2 tracking-wide uppercase">
                    Geeklist ID / Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={geeklistId}
                    onChange={(e) => setGeeklistId(e.target.value)}
                    placeholder="Örn: 341258 veya full link..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-xs focus:outline-none focus:border-amber-600 transition-all placeholder:text-stone-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGeeklistModalOpen(false);
                      setGeeklistId("");
                    }}
                    className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={importingGeeklist}
                    className="flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 disabled:bg-amber-700/50 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                  >
                    {importingGeeklist && <CircleNotch size={12} className="animate-spin" />}
                    <span>Aktarımı Başlat</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Status & Notes */}
      {isEditModalOpen && selectedGame && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white border border-[#e8e4d9] rounded-3xl p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <h3 className="text-base font-bold text-stone-850 mb-6">Oyun Durumunu Güncelle</h3>
              
              <form onSubmit={handleUpdateGame} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-2 tracking-wide uppercase">Durum</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                    >
                      <option value="available">Mevcut</option>
                      <option value="borrowed">Ödünç Verildi</option>
                      <option value="maintenance">Bakımda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-2 tracking-wide uppercase">Kondisyon</label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none focus:border-amber-600 cursor-pointer"
                    >
                      <option value="new">Yeni Gibi</option>
                      <option value="good">İyi</option>
                      <option value="worn">Yıpranmış</option>
                      <option value="damaged">Hasarlı</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-2 tracking-wide uppercase">Notlar / Ayrıntılar</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Oyunun durumuyla ilgili notlar ekleyin..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-850 focus:outline-none focus:border-amber-600 resize-none transition-all placeholder:text-stone-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={updatingGame}
                    className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                  >
                    {updatingGame && <CircleNotch size={12} className="animate-spin" />}
                    <span>Güncelle</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
