"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  Plus,
  X,
  Spinner,
  GameController,
  TrendDown,
  Clock,
  CheckCircle,
  Hourglass,
  Star,
  Users,
  Bell,
  Heart,
  PlusCircle,
  Check,
  Warning,
  Calendar,
  Sparkle,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { gaming_hub } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import { Drawer } from "vaul";

const client = createBrowserClient();

// Static games list for easy discovery and mocking prices
const SAMPLE_GAMES = [
  { name: "Elden Ring", genre: "Action RPG", basePrice: 59.99, currentPrice: 39.99, image: "⚔️" },
  { name: "Cyberpunk 2077", genre: "Sci-Fi RPG", basePrice: 49.99, currentPrice: 24.99, image: "🤖" },
  { name: "Hades II", genre: "Rogue-like", basePrice: 29.99, currentPrice: 29.99, image: "🔥" },
  { name: "It Takes Two", genre: "Co-op Adventure", basePrice: 39.99, currentPrice: 15.99, image: "🧩" },
  { name: "Valorant", genre: "Tactical Shooter", basePrice: 0.0, currentPrice: 0.0, image: "🎯" },
  { name: "Minecraft", genre: "Sandbox", basePrice: 26.99, currentPrice: 26.99, image: "🧱" },
  { name: "Witcher 3: Wild Hunt", genre: "Open World RPG", basePrice: 39.99, currentPrice: 9.99, image: "🐺" },
  { name: "Helldivers 2", genre: "Co-op Shooter", basePrice: 39.99, currentPrice: 39.99, image: "🚀" },
];

