"use client";

import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  Plus,
  X,
  Spinner,
  GameController,
  DeviceMobile,
  Desktop,
  PlusCircle,
  Trash,
  UserPlus,
  Clock,
  Users,
  ChatCircle,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { esles, friendship } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import { Drawer } from "vaul";

const client = createBrowserClient();

const PLATFORMS: { id: esles.Platform; label: string; emoji: string }[] = [
  { id: "PC", label: "PC", emoji: "🖥️" },
  { id: "PS", label: "PlayStation", emoji: "🎮" },
  { id: "Xbox", label: "Xbox", emoji: "🟢" },
  { id: "Mobile", label: "Mobil", emoji: "📱" },
  { id: "Switch", label: "Switch", emoji: "🕹️" },
  { id: "Diğer", label: "Diğer", emoji: "🎲" },
];

const PLAYER_COUNTS = [1, 2, 3, 4, 5, 6, 8, 10];

function formatRelativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

function EslesContent() {
  const { user, isLoaded } = useUser();

  const [posts, setPosts] = useState<esles.EslesPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Create drawer
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [gameName, setGameName] = useState("");
  const [platform, setPlatform] = useState<esles.Platform>("PC");
  const [playerCount, setPlayerCount] = useState(1);
  const [description, setDescription] = useState("");
  const [rankInfo, setRankInfo] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Detail popup
  const [selectedPost, setSelectedPost] = useState<esles.EslesPost | null>(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await client.esles.getPosts({});
      setPosts(res.posts);
    } catch (err) {
      console.error(err);
      showToast("İlanlar yüklenirken hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchPosts();
    }
  }, [isLoaded]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!gameName.trim() || !description.trim()) {
      showToast("Oyun adı ve açıklama gerekli.", "error");
      return;
    }

    try {
      setCreateLoading(true);
      await client.esles.createPost({
        creatorId: user.id,
        gameName: gameName.trim(),
        platform,
        playerCount,
        description: description.trim(),
        rankInfo: rankInfo.trim() || undefined,
        scheduledTime: scheduledTime.trim() || undefined,
      });

      showToast("İlan başarıyla oluşturuldu!", "success");
      setShowCreate(false);
      setGameName("");
      setDescription("");
      setRankInfo("");
      setScheduledTime("");
      setPlatform("PC");
      setPlayerCount(1);
      await fetchPosts();
    } catch (err) {
      console.error(err);
      showToast("İlan oluşturulamadı.", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    if (!confirm("Bu ilanı silmek istediğine emin misin?")) return;
    try {
      await client.esles.deletePost({ postId, userId: user.id });
      showToast("İlan silindi.", "success");
      setSelectedPost(null);
      await fetchPosts();
    } catch (err) {
      console.error(err);
      showToast("İlan silinemedi.", "error");
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    if (!user) {
      showToast("Arkadaş eklemek için giriş yapmalısın.", "error");
      return;
    }
    try {
      setFriendRequestLoading(true);
      await client.friendship.sendRequest({ senderId: user.id, receiverId });
      setSentRequests((prev) => new Set(prev).add(receiverId));
      showToast("Arkadaşlık isteği gönderildi!", "success");
    } catch (err) {
      console.error(err);
      showToast("İstek gönderilemedi.", "error");
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const openDetail = (post: esles.EslesPost) => setSelectedPost(post);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0A1E]">
        <Spinner size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0F0A1E] text-white pb-24">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-violet-900/30 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-900/25 blur-[140px] rounded-full" />
      </div>

      <main className="flex-1 px-4 max-w-md mx-auto w-full pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.href = getAppRootUrl(); }}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
            >
              <ArrowLeft size={24} color="white" />
            </button>
            <div>
              <h1 className="text-2xl font-[900] tracking-tight leading-none">Eşleş</h1>
              <p className="text-xs text-violet-300 font-medium mt-0.5">Online oyun arkadaşı bul</p>
            </div>
          </div>

          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-violet-900/50 transition-all active:scale-95"
            >
              <Plus size={16} weight="bold" />
              İlan Aç
            </button>
          )}
        </header>

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="animate-spin text-violet-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-violet-900/40 rounded-[2rem] flex items-center justify-center mb-6">
              <GameController size={36} weight="duotone" className="text-violet-400" />
            </div>
            <h2 className="font-extrabold text-lg text-white mb-2">Henüz İlan Yok</h2>
            <p className="text-violet-300 text-xs leading-relaxed max-w-[260px] mb-8">
              İlk oyun eşleşme ilanını sen oluştur ve takım arkadaşı bul!
            </p>
            {user && (
              <button
                onClick={() => setShowCreate(true)}
                className="py-3.5 px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                İlk İlanı Oluştur
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id ?? null}
                onOpenDetail={openDetail}
              />
            ))}
          </div>
        )}
      </main>

      {/* CREATE DRAWER */}
      <Drawer.Root open={showCreate} onOpenChange={setShowCreate}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#1A1230] rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-violet-800/40 shadow-2xl flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-violet-700/50 mb-5" />

              <header className="flex justify-between items-center mb-6 shrink-0">
                <Drawer.Title className="font-black text-xl text-white">Oyun İlanı Oluştur</Drawer.Title>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                >
                  <X size={20} weight="bold" />
                </button>
              </header>

              <form onSubmit={handleCreatePost} className="flex-1 overflow-y-auto space-y-5 pr-0.5">
                {/* Oyun Adı */}
                <div className="space-y-2">
                  <label className="font-extrabold text-[10px] text-violet-300 uppercase tracking-wider block">
                    Oyun Adı *
                  </label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="Örn: Valorant, FIFA 25, League of Legends..."
                    className="w-full bg-white/5 border border-violet-700/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-violet-400/60 focus:outline-none focus:border-violet-500 transition-colors font-medium"
                  />
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <label className="font-extrabold text-[10px] text-violet-300 uppercase tracking-wider block">
                    Platform *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          platform === p.id
                            ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-900/50"
                            : "bg-white/5 border-violet-700/30 text-violet-300 hover:bg-white/10"
                        }`}
                      >
                        {p.emoji} {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Oyuncu Sayısı */}
                <div className="space-y-2">
                  <label className="font-extrabold text-[10px] text-violet-300 uppercase tracking-wider block">
                    Aranan Oyuncu Sayısı *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLAYER_COUNTS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPlayerCount(n)}
                        className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          playerCount === n
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-white/5 border-violet-700/30 text-violet-300 hover:bg-white/10"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Açıklama */}
                <div className="space-y-2">
                  <label className="font-extrabold text-[10px] text-violet-300 uppercase tracking-wider block">
                    Açıklama *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Hangi mod, nasıl bir oyuncu arıyorsun? Biraz anlat..."
                    rows={3}
                    className="w-full bg-white/5 border border-violet-700/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-violet-400/60 focus:outline-none focus:border-violet-500 transition-colors font-medium resize-none"
                  />
                </div>

                {/* Rank (opsiyonel) */}
                <div className="space-y-2">
                  <label className="font-extrabold text-[10px] text-violet-300 uppercase tracking-wider block">
                    Rank / Seviye <span className="text-violet-500 normal-case font-medium">(opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={rankInfo}
                    onChange={(e) => setRankInfo(e.target.value)}
                    placeholder="Örn: Gold 2, Platin, 1200 ELO..."
                    className="w-full bg-white/5 border border-violet-700/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-violet-400/60 focus:outline-none focus:border-violet-500 transition-colors font-medium"
                  />
                </div>

                {/* Zaman (opsiyonel) */}
                <div className="space-y-2">
                  <label className="font-extrabold text-[10px] text-violet-300 uppercase tracking-wider block">
                    Oynama Zamanı <span className="text-violet-500 normal-case font-medium">(opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="Örn: Akşam 21:00, Hafta sonu öğleden sonra..."
                    className="w-full bg-white/5 border border-violet-700/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-violet-400/60 focus:outline-none focus:border-violet-500 transition-colors font-medium"
                  />
                </div>

                <div className="pt-2 pb-4 shrink-0">
                  <button
                    type="submit"
                    disabled={createLoading || !gameName.trim() || !description.trim()}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-900/50"
                  >
                    {createLoading ? <Spinner size={18} className="animate-spin" /> : "İlanı Yayınla"}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* DETAIL POPUP */}
      <Drawer.Root open={!!selectedPost} onOpenChange={(open) => { if (!open) setSelectedPost(null); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#1A1230] rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-violet-800/40 shadow-2xl flex flex-col">
            {selectedPost && (
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-violet-700/50" />

                <header className="flex justify-between items-center shrink-0">
                  <Drawer.Title className="font-black text-xl text-white">İlan Detayı</Drawer.Title>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </header>

                {/* Creator */}
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-violet-700/30">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-violet-800/50 flex items-center justify-center shrink-0 text-lg">
                    {selectedPost.creatorAvatar
                      ? <img src={selectedPost.creatorAvatar} alt="" className="w-full h-full object-cover" />
                      : "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-white truncate">
                      {selectedPost.creatorId === user?.id
                        ? "Ben"
                        : selectedPost.creatorUsername || "Oyuncu"}
                    </p>
                    <p className="text-[11px] text-violet-400 font-medium mt-0.5">
                      {formatRelativeTime(selectedPost.createdAt)}
                    </p>
                  </div>

                  {/* Arkadaş ekle butonu — kendi ilanın değilse göster */}
                  {user && selectedPost.creatorId !== user.id && (
                    <button
                      onClick={() => handleSendFriendRequest(selectedPost.creatorId)}
                      disabled={friendRequestLoading || sentRequests.has(selectedPost.creatorId)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl font-bold text-xs transition-all active:scale-95 shrink-0"
                    >
                      <UserPlus size={14} weight="bold" />
                      {sentRequests.has(selectedPost.creatorId) ? "Gönderildi" : "Arkadaş Ekle"}
                    </button>
                  )}
                </div>

                {/* Game info */}
                <div className="bg-violet-900/30 rounded-2xl border border-violet-700/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black text-xl text-white leading-tight">{selectedPost.gameName}</h2>
                    <span className="text-sm font-bold px-3 py-1 rounded-xl bg-violet-700/40 text-violet-200">
                      {PLATFORMS.find((p) => p.id === selectedPost.platform)?.emoji}{" "}
                      {selectedPost.platform}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Aranan Oyuncu</span>
                      <span className="font-extrabold text-white text-lg">{selectedPost.playerCount} kişi</span>
                    </div>
                    {selectedPost.rankInfo && (
                      <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Rank / Seviye</span>
                        <span className="font-extrabold text-white text-base">{selectedPost.rankInfo}</span>
                      </div>
                    )}
                    {selectedPost.scheduledTime && (
                      <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1 col-span-2">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock size={11} /> Zaman
                        </span>
                        <span className="font-bold text-violet-200 text-sm">{selectedPost.scheduledTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider block">Açıklama</span>
                    <p className="text-sm text-violet-100 leading-relaxed font-medium">{selectedPost.description}</p>
                  </div>
                </div>

                {/* İletişim notu */}
                {user && selectedPost.creatorId !== user.id && (
                  <div className="bg-indigo-900/30 border border-indigo-700/30 rounded-2xl p-4 flex items-start gap-3">
                    <ChatCircle size={20} className="text-indigo-400 shrink-0 mt-0.5" weight="duotone" />
                    <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                      İlan sahibiyle iletişime geçmek için <strong>Arkadaş Ekle</strong> butonuna tıkla. İstek kabul edilince mesajlaşabilirsiniz.
                    </p>
                  </div>
                )}

                {/* Sil — kendi ilanın */}
                {user && selectedPost.creatorId === user.id && (
                  <button
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="w-full py-3.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/40 text-red-400 rounded-2xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash size={14} weight="bold" />
                    İlanı Sil
                  </button>
                )}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-4 rounded-2xl border text-sm font-bold shadow-lg flex items-center justify-center text-center ${
            toast.type === "success"
              ? "bg-emerald-900/80 text-emerald-300 border-emerald-700/50"
              : "bg-red-900/80 text-red-300 border-red-700/50"
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: esles.EslesPost;
  currentUserId: string | null;
  onOpenDetail: (post: esles.EslesPost) => void;
}

function PostCard({ post, currentUserId, onOpenDetail }: PostCardProps) {
  const platformData = PLATFORMS.find((p) => p.id === post.platform);

  return (
    <button
      onClick={() => onOpenDetail(post)}
      className="w-full text-left bg-white/5 hover:bg-white/8 border border-violet-800/30 rounded-[1.75rem] p-4 transition-all active:scale-[0.98] group"
    >
      {/* Top row: avatar + name + platform badge */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-violet-800/40 flex items-center justify-center shrink-0 text-base">
          {post.creatorAvatar
            ? <img src={post.creatorAvatar} alt="" className="w-full h-full object-cover" />
            : "👤"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm text-white truncate">
            {post.creatorId === currentUserId ? "Ben" : post.creatorUsername || "Oyuncu"}
          </p>
          <p className="text-[10px] text-violet-400 font-medium">{formatRelativeTime(post.createdAt)}</p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-violet-900/60 text-violet-300 border border-violet-700/40 shrink-0">
          {platformData?.emoji} {post.platform}
        </span>
      </div>

      {/* Game name */}
      <p className="font-black text-base text-white mb-1 truncate">{post.gameName}</p>

      {/* Description (truncated) */}
      <p className="text-xs text-violet-300 font-medium leading-relaxed mb-3 line-clamp-2">{post.description}</p>

      {/* Footer chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-900/50 text-violet-300">
          <Users size={11} /> {post.playerCount} oyuncu aranıyor
        </span>
        {post.rankInfo && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-yellow-900/30 text-yellow-300 border border-yellow-700/30">
            {post.rankInfo}
          </span>
        )}
        {post.scheduledTime && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-900/30 text-blue-300">
            <Clock size={11} /> {post.scheduledTime}
          </span>
        )}
        <span className="ml-auto text-[10px] font-black text-violet-500 group-hover:text-violet-300 transition-colors uppercase tracking-wider">
          Detay →
        </span>
      </div>
    </button>
  );
}

export default function EslesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0F0A1E]">
        <Spinner size={32} className="animate-spin text-violet-400" />
      </div>
    }>
      <EslesContent />
    </Suspense>
  );
}
