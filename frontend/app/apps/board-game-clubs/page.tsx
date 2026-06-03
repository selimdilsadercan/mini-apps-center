"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { 
  Plus, 
  GameController, 
  MapPin, 
  Users, 
  CaretRight, 
  CircleNotch,
  ArrowLeft,
  BookOpen,
  TreeEvergreen
} from "@phosphor-icons/react";
import { 
  getOrCreateUserAction, 
  getUserClubsAction, 
  createClubAction 
} from "./actions";
import type { board_game_clubs, lib } from "@/lib/client";
import { getRootHomeUrl } from "@/lib/apps";

export default function BoardGameClubsPage() {
  const router = useRouter();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [dbUser, setDbUser] = useState<lib.User | null>(null);
  
  const [clubs, setClubs] = useState<board_game_clubs.Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Club Creation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubLogo, setNewClubLogo] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isClerkLoaded && user) {
      initUser();
    } else if (isClerkLoaded && !user) {
      setLoading(false);
      setError("Giriş yapmanız gerekiyor.");
    }
  }, [user, isClerkLoaded]);

  async function initUser() {
    if (!user) return;
    try {
      setLoading(true);
      const userRes = await getOrCreateUserAction(user.id);
      if (userRes.error || !userRes.data) {
        setError(userRes.error || "Kullanıcı kaydı alınamadı.");
        setLoading(false);
        return;
      }
      setDbUser(userRes.data);
      
      const clubsRes = await getUserClubsAction(userRes.data.id);
      if (clubsRes.data) {
        setClubs(clubsRes.data);
      } else {
        setError(clubsRes.error || "Kulüpler yüklenemedi.");
      }
    } catch (err) {
      console.error(err);
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateClub(e: React.FormEvent) {
    e.preventDefault();
    if (!dbUser || !newClubName.trim()) return;

    try {
      setCreating(true);
      const res = await createClubAction({
        name: newClubName.trim(),
        description: newClubDesc.trim() || undefined,
        logoUrl: newClubLogo.trim() || undefined,
        ownerId: dbUser.id,
      });

      if (res.error || !res.data) {
        alert(res.error || "Kulüp oluşturulurken bir hata oluştu.");
      } else {
        setClubs((prev) => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)));
        setIsModalOpen(false);
        setNewClubName("");
        setNewClubDesc("");
        setNewClubLogo("");
        
        // Redirect directly to the newly created club's library!
        router.push(`/apps/board-game-clubs/${res.data.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Hata oluştu.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfbf7] text-stone-800">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-200/50 blur-xl animate-pulse" />
            <CircleNotch size={44} className="animate-spin text-amber-700 relative" />
          </div>
          <p className="text-stone-600 font-medium text-sm tracking-wide">Kütüphaneler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-stone-850 bg-[#fbf9f4] flex flex-col relative overflow-x-hidden">
      {/* Background patterns for light cream/tabletop feel */}
      <div className="fixed inset-0 bg-[#fbf9f4] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(#8b735510_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,115,85,0.06),transparent_70%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-[#e8e4d9] px-6 py-4 flex items-center justify-between shadow-sm shadow-[#8b735504]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              window.location.href = getRootHomeUrl();
            }}
            className="p-2 hover:bg-stone-200/50 rounded-xl text-stone-500 hover:text-stone-850 transition-all duration-300 border border-transparent hover:border-stone-300/40"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-amber-500/10 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 p-2.5 rounded-xl text-white shadow-md shadow-amber-900/10">
                <GameController size={22} weight="fill" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-stone-800">
                Board Game Clubs
              </h1>
              <p className="text-[10px] text-stone-500 font-bold tracking-wider uppercase">
                Oyun Kafeleri & Kulüp Kütüphaneleri
              </p>
            </div>
          </div>
        </div>

        {dbUser && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 bg-amber-700 hover:bg-amber-600 active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-amber-850/10 text-sm"
          >
            <Plus size={18} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Kulüp Ekle</span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 relative z-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            {error}
          </div>
        )}

        {clubs.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center py-24 px-6 border border-dashed border-[#e6e1d4] rounded-3xl bg-white/40 backdrop-blur-sm relative overflow-hidden">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/5 blur-xl" />
              <div className="relative bg-white border border-[#e6e1d4] p-6 rounded-2xl shadow-sm">
                <GameController size={48} weight="duotone" className="text-amber-700/60" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-stone-850">
              Henüz Bir Kulüp Yok
            </h3>
            <p className="text-stone-500 text-sm max-w-sm mt-3 mb-8 leading-relaxed">
              Kendi oyun kulübünüzü veya kafe kütüphanenizi oluşturarak oyunlarınızı düzenlemeye ve BGG'den import etmeye hemen başlayın.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2.5 bg-white hover:bg-stone-50 border border-[#e6e1d4] hover:border-amber-600/30 px-6 py-3.5 rounded-xl text-stone-700 hover:text-amber-800 font-semibold transition-all duration-300 shadow-sm"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>İlk Kulübünü Oluştur</span>
            </button>
          </div>
        ) : (
          /* Clubs List */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TreeEvergreen size={18} className="text-stone-500" />
                <h2 className="text-lg font-bold text-stone-800">Kulüpleriniz</h2>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 bg-white border border-[#e8e4d9] rounded-full text-stone-600 tracking-wider shadow-sm">
                {clubs.length} Kulüp
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clubs.map((club, index) => (
                <div
                  key={club.id}
                  onClick={() => router.push(`/apps/board-game-clubs/${club.id}`)}
                  className="group relative bg-white hover:bg-white border border-[#e8e4d9] hover:border-amber-600/40 rounded-2xl p-5 cursor-pointer transition-all duration-500 shadow-sm hover:shadow-md shadow-black/[0.02]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-start gap-4 relative">
                    {club.logo_url ? (
                      <img
                        src={club.logo_url}
                        alt={club.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#e8e4d9] shadow-inner group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center transition-all duration-300 group-hover:bg-amber-50">
                        <Users size={26} weight="duotone" className="text-stone-400 group-hover:text-amber-700/70 transition-colors duration-300" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-800 group-hover:text-amber-800 transition-colors duration-300 text-[15px] truncate">
                        {club.name}
                      </h3>
                      <p className="text-xs text-stone-500 group-hover:text-stone-600 mt-1.5 line-clamp-2 leading-relaxed transition-colors duration-300">
                        {club.description || "Açıklama belirtilmemiş."}
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-amber-700/60 text-[11px] mt-3 font-semibold transition-colors duration-300">
                        <MapPin size={12} />
                        <span>Koleksiyonu yönetmek için tıklayın</span>
                      </div>
                    </div>

                    <div className="text-stone-400 group-hover:text-amber-700 self-center transition-all duration-300 group-hover:translate-x-1">
                      <CaretRight size={20} weight="bold" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL — Club Creation */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white border border-[#e8e4d9] rounded-3xl p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <h3 className="text-lg font-bold text-stone-800 mb-1">
                Yeni Kulüp Oluştur
              </h3>
              <p className="text-xs text-stone-500 mb-6">
                Oyun kütüphanenizi barındıracak yeni bir profil ekleyin.
              </p>

              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-2 tracking-wide uppercase">
                    Kulüp / Kafe Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    placeholder="örn: İTÜ Kutu Oyunları Kulübü"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-2 tracking-wide uppercase">
                    Açıklama (İsteğe Bağlı)
                  </label>
                  <textarea
                    value={newClubDesc}
                    onChange={(e) => setNewClubDesc(e.target.value)}
                    placeholder="Kulüp veya lokasyon hakkında kısa detaylar..."
                    rows={3}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-2 tracking-wide uppercase">
                    Logo Görsel URL'si (İsteğe Bağlı)
                  </label>
                  <input
                    type="url"
                    value={newClubLogo}
                    onChange={(e) => setNewClubLogo(e.target.value)}
                    placeholder="https://example.com/logo.jpg"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-stone-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200/70 border border-stone-200 rounded-xl text-stone-600 hover:text-stone-850 transition-all text-xs font-semibold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 disabled:bg-amber-700/50 text-white px-6 py-2.5 rounded-xl font-bold transition-all text-xs shadow-md"
                  >
                    {creating && <CircleNotch size={14} className="animate-spin" />}
                    <span>{creating ? "Oluşturuluyor..." : "Oluştur"}</span>
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