export default function GamingHubPage() {
  const { user, isLoaded } = useUser();

  // State Management
  const [library, setLibrary] = useState<gaming_hub.LibraryItem[]>([]);
  const [alerts, setAlerts] = useState<gaming_hub.PriceAlert[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"library" | "deals" | "coop">("library");
  const [libraryFilter, setLibraryFilter] = useState<gaming_hub.GameStatus | "all">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Forms
  const [showAddGame, setShowAddGame] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGamePlatform, setNewGamePlatform] = useState("PC");
  const [newGameStatus, setNewGameStatus] = useState<gaming_hub.GameStatus>("backlog");
  const [newGameNotes, setNewGameNotes] = useState("");
  const [newGameRating, setNewGameRating] = useState<number>(5);

  const [alertGameName, setAlertGameName] = useState("");
  const [alertPlatform, setAlertPlatform] = useState("PC");
  const [alertTargetPrice, setAlertTargetPrice] = useState(29.99);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const libRes = await client.gaming_hub.getUserLibrary({ userId: user.id });
      const alertRes = await client.gaming_hub.getPriceAlerts({ userId: user.id });

      setLibrary(libRes.items || []);
      setAlerts(alertRes.alerts || []);
    } catch (err) {
      console.error("Error fetching gaming hub data:", err);
      showToast("Veriler yüklenirken hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded, user]);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newGameName.trim()) {
      showToast("Oyun ismi boş bırakılamaz.", "error");
      return;
    }

    try {
      await client.gaming_hub.upsertLibraryItem({
        userId: user.id,
        gameName: newGameName.trim(),
        platform: newGamePlatform,
        status: newGameStatus,
        notes: newGameNotes.trim() || undefined,
        rating: newGameRating,
      });
      showToast("Oyun kütüphanenize eklendi!", "success");
      setShowAddGame(false);
      setNewGameName("");
      setNewGameNotes("");
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast("Oyun eklenirken hata oluştu.", "error");
    }
  };

  const handleAddPriceAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!alertGameName.trim()) {
      showToast("Oyun ismi girmelisiniz.", "error");
      return;
    }

    try {
      await client.gaming_hub.addPriceAlert({
        userId: user.id,
        gameName: alertGameName.trim(),
        platform: alertPlatform,
        targetPrice: alertTargetPrice,
      });
      showToast("Fiyat alarmı kuruldu!", "success");
      setAlertGameName("");
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast("Alarm eklenirken hata oluştu.", "error");
    }
  };

  const updateStatus = async (item: gaming_hub.LibraryItem, newStatus: gaming_hub.GameStatus) => {
    if (!user) return;
    try {
      await client.gaming_hub.upsertLibraryItem({
        userId: user.id,
        gameName: item.gameName,
        platform: item.platform,
        status: newStatus,
        rating: item.rating ?? undefined,
        notes: item.notes ?? undefined,
        playTime: item.playTime,
      });
      showToast("Oyun durumu güncellendi.", "success");
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast("Durum güncellenemedi.", "error");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0816]">
        <Spinner size={36} className="animate-spin text-purple-500" />
      </div>
    );
  }

  const filteredLibrary = library.filter(
    (item) => libraryFilter === "all" || item.status === libraryFilter
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0816] text-slate-100 font-sans pb-28">
      {/* Background Neon Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-900/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[40%] bg-emerald-900/15 blur-[130px] rounded-full" />
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-bold shadow-2xl transition-all animate-bounce ${
          toast.type === "success" 
            ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
            : "bg-red-950/80 border-red-500/30 text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <Warning size={18} />}
          {toast.message}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 px-4 max-w-md mx-auto w-full pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.href = getAppRootUrl(); }}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-all active:scale-90"
            >
              <ArrowLeft size={22} className="text-purple-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Gaming Hub</h1>
              <p className="text-xs text-purple-300/80 font-semibold">Sağlıklı Oyun Rehberin & Kütüphanen</p>
            </div>
          </div>

          {user && (
            <button
              onClick={() => setShowAddGame(true)}
              className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-950/50 transition-all active:scale-95"
            >
              <Plus size={16} weight="bold" />
              Oyun Ekle
            </button>
          )}
        </header>

        {/* Tab Navigation */}
        <nav className="flex bg-[#120F24]/90 border border-purple-950/40 p-1.5 rounded-2xl mb-6 shadow-lg">
          {(["library", "deals", "coop"] as const).map((tab) => {
            const labels = { library: "Kütüphane", deals: "Alarmlar", coop: "Co-Op" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all capitalize ${
                  activeTab === tab
                    ? "bg-purple-600/90 text-white shadow-md shadow-purple-900/50"
                    : "text-purple-300/60 hover:text-purple-300"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </nav>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-[#120F24]/50 border border-purple-950/30 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-purple-950/50 rounded-[2rem] flex items-center justify-center mb-6">
              <GameController size={40} className="text-purple-400" />
            </div>
            <h2 className="font-extrabold text-lg text-white mb-2">Oturum Açmalısınız</h2>
            <p className="text-purple-300/70 text-xs leading-relaxed max-w-[260px]">
              Oyunlarınızı takip etmek, sağlıklı limitler koymak ve fiyat alarmlarını kullanmak için oturum açın.
            </p>
          </div>
        ) : (
          <>
            {/* 1. LIBRARY TAB */}
            {activeTab === "library" && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(["all", "playing", "backlog", "completed", "wishlist"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setLibraryFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 transition-all ${
                        libraryFilter === st
                          ? "bg-purple-600 text-white"
                          : "bg-purple-950/30 text-purple-300 border border-purple-950/40 hover:bg-purple-900/20"
                      }`}
                    >
                      {st === "all" ? "Tümü" : st === "playing" ? "Oynanıyor" : st === "backlog" ? "Kitaplık" : st === "completed" ? "Bitmiş" : "İstek Listesi"}
                    </button>
                  ))}
                </div>

                {filteredLibrary.length === 0 ? (
                  <div className="text-center py-16 bg-[#120F24]/40 rounded-3xl border border-purple-950/20">
                    <GameController size={40} className="text-purple-600/40 mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-purple-300/80">Kayıt Bulunamadı</h3>
                    <p className="text-xs text-purple-400/50 max-w-[200px] mx-auto mt-1">
                      Kütüphanene henüz bu filtrede bir oyun eklememişsin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLibrary.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-[#120F24]/90 border border-purple-950/30 rounded-2xl shadow-xl flex flex-col gap-3 group hover:border-purple-600/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 bg-purple-950/50 px-2 py-0.5 rounded-md">
                              {item.platform}
                            </span>
                            <h3 className="font-extrabold text-base text-white mt-1.5 group-hover:text-purple-300 transition-colors">
                              {item.gameName}
                            </h3>
                          </div>
                          
                          {/* Rating display */}
                          {item.rating && (
                            <div className="flex items-center gap-0.5 text-amber-400 bg-amber-400/5 px-2 py-1 rounded-xl">
                              <Star size={12} weight="fill" />
                              <span className="text-[10px] font-black">{item.rating}</span>
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-purple-300/70 italic bg-purple-950/20 p-2.5 rounded-xl border border-purple-950/30">
                            "{item.notes}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-purple-950/20 text-xs text-purple-300/60">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-purple-400" />
                            <span>{Math.round(item.playTime / 60 * 10) / 10} saat</span>
                          </div>

                          {/* Quick Status Updater */}
                          <div className="flex gap-1">
                            {(["playing", "completed", "backlog"] as const).map((s) => (
                              <button
                                key={s}
                                onClick={() => updateStatus(item, s)}
                                className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                                  item.status === s
                                    ? "bg-purple-600/90 text-white"
                                    : "bg-purple-950/40 hover:bg-purple-950/70 text-purple-400/80"
                                }`}
                              >
                                {s === "playing" ? "Oyna" : s === "completed" ? "Bitir" : "Kütüphane"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* 3. DEALS TAB (Price Alerts & Discovery) */}
            {activeTab === "deals" && (
              <div className="space-y-6">
                {/* Add new alert */}
                <form onSubmit={handleAddPriceAlert} className="p-5 bg-[#120F24]/90 border border-purple-950/30 rounded-2xl space-y-4">
                  <h3 className="font-extrabold text-sm text-white">Yeni Fiyat Takip Alarmı Kur</h3>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={alertGameName}
                      onChange={(e) => setAlertGameName(e.target.value)}
                      placeholder="Oyun Adı (örn: Hades II)"
                      className="w-full bg-white/5 border border-purple-950 rounded-xl px-4 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-600 transition-colors font-medium"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={alertPlatform}
                        onChange={(e) => setAlertPlatform(e.target.value)}
                        className="bg-white/5 border border-purple-950 rounded-xl px-3 py-2 text-xs text-purple-300 focus:outline-none"
                      >
                        <option value="PC" className="bg-[#120F24]">PC (Steam)</option>
                        <option value="PS5" className="bg-[#120F24]">PS5 Store</option>
                        <option value="Xbox" className="bg-[#120F24]">Xbox Live</option>
                        <option value="Switch" className="bg-[#120F24]">Switch eShop</option>
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        value={alertTargetPrice}
                        onChange={(e) => setAlertTargetPrice(parseFloat(e.target.value))}
                        placeholder="Hedef Fiyat ($)"
                        className="bg-white/5 border border-purple-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950 transition-all active:scale-95"
                  >
                    Alarm Kur
                  </button>
                </form>

                {/* Active Alerts */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xs text-purple-300 uppercase tracking-widest">AKTiF ALARMLARIN</h3>
                  {alerts.length === 0 ? (
                    <div className="text-center py-10 bg-[#120F24]/20 border border-purple-950/20 rounded-2xl">
                      <p className="text-xs text-purple-400/50">Henüz fiyat alarmı kurulmamış.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alerts.map((al) => (
                        <div
                          key={al.id}
                          className="p-4 bg-[#120F24]/50 border border-purple-950/20 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-extrabold text-sm text-white">{al.gameName}</h4>
                            <span className="text-[9px] text-purple-400 uppercase tracking-wider font-bold bg-purple-950/50 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                              {al.platform}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-purple-400/60 block">Hedef: ${al.targetPrice}</span>
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                              <TrendDown size={14} />
                              Takipte
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. COOP MATCHMAKING TAB */}
            {activeTab === "coop" && (
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-purple-900/30 to-indigo-950/20 border border-purple-900/30 rounded-3xl relative overflow-hidden">
                  <div className="absolute right-[-10%] bottom-[-10%] w-36 h-36 bg-purple-600/10 blur-[40px] rounded-full" />
                  <Sparkle size={28} className="text-purple-400 mb-3" />
                  <h3 className="font-black text-lg text-white">Co-op Oyun Keşfi</h3>
                  <p className="text-xs text-purple-300/80 leading-relaxed mt-1">
                    Arkadaşlarınla beraber ya da yeni bir lobiye katılarak oynayabileceğin popüler multiplayer oyunlara hemen göz at:
                  </p>
                </div>

                <div className="space-y-2.5">
                  {SAMPLE_GAMES.map((game, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-[#120F24]/80 border border-purple-950/20 rounded-2xl flex items-center justify-between hover:border-purple-600/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-purple-950/50 w-11 h-11 flex items-center justify-center rounded-xl">{game.image}</span>
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">{game.name}</h4>
                          <span className="text-[10px] text-purple-400/60 font-semibold">{game.genre}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {game.currentPrice === 0 ? (
                          <span className="text-xs font-black text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-xl">Ücretsiz</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {game.currentPrice < game.basePrice && (
                              <span className="text-[9px] line-through text-purple-500">${game.basePrice}</span>
                            )}
                            <span className="text-xs font-black text-white">${game.currentPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* DRAWER: ADD GAME */}
      <Drawer.Root open={showAddGame} onOpenChange={setShowAddGame}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#120F24] rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85dvh] outline-none z-[70] max-w-md mx-auto border-t border-purple-900/40 shadow-2xl flex flex-col text-slate-100">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-purple-950 mb-5" />

              <header className="flex justify-between items-center mb-6">
                <Drawer.Title className="font-black text-lg text-white">Yeni Oyun Ekle</Drawer.Title>
                <button onClick={() => setShowAddGame(false)} className="p-1 text-purple-400 hover:bg-white/5 rounded-full">
                  <X size={20} />
                </button>
              </header>

              <form onSubmit={handleAddGame} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-purple-300/80 uppercase block">Oyun İsmi</label>
                  <input
                    type="text"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    placeholder="Örn: Elden Ring"
                    className="w-full bg-white/5 border border-purple-950 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-purple-300/80 uppercase block">Platform</label>
                    <select
                      value={newGamePlatform}
                      onChange={(e) => setNewGamePlatform(e.target.value)}
                      className="w-full bg-white/5 border border-purple-950 rounded-xl px-3 py-2.5 text-xs text-purple-300 focus:outline-none"
                    >
                      <option value="PC" className="bg-[#120F24]">PC</option>
                      <option value="PS5" className="bg-[#120F24]">PS5</option>
                      <option value="Xbox" className="bg-[#120F24]">Xbox</option>
                      <option value="Switch" className="bg-[#120F24]">Nintendo Switch</option>
                      <option value="Mobile" className="bg-[#120F24]">Mobile</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-purple-300/80 uppercase block">Durum</label>
                    <select
                      value={newGameStatus}
                      onChange={(e) => setNewGameStatus(e.target.value as gaming_hub.GameStatus)}
                      className="w-full bg-white/5 border border-purple-950 rounded-xl px-3 py-2.5 text-xs text-purple-300 focus:outline-none"
                    >
                      <option value="playing" className="bg-[#120F24]">Oynanıyor</option>
                      <option value="backlog" className="bg-[#120F24]">Kitaplık (Backlog)</option>
                      <option value="completed" className="bg-[#120F24]">Bitirildi</option>
                      <option value="wishlist" className="bg-[#120F24]">İstek Listesi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-purple-300/80 uppercase block">Puanım</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewGameRating(val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                          newGameRating === val
                            ? "bg-amber-500 text-[#0B0816] shadow-lg shadow-amber-500/20"
                            : "bg-white/5 text-slate-400 border border-purple-950/20"
                        }`}
                      >
                        {val} ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-purple-300/80 uppercase block">Notlar (İsteğe Bağlı)</label>
                  <textarea
                    value={newGameNotes}
                    onChange={(e) => setNewGameNotes(e.target.value)}
                    placeholder="Bu oyun hakkında düşünceleriniz..."
                    className="w-full bg-white/5 border border-purple-950 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-600 h-20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Kütüphaneye Ekle
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>


    </div>
  );
}
