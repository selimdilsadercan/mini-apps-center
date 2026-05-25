"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MagnifyingGlass, 
  Heart, 
  Users, 
  Cards, 
  Note, 
  ClipboardText,
  Tag,
  Star,
  FloppyDisk,
  X,
  XCircle,
  Hash,
  Play
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";

const client = createBrowserClient();

interface Game {
  id: string;
  name: string;
  description: string;
  rules: string[];
  min_players: number;
  max_players: number;
  deck_count: string;
  category: string;
  is_favorite: boolean;
  user_note: string | null;
}

export default function IskambilRehberi() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedPlayers, setSelectedPlayers] = useState("Tümü");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchGames = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const resp = await client.iskambil.getGames(user.id);
      setGames(resp.games || []);
    } catch (err) {
      console.error("Failed to load games:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user?.id) {
      fetchGames();
    }
  }, [isUserLoaded, user?.id]);

  // Kategoriler
  const categories = useMemo(() => {
    const list = new Set(games.map(g => g.category));
    return ["Tümü", "Favorilerim", ...Array.from(list)];
  }, [games]);

  // Oyuncu Sayısı Seçenekleri
  const playerOptions = ["Tümü", "1 Oyuncu", "2 Oyuncu", "3-4 Oyuncu", "5+ Oyuncu"];

  // Filtrelenmiş Oyunlar
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      // Arama filtresi
      const matchesSearch = 
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.rules.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

      // Kategori filtresi
      let matchesCategory = true;
      if (selectedCategory === "Favorilerim") {
        matchesCategory = game.is_favorite;
      } else if (selectedCategory !== "Tümü") {
        matchesCategory = game.category === selectedCategory;
      }

      // Oyuncu sayısı filtresi
      let matchesPlayers = true;
      if (selectedPlayers === "1 Oyuncu") {
        matchesPlayers = game.min_players === 1;
      } else if (selectedPlayers === "2 Oyuncu") {
        matchesPlayers = game.min_players <= 2 && game.max_players >= 2;
      } else if (selectedPlayers === "3-4 Oyuncu") {
        matchesPlayers = (game.min_players <= 4 && game.max_players >= 3);
      } else if (selectedPlayers === "5+ Oyuncu") {
        matchesPlayers = game.max_players >= 5;
      }

      return matchesSearch && matchesCategory && matchesPlayers;
    });
  }, [games, searchQuery, selectedCategory, selectedPlayers]);

  // Kategorilere göre gruplanmış oyunlar
  const groupedGames = useMemo(() => {
    const groups: { [key: string]: Game[] } = {};
    filteredGames.forEach(game => {
      if (!groups[game.category]) {
        groups[game.category] = [];
      }
      groups[game.category].push(game);
    });
    // Kategori isimlerine göre alfabetik sıralayalım
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as { [key: string]: Game[] });
  }, [filteredGames]);

  const handleToggleFavorite = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      const resp = await client.iskambil.toggleFavorite({
        gameId,
        userId: user.id
      });
      if (resp.success) {
        setGames(prev => prev.map(g => 
          g.id === gameId ? { ...g, is_favorite: resp.isFavorite } : g
        ));
        if (selectedGame?.id === gameId) {
          setSelectedGame(prev => prev ? { ...prev, is_favorite: resp.isFavorite } : null);
        }
      }
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  const handleOpenDetail = (game: Game) => {
    setSelectedGame(game);
    setNoteText(game.user_note || "");
  };

  const handleSaveNote = async () => {
    if (!user?.id || !selectedGame) return;
    try {
      setIsSavingNote(true);
      const resp = await client.iskambil.saveNote({
        gameId: selectedGame.id,
        userId: user.id,
        note: noteText
      });
      if (resp.success) {
        setGames(prev => prev.map(g => 
          g.id === selectedGame.id ? { ...g, user_note: resp.note } : g
        ));
        setSelectedGame(prev => prev ? { ...prev, user_note: resp.note } : null);
      }
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (!isUserLoaded || (isLoading && games.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0c10] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-600 rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0a0e] text-[#f1f1f3] font-sans selection:bg-red-950 selection:text-red-200 overflow-x-hidden">
      
      {/* Decorative Red Light */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-red-800/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d0c10]/80 backdrop-blur-md border-b border-red-950/20 px-6">
        <div className="max-w-6xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-950/10 hover:bg-red-950/20 border border-red-950/30 text-red-500 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase leading-none text-red-500">
                <Cards size={24} weight="fill" className="text-red-600 animate-pulse" />
                İskambil Rehberi
              </h1>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Popüler Kart Oyunları Arşivi</p>
            </div>
          </div>

          <div className="relative hidden md:block w-72">
            <input 
              type="text" 
              placeholder="Oyun adı veya kural ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121118] border border-red-950/40 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-red-600 focus:bg-[#161520] transition-all text-slate-200"
            />
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Mobile Search */}
        <div className="relative md:hidden w-full">
          <input 
            type="text" 
            placeholder="Oyun adı veya kural ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121118] border border-red-950/40 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:border-red-600 focus:bg-[#161520] transition-all text-slate-200"
          />
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        </div>

        {/* Filters Panel */}
        <section className="bg-[#121118]/40 border border-red-950/20 rounded-2xl p-4 flex flex-col gap-4">
          {/* Categories Tab */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-red-500/80 tracking-widest px-1">KATEGORİLER</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedCategory === cat
                      ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/10"
                      : "bg-[#121118] text-slate-400 border-red-950/20 hover:text-[#f1f1f3] hover:border-red-950/60"
                  }`}
                >
                  {cat === "Favorilerim" ? (
                    <span className="flex items-center gap-1">
                      <Heart size={14} weight="fill" className="text-red-500" />
                      {cat}
                    </span>
                  ) : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Player Count Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-red-500/80 tracking-widest px-1">OYUNCU SAYISI</span>
            <div className="flex flex-wrap gap-2">
              {playerOptions.map((playOpt) => (
                <button
                  key={playOpt}
                  onClick={() => setSelectedPlayers(playOpt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedPlayers === playOpt
                      ? "bg-red-950/40 text-red-400 border-red-900/60"
                      : "bg-[#121118] text-slate-500 border-red-950/10 hover:text-[#f1f1f3]"
                  }`}
                >
                  {playOpt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results Info */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            {filteredGames.length} OYUN LİSTELENİYOR
          </span>
        </div>

        {/* Grouped Games Sections */}
        <div className="space-y-12">
          {Object.entries(groupedGames).map(([category, gamesInCat]) => (
            <div key={category} className="space-y-4">
              {/* Category Header separator */}
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                <h2 className="text-sm font-black text-red-500 tracking-[0.2em]">
                  {category.toLocaleUpperCase("tr-TR")}
                </h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  ({gamesInCat.length} OYUN)
                </span>
                <div className="h-px bg-red-950/20 flex-1 ml-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {gamesInCat.map((game) => (
                    <motion.div
                      key={game.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleOpenDetail(game)}
                      className="bg-[#121118] border border-red-950/20 hover:border-red-800/40 rounded-3xl p-6 relative flex flex-col min-h-[220px] shadow-xl hover:shadow-2xl hover:shadow-red-950/5 group transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                      {/* Decorative suit symbol inside background of card */}
                      <div className="absolute -bottom-10 -right-10 text-[10rem] font-serif opacity-[0.015] group-hover:opacity-[0.035] group-hover:text-red-500 transition-all duration-500 pointer-events-none select-none">
                        {game.category === "Tek Kişilik" && "♠"}
                        {game.category === "Kozlu / Löf" && "♣"}
                        {game.category === "Casino / Bahis" && "♦"}
                        {game.category === "Rumi / Okey" && "♥"}
                        {!["Tek Kişilik", "Kozlu / Löf", "Casino / Bahis", "Rumi / Okey"].includes(game.category) && "♠"}
                      </div>

                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-red-500 bg-red-950/30 border border-red-900/30 px-3 py-1 rounded-full tracking-widest">
                          {game.category.toLocaleUpperCase("tr-TR")}
                        </span>
                        
                        <button
                          onClick={(e) => handleToggleFavorite(game.id, e)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-red-950/10 hover:bg-red-950/20 border border-red-950/30 text-slate-400 hover:text-red-500 transition-all active:scale-90 cursor-pointer"
                        >
                          <Heart size={16} weight={game.is_favorite ? "fill" : "bold"} className={game.is_favorite ? "text-red-500" : ""} />
                        </button>
                      </div>

                      <h3 className="text-lg font-black text-slate-100 tracking-tight group-hover:text-red-400 transition-colors duration-300">
                        {game.name.toLocaleUpperCase("tr-TR")}
                      </h3>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {game.rules.length > 0 ? game.rules[0] : "Oyunun herhangi bir kuralı girilmemiş."}
                      </p>

                      {/* Footer statistics */}
                      <div className="flex gap-4 border-t border-red-950/10 pt-4 mt-auto">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500">
                          <Users size={14} className="text-red-500/60" />
                          <span>
                            {game.min_players === game.max_players 
                              ? `${game.min_players} Oyuncu` 
                              : `${game.min_players}-${game.max_players} Oyuncu`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500">
                          <Cards size={14} className="text-red-500/60" />
                          <span>{game.deck_count}</span>
                        </div>
                        {game.user_note && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-500 ml-auto">
                            <Note size={14} weight="fill" />
                            <span>Notlu</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Rules Details & Notes Modal */}
      <AnimatePresence>
        {selectedGame && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedGame(null)} 
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 cursor-pointer" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 30 }} 
              className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90%] md:max-w-3xl max-h-[85vh] bg-[#0f0e15] border border-red-950/40 rounded-[2.5rem] shadow-2xl z-50 overflow-y-auto scrollbar-thin scrollbar-track-[#0b0a0e] scrollbar-thumb-red-950"
            >
              <div className="p-6 md:p-8 space-y-6">
                
                {/* Modal Header */}
                <div className="flex justify-between items-start border-b border-red-950/10 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-red-500 bg-red-950/30 border border-red-900/30 px-3 py-1 rounded-full tracking-widest">
                      {selectedGame.category.toLocaleUpperCase("tr-TR")}
                    </span>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight mt-2 flex items-center gap-3">
                      {selectedGame.name.toLocaleUpperCase("tr-TR")}
                      <button
                        onClick={(e) => handleToggleFavorite(selectedGame.id, e)}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Heart size={20} weight={selectedGame.is_favorite ? "fill" : "bold"} className={selectedGame.is_favorite ? "text-red-500" : ""} />
                      </button>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedGame(null)} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-red-950/20 rounded-full text-slate-400 transition-all cursor-pointer border border-transparent hover:border-red-950/30"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>

                {/* Game Quick Info Tags */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-[#121118] border border-red-950/10 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Oyuncu Kapasitesi</span>
                    <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <Users size={16} className="text-red-500" />
                      {selectedGame.min_players === selectedGame.max_players 
                        ? `${selectedGame.min_players} Oyuncu` 
                        : `${selectedGame.min_players}-${selectedGame.max_players} Oyuncu`}
                    </span>
                  </div>
                  <div className="bg-[#121118] border border-red-950/10 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Deste Gereksinimi</span>
                    <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <Cards size={16} className="text-red-500" />
                      {selectedGame.deck_count}
                    </span>
                  </div>
                  <div className="bg-[#121118] border border-red-950/10 rounded-2xl p-4 col-span-2 md:col-span-1 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Oyun Türü</span>
                    <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <Tag size={16} className="text-red-500" />
                      {selectedGame.category}
                    </span>
                  </div>
                </div>

                {/* Tabular Layout / Scrollable Content */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  
                  {/* Rules Column */}
                  <div className="md:col-span-3 space-y-4">
                    <h3 className="text-xs font-black uppercase text-red-500 tracking-[0.2em] flex items-center gap-2">
                      <ClipboardText size={18} />
                      OYNANIŞ VE KURALLAR
                    </h3>
                    
                    <div className="bg-[#121118]/60 border border-red-950/10 rounded-3xl p-6 max-h-[300px] overflow-y-auto space-y-4 font-sans text-sm text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-red-950">
                      {selectedGame.rules.length > 0 ? (
                        <ol className="space-y-4 list-decimal list-inside">
                          {selectedGame.rules.map((rule, idx) => (
                            <li key={idx} className="marker:text-red-500 marker:font-black pb-2 border-b border-red-950/5 last:border-0 pl-1">
                              <span className="inline-block md:inline leading-loose text-slate-300">{rule}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="text-center text-slate-500 py-8 flex flex-col items-center gap-2">
                          <XCircle size={32} className="opacity-50" />
                          <span>Bu oyun için henüz bir kural girişi bulunmuyor.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes Column */}
                  <div className="md:col-span-2 space-y-4 flex flex-col">
                    <h3 className="text-xs font-black uppercase text-red-500 tracking-[0.2em] flex items-center gap-2">
                      <Note size={18} />
                      KİŞİSEL NOTLAR & EV KURALLARI
                    </h3>
                    
                    <div className="bg-[#121118]/60 border border-red-950/10 rounded-3xl p-5 flex flex-col gap-4 flex-1">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Evde oynadığınız özel varyasyonları veya hatırlamak istediğiniz notları yazın..."
                        className="w-full bg-[#121118] border border-red-950/20 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-red-600 focus:bg-[#161520] transition-all text-slate-200 resize-none min-h-[160px] md:min-h-[180px] flex-1"
                      />
                      
                      <button
                        onClick={handleSaveNote}
                        disabled={isSavingNote}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer disabled:opacity-50"
                      >
                        <FloppyDisk size={16} />
                        <span>{isSavingNote ? "Kaydediliyor..." : "Kaydet"}</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
