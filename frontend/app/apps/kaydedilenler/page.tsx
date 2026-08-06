"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  Plus,
  BookmarkSimple,
  Star,
  Heart,
  InstagramLogo,
  ArrowSquareOut,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  MapPin,
  CheckCircle,
  X,
} from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import {
  getUserBookmarksAction,
  getOrCreateUserAction,
  deleteBookmarkAction,
  updateBookmarkAction,
} from "./actions";
import AddBookmarkDrawer from "./components/AddBookmarkDrawer";
import toast from "react-hot-toast";

type TabType = "all" | "to_visit" | "visited" | "favorites";
type CategoryFilter = "Tümü" | "Mekan" | "Tarif" | "Alışveriş" | "Genel" | "Diğer";

export default function BookmarksPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  // Data States
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI Filters
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Tümü");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Drawer States
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<any | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch bookmarks
  const fetchBookmarks = async (targetUserId: string) => {
    try {
      setLoading(true);
      const res = await getUserBookmarksAction(targetUserId);
      if (res.data) {
        setBookmarks(res.data);
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
      if (!user) {
        setLoading(false);
        return;
      }
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

  // Handle toggles directly from list
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
        category: item.category,
        instagramUsername: item.instagram_username,
        city: item.city,
        district: item.district,
        rating: item.rating,
        isVisited: nextVisited,
        isFavorite: item.is_favorite,
      });
      if (res.data) {
        setBookmarks(prev => prev.map(b => b.id === item.id ? res.data : b));
        toast.success(nextVisited ? "Ziyaret edildi olarak işaretlendi!" : "Ziyaret edilmedi olarak işaretlendi");
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız oldu.");
    }
  };

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
        category: item.category,
        instagramUsername: item.instagram_username,
        city: item.city,
        district: item.district,
        rating: item.rating,
        isVisited: item.is_visited,
        isFavorite: nextFavorite,
      });
      if (res.data) {
        setBookmarks(prev => prev.map(b => b.id === item.id ? res.data : b));
        toast.success(nextFavorite ? "Favorilere eklendi!" : "Favorilerden çıkarıldı");
      }
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız oldu.");
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    if (!dbUserId) return;
    if (!window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) return;

    try {
      setIsDeleting(true);
      const res = await deleteBookmarkAction(bookmarkId, dbUserId);
      if (res.data) {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
        toast.success("Kayıt başarıyla silindi.");
        setSelectedBookmark(null);
      } else {
        toast.error(res.error || "Silme işlemi başarısız oldu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Silme işlemi sırasında hata oluştu.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter logic
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(item => {
      // 1. Tab filter
      if (activeTab === "to_visit" && (item.category !== "Mekan" || item.is_visited)) return false;
      if (activeTab === "visited" && (item.category !== "Mekan" || !item.is_visited)) return false;
      if (activeTab === "favorites" && (item.category !== "Mekan" || !item.is_favorite)) return false;

      // 2. Category filter
      if (categoryFilter !== "Tümü" && item.category !== categoryFilter) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) || false;
        const matchesCity = item.city?.toLowerCase().includes(query) || false;
        const matchesDist = item.district?.toLowerCase().includes(query) || false;
        return matchesTitle || matchesDesc || matchesCity || matchesDist;
      }

      return true;
    });
  }, [bookmarks, activeTab, categoryFilter, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text">
      {/* Header conforming to standard template */}
      <header className="sticky top-0 z-30 bg-app-surface/95 backdrop-blur-md border-b border-app-border shadow-xs">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            {/* Geri butonu */}
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-rose-500" />
            </button>

            {/* Başlık: ikon + uppercase, bir kelime accent renkte */}
            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5 select-none">
              <BookmarkSimple size={18} weight="fill" className="text-rose-500 shrink-0" />
              <span className="truncate">
                Sosyal <span className="text-rose-500">Kaydet</span>
              </span>
            </h1>

            {/* Ekle Butonu */}
            {user && dbUserId && (
              <button
                onClick={() => {
                  setEditingBookmark(null);
                  setShowAddDrawer(true);
                }}
                className="shrink-0 flex items-center justify-center w-8 h-8 text-rose-500 hover:text-rose-600 transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
              >
                <Plus size={16} weight="bold" />
              </button>
            )}
          </div>

          {/* Sub-navigation tabs in header (not full width, left-aligned) */}
          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track mt-2.5 shrink-0">
            <button
              onClick={() => {
                setActiveTab("all");
                setCategoryFilter("Tümü");
              }}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                activeTab === "all" ? "bg-app-tab-active text-app-text shadow-xs" : "text-app-muted hover:text-app-text"
              }`}
            >
              Koleksiyonum
            </button>
            <button
              onClick={() => {
                setActiveTab("to_visit");
                setCategoryFilter("Mekan");
              }}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                activeTab === "to_visit" ? "bg-app-tab-active text-app-text shadow-xs" : "text-app-muted hover:text-app-text"
              }`}
            >
              Gitmediklerim
            </button>
            <button
              onClick={() => {
                setActiveTab("visited");
                setCategoryFilter("Mekan");
              }}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer ${
                activeTab === "visited" ? "bg-app-tab-active text-app-text shadow-xs" : "text-app-muted hover:text-app-text"
              }`}
            >
              Gittiklerim
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 pb-16 max-w-xl mx-auto w-full">
        {!user ? (
          <div className="text-center py-20 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-xs select-none">
            <BookmarkSimple size={48} className="text-app-muted mb-4" weight="duotone" />
            <h3 className="text-sm font-bold text-app-text mb-2">Giriş Yapmalısın</h3>
            <p className="text-xs text-app-muted">Kaydedilen içeriklerinizi görmek ve yeni mekanlar eklemek için lütfen giriş yapın.</p>
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
            {/* Search & Category filter */}
            <div className="space-y-3">
              {/* Search input with search icon */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İçerik, mekan veya konum ara..."
                  className="w-full pl-9 pr-4 py-3 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs placeholder:text-app-muted shadow-xs"
                />
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
              </div>

              {/* Category filter pills - only show if on 'all' tab */}
              {activeTab === "all" && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0 select-none">
                  {(["Tümü", "Mekan", "Tarif", "Alışveriş", "Genel", "Diğer"] as CategoryFilter[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        categoryFilter === cat
                          ? "bg-rose-500 text-white shadow-xs"
                          : "bg-app-surface text-app-muted hover:text-app-text border border-app-border"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List */}
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-16 bg-app-surface rounded-2xl border border-app-border shadow-xs p-6 select-none">
                <BookmarkSimple size={36} className="text-app-muted mx-auto mb-3" weight="duotone" />
                <p className="text-xs font-bold text-app-muted mb-4">Gösterilecek kayıt bulunamadı</p>
                <button
                  onClick={() => {
                    setEditingBookmark(null);
                    setShowAddDrawer(true);
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-5 py-3 rounded-xl transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  İlk Kaydını Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedBookmark(item)}
                    className="bg-app-surface rounded-2xl border border-app-border shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex cursor-pointer select-none"
                  >
                    {/* Thumbnail Image */}
                    {item.image_url ? (
                      <div className="w-24 h-28 relative shrink-0">
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* Category Badge overlay */}
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/65 backdrop-blur-xs rounded-md text-[8px] font-black uppercase text-white tracking-wider">
                          {item.category}
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-28 bg-app-tab-track border-r border-app-border flex flex-col items-center justify-center text-app-muted shrink-0">
                        <BookmarkSimple size={24} weight="duotone" />
                        <span className="text-[8px] font-black uppercase mt-1 tracking-wider">{item.category}</span>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Title & Favorite */}
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-black text-app-text leading-tight line-clamp-1 flex-1">
                            {item.title}
                          </h4>
                          {item.category === "Mekan" && (
                            <button
                              onClick={(e) => handleToggleFavorite(e, item)}
                              className="text-rose-500 p-0.5 hover:scale-110 transition-all cursor-pointer"
                            >
                              <Heart
                                size={14}
                                weight={item.is_favorite ? "fill" : "regular"}
                              />
                            </button>
                          )}
                        </div>

                        {/* Location Details (if place) */}
                        {item.category === "Mekan" && (item.city || item.district) && (
                          <div className="flex items-center gap-0.5 text-[10px] text-rose-500 font-bold mt-1">
                            <MapPin size={10} weight="fill" />
                            <span>
                              {[item.district, item.city].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Notes Snippet */}
                        {item.description && (
                          <p className="text-[10px] text-app-muted line-clamp-2 mt-1 leading-snug break-words">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-app-border/40 pt-2 mt-2">
                        {/* Creator Username if Instagram */}
                        {item.instagram_username ? (
                          <div className="flex items-center gap-1 text-[9px] text-app-muted font-semibold truncate max-w-[130px]">
                            <InstagramLogo size={12} className="text-pink-500" />
                            <span className="truncate">@{item.instagram_username}</span>
                          </div>
                        ) : (
                          <div />
                        )}

                        {/* Actions: Visited and Star rating */}
                        <div className="flex items-center gap-2">
                          {item.category === "Mekan" && (
                            <>
                              {/* Rating display */}
                              {item.rating && (
                                <div className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-black">
                                  <Star size={11} weight="fill" />
                                  <span>{Number(item.rating).toFixed(0)}</span>
                                </div>
                              )}

                              {/* Visited Action */}
                              <button
                                onClick={(e) => handleToggleVisited(e, item)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border active:scale-95 ${
                                  item.is_visited
                                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30"
                                    : "bg-app-surface border-app-border text-app-muted hover:text-app-text"
                                }`}
                              >
                                {item.is_visited ? "Gittim" : "Gitmedim"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Add Drawer */}
      {dbUserId && (
        <AddBookmarkDrawer
          isOpen={showAddDrawer}
          onClose={() => setShowAddDrawer(false)}
          onSave={() => fetchBookmarks(dbUserId)}
          userId={dbUserId}
          editBookmark={editingBookmark}
        />
      )}

      {/* Detailed view Modal */}
      {selectedBookmark && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-xs"
            onClick={() => setSelectedBookmark(null)}
          />
          <div className="relative bg-app-surface border border-app-border w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] z-50 overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedBookmark(null)}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-app-tab-track flex items-center justify-center text-app-muted hover:text-app-text cursor-pointer active:scale-95"
            >
              <X size={14} weight="bold" />
            </button>

            {/* Thumbnail Image inside details */}
            {selectedBookmark.image_url && (
              <div className="w-full h-44 rounded-2xl overflow-hidden mb-4 border border-app-border">
                <img
                  src={selectedBookmark.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Info */}
            <div className="space-y-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-[8px] font-black uppercase tracking-wider block w-fit mb-1">
                    {selectedBookmark.category}
                  </span>
                  <h3 className="text-sm font-black text-app-text leading-tight leading-none break-words">
                    {selectedBookmark.title}
                  </h3>
                </div>
                {selectedBookmark.category === "Mekan" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => handleToggleFavorite(e, selectedBookmark)}
                      className="text-rose-500 hover:scale-110 cursor-pointer"
                    >
                      <Heart
                        size={18}
                        weight={selectedBookmark.is_favorite ? "fill" : "regular"}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Place specific details */}
              {selectedBookmark.category === "Mekan" && (
                <div className="bg-app-tab-track/30 border border-app-border p-3 rounded-2xl space-y-2.5 text-xs">
                  {/* Location */}
                  {(selectedBookmark.city || selectedBookmark.district) && (
                    <div className="flex items-center gap-1.5 text-app-text font-bold">
                      <MapPin size={14} className="text-rose-500" weight="fill" />
                      <span>
                        {[selectedBookmark.district, selectedBookmark.city].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  {selectedBookmark.rating && (
                    <div className="flex items-center gap-1.5 font-bold">
                      <Star size={14} className="text-yellow-400" weight="fill" />
                      <span>{Number(selectedBookmark.rating).toFixed(1)} Yıldız</span>
                    </div>
                  )}

                  {/* Visit Status */}
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle
                      size={14}
                      className={selectedBookmark.is_visited ? "text-green-500" : "text-app-muted"}
                      weight="fill"
                    />
                    <span>
                      {selectedBookmark.is_visited ? "Ziyaret Edildi" : "Ziyaret Edilecek"}
                    </span>
                  </div>
                </div>
              )}

              {/* Creator details */}
              {selectedBookmark.instagram_username && (
                <div className="flex items-center gap-1.5 text-xs text-app-muted font-bold">
                  <InstagramLogo size={16} className="text-pink-500" />
                  <span>Kanal / İçerik Sahibi:</span>
                  <a
                    href={`https://instagram.com/${selectedBookmark.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-500 hover:underline"
                  >
                    @{selectedBookmark.instagram_username}
                  </a>
                </div>
              )}

              {/* Description Notes */}
              {selectedBookmark.description && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-black text-app-muted uppercase tracking-wider block">Notlarım</span>
                  <p className="text-xs text-app-text bg-app-tab-track/10 p-3 rounded-2xl border border-app-border/40 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto break-words">
                    {selectedBookmark.description}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-app-border mt-5 pt-4 flex gap-2 shrink-0">
              {/* Social Media Link button */}
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

              {/* Edit */}
              <button
                onClick={() => {
                  setEditingBookmark(selectedBookmark);
                  setSelectedBookmark(null);
                  setShowAddDrawer(true);
                }}
                className="p-2.5 bg-app-tab-track text-app-text border border-app-border hover:bg-app-surface rounded-xl active:scale-95 cursor-pointer flex items-center justify-center"
                title="Düzenle"
              >
                <PencilSimple size={14} weight="bold" />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(selectedBookmark.id)}
                disabled={isDeleting}
                className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 rounded-xl active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-50"
                title="Sil"
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
