"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  Plus,
  MapPin,
  InstagramLogo,
  ArrowSquareOut,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  Heart,
  X,
} from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import { useShareIntent } from "@/lib/use-share-intent";
import {
  getUserBookmarksAction,
  getOrCreateUserAction,
  deleteBookmarkAction,
  updateBookmarkAction,
} from "./actions";
import AddBookmarkDrawer from "./components/AddBookmarkDrawer";
import toast from "react-hot-toast";

export default function BookmarksPage() {
  const { user, isLoaded } = useUser();

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"all" | "to_visit" | "visited">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<any | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Instagram share intent
  const sharedText = useShareIntent();
  useEffect(() => {
    if (sharedText && sharedText.includes("instagram.com") && dbUserId) {
      setEditingBookmark(null);
      setShowAddDrawer(true);
    }
  }, [sharedText, dbUserId]);

  const fetchBookmarks = async (targetUserId: string) => {
    try {
      setLoading(true);
      const res = await getUserBookmarksAction(targetUserId);
      if (res.data) {
        setBookmarks(res.data.filter((b: any) => b.category === "Mekan"));
      } else {
        setError(res.error || "İçerikler yüklenemedi");
      }
    } catch (err) {
      console.error(err);
      setError("Bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    const loadUser = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const userRes = await getOrCreateUserAction(user.id);
        if (userRes.data?.id) {
          setDbUserId(userRes.data.id);
          await fetchBookmarks(userRes.data.id);
        } else {
          setError(userRes.error || "Kullanıcı bilgisi alınamadı");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("Kullanıcı doğrulanırken hata oluştu.");
        setLoading(false);
      }
    };
    loadUser();
  }, [user, isLoaded]);

  const handleToggleFavorite = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!dbUserId) return;
    try {
      const nextFavorite = !item.is_favorite;
      const res = await updateBookmarkAction({
        bookmarkId: item.id,
        userId: dbUserId,
        title: item.title,
        description: item.description,
        url: item.url,
        imageUrl: item.image_url,
        category: "Mekan",
        instagramUsername: item.instagram_username,
        isVisited: item.is_visited || false,
        isFavorite: nextFavorite,
      });
      if (res.data) {
        setBookmarks(prev => prev.map(b => b.id === item.id ? res.data : b));
        if (selectedBookmark?.id === item.id) setSelectedBookmark(res.data);
        toast.success(nextFavorite ? "Favorilere eklendi!" : "Favorilerden çıkarıldı");
      }
    } catch (err) {
      toast.error("İşlem başarısız oldu.");
    }
  };

  const handleToggleVisited = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!dbUserId) return;
    try {
      const nextVisited = !item.is_visited;
      const res = await updateBookmarkAction({
        bookmarkId: item.id,
        userId: dbUserId,
        title: item.title,
        description: item.description,
        url: item.url,
        imageUrl: item.image_url,
        category: "Mekan",
        instagramUsername: item.instagram_username,
        isVisited: nextVisited,
        isFavorite: item.is_favorite || false,
      });
      if (res.data) {
        setBookmarks(prev => prev.map(b => b.id === item.id ? res.data : b));
        if (selectedBookmark?.id === item.id) setSelectedBookmark(res.data);
        toast.success(nextVisited ? "Gidildi olarak işaretlendi! ✅" : "Gitmedim olarak güncellendi");
      }
    } catch (err) {
      toast.error("İşlem başarısız oldu.");
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    if (!dbUserId) return;
    if (!window.confirm("Bu mekanı silmek istediğinizden emin misiniz?")) return;
    try {
      setIsDeleting(true);
      const res = await deleteBookmarkAction(bookmarkId, dbUserId);
      if (res.data) {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
        toast.success("Mekan silindi.");
        setSelectedBookmark(null);
      } else {
        toast.error(res.error || "Silme işlemi başarısız oldu.");
      }
    } catch (err) {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(item => {
      if (activeTab === "to_visit" && item.is_visited) return false;
      if (activeTab === "visited" && !item.is_visited) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) ||
          (item.description?.toLowerCase().includes(q) ?? false) ||
          (item.instagram_username?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [bookmarks, activeTab, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text">

      {/* 🐛 DEBUG PANEL — geçici */}
      <div className="fixed bottom-20 left-2 right-2 z-[999] bg-black/80 backdrop-blur-sm rounded-2xl p-3 text-[9px] font-mono text-white space-y-0.5 border border-white/10">
        <p className="font-black text-[10px] text-yellow-400 mb-1">🐛 DEBUG</p>
        <p>sharedText: <span className="text-green-400">{sharedText ?? "null"}</span></p>
        <p>dbUserId: <span className="text-green-400">{dbUserId ?? "null"}</span></p>
        <p>showAddDrawer: <span className="text-green-400">{showAddDrawer ? "true" : "false"}</span></p>
        <p>user: <span className="text-green-400">{user?.id?.slice(0, 12) ?? "null"}</span></p>
        <button
          onClick={() => { setEditingBookmark(null); setShowAddDrawer(true); }}
          className="mt-1.5 w-full py-1 bg-rose-500 rounded-lg text-[9px] font-black uppercase tracking-wider"
        >
          Force Open Drawer
        </button>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-app-surface/95 backdrop-blur-md border-b border-app-border shadow-xs">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { window.location.href = getAppRootUrl(); }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-rose-500" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5 select-none">
              <MapPin size={18} weight="fill" className="text-rose-500 shrink-0" />
              <span className="truncate">
                Gitmek <span className="text-rose-500">İstediklerim</span>
              </span>
            </h1>

            {user && dbUserId && (
              <button
                onClick={() => { setEditingBookmark(null); setShowAddDrawer(true); }}
                className="shrink-0 flex items-center justify-center w-8 h-8 text-rose-500 hover:text-rose-600 transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
              >
                <Plus size={16} weight="bold" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track mt-2.5 shrink-0">
            {([
              { key: "all", label: "Tümü" },
              { key: "to_visit", label: "Gitmedim" },
              { key: "visited", label: "Gittim" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                  activeTab === key ? "bg-app-tab-active text-app-text shadow-xs" : "text-app-muted hover:text-app-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 pt-4 pb-16 max-w-xl mx-auto w-full">
        {!user ? (
          <div className="text-center py-20 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-xs select-none">
            <MapPin size={48} className="text-app-muted mb-4" weight="duotone" />
            <h3 className="text-sm font-bold text-app-text mb-2">Giriş Yapmalısın</h3>
            <p className="text-xs text-app-muted">Mekan koleksiyonunu görmek için giriş yapın.</p>
          </div>
        ) : loading ? (
          <div className="space-y-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-app-surface rounded-2xl border border-app-border animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 text-center">
            <p className="text-red-500 text-xs font-bold">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mekan ara..."
                className="w-full pl-9 pr-4 py-3 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs placeholder:text-app-muted shadow-xs"
              />
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            </div>

            {/* List */}
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-16 bg-app-surface rounded-2xl border border-app-border shadow-xs p-6 select-none">
                <MapPin size={36} className="text-app-muted mx-auto mb-3" weight="duotone" />
                <p className="text-xs font-bold text-app-muted mb-4">
                  {activeTab === "visited" ? "Henüz gittiğin yer yok" : activeTab === "to_visit" ? "Gitmek istediğin yer yok" : "Koleksiyonun boş"}
                </p>
                {dbUserId && (
                  <button
                    onClick={() => { setEditingBookmark(null); setShowAddDrawer(true); }}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    İlk Mekanı Ekle 📍
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedBookmark(item)}
                    className="bg-app-surface rounded-2xl border border-app-border shadow-xs transition-all duration-200 overflow-hidden flex cursor-pointer select-none"
                  >
                    {/* Thumbnail */}
                    {item.image_url ? (
                      <div className="w-24 h-28 relative shrink-0">
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        {item.is_visited && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <span className="text-white text-[8px] font-black uppercase tracking-wider bg-emerald-500/80 px-2 py-0.5 rounded-full">Gittim</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-28 bg-app-tab-track border-r border-app-border flex flex-col items-center justify-center text-app-muted shrink-0">
                        <MapPin size={24} weight="duotone" className="text-rose-400" />
                        {item.is_visited && (
                          <span className="text-[7px] font-black uppercase mt-1 tracking-wider text-emerald-500">Gittim</span>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-black text-app-text leading-tight line-clamp-1 flex-1">{item.title}</h4>
                          <button
                            onClick={(e) => handleToggleFavorite(e, item)}
                            className="text-rose-500 p-0.5 hover:scale-110 transition-all cursor-pointer shrink-0"
                          >
                            <Heart size={14} weight={item.is_favorite ? "fill" : "regular"} />
                          </button>
                        </div>

                        {item.description && (
                          <p className="text-[10px] text-app-muted line-clamp-2 mt-1 leading-snug break-words">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-app-border/40 pt-2 mt-2">
                        {item.instagram_username ? (
                          <div className="flex items-center gap-1 text-[9px] text-app-muted font-semibold truncate max-w-[130px]">
                            <InstagramLogo size={12} className="text-pink-500" />
                            <span className="truncate">@{item.instagram_username}</span>
                          </div>
                        ) : <div />}

                        <button
                          onClick={(e) => handleToggleVisited(e, item)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border active:scale-95 ${
                            item.is_visited
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                              : "bg-app-surface border-app-border text-app-muted hover:text-app-text"
                          }`}
                        >
                          {item.is_visited ? "Gittim ✓" : "Gitmedim"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Drawer */}
      {dbUserId && (
        <AddBookmarkDrawer
          isOpen={showAddDrawer}
          onClose={() => setShowAddDrawer(false)}
          onSave={() => fetchBookmarks(dbUserId)}
          userId={dbUserId}
          editBookmark={editingBookmark}
          initialUrl={(!editingBookmark && sharedText?.includes("instagram.com")) ? sharedText : undefined}
        />
      )}

      {/* Detail Modal */}
      {selectedBookmark && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-xs" onClick={() => setSelectedBookmark(null)} />
          <div className="relative bg-app-surface border border-app-border w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] z-50 overflow-y-auto">
            <button
              onClick={() => setSelectedBookmark(null)}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-app-tab-track flex items-center justify-center text-app-muted hover:text-app-text cursor-pointer active:scale-95"
            >
              <X size={14} weight="bold" />
            </button>

            {selectedBookmark.image_url && (
              <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 border border-app-border">
                <img src={selectedBookmark.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-black text-app-text leading-tight break-words flex-1">{selectedBookmark.title}</h3>
                <button onClick={(e) => handleToggleFavorite(e, selectedBookmark)} className="text-rose-500 hover:scale-110 cursor-pointer shrink-0">
                  <Heart size={18} weight={selectedBookmark.is_favorite ? "fill" : "regular"} />
                </button>
              </div>

              {selectedBookmark.instagram_username && (
                <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold">
                  <InstagramLogo size={16} className="text-pink-500" />
                  <a
                    href={`https://instagram.com/${selectedBookmark.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-500 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    @{selectedBookmark.instagram_username}
                  </a>
                </div>
              )}

              {selectedBookmark.description && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-black text-app-muted uppercase tracking-wider block">Notlarım</span>
                  <p className="text-xs text-app-text bg-app-tab-track/10 p-3 rounded-2xl border border-app-border/40 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto break-words">
                    {selectedBookmark.description}
                  </p>
                </div>
              )}

              {/* Visited toggle */}
              <button
                onClick={(e) => handleToggleVisited(e, selectedBookmark)}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all active:scale-[0.98] cursor-pointer ${
                  selectedBookmark.is_visited
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                    : "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30"
                }`}
              >
                {selectedBookmark.is_visited ? "✅ Gittim" : "📍 Gitmedim Henüz — İşaretle"}
              </button>
            </div>

            <div className="border-t border-app-border mt-5 pt-4 flex gap-2 shrink-0">
              {selectedBookmark.url && (
                <a
                  href={selectedBookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <InstagramLogo size={14} weight="fill" />
                  Paylaşımı Gör
                  <ArrowSquareOut size={12} />
                </a>
              )}

              <button
                onClick={() => { setEditingBookmark(selectedBookmark); setSelectedBookmark(null); setShowAddDrawer(true); }}
                className="p-2.5 bg-app-tab-track text-app-text border border-app-border hover:bg-app-surface rounded-xl active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <PencilSimple size={14} weight="bold" />
              </button>

              <button
                onClick={() => handleDelete(selectedBookmark.id)}
                disabled={isDeleting}
                className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                <Trash size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
