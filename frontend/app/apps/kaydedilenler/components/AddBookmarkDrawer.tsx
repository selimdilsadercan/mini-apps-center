"use client";

import { useState, useEffect, useRef } from "react";
import { X, MapPin, InstagramLogo, MagnifyingGlass, Star, ArrowRight, Check } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import toast from "react-hot-toast";
import { createBookmarkAction, updateBookmarkAction } from "../actions";

export default function AddBookmarkDrawer({
  isOpen,
  onClose,
  onSave,
  userId,
  editBookmark,
  initialUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string;
  editBookmark?: any;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState(""); // instagram caption — kaydediliyor ama gösterilmiyor
  const [imageUrl, setImageUrl] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [fetched, setFetched] = useState(false);

  // Mekan seçimi
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; id?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editBookmark) {
        setUrl(editBookmark.url || "");
        setCaption(editBookmark.description || "");
        setImageUrl(editBookmark.image_url || "");
        setInstagramUsername(editBookmark.instagram_username || "");
        setSelectedPlace({ name: editBookmark.title || "" });
        setSearchQuery(editBookmark.title || "");
        setFetched(true);
      } else {
        setUrl(initialUrl || ""); setCaption(""); setImageUrl(""); setInstagramUsername("");
        setSelectedPlace(null); setSearchQuery(""); setFetched(false);
      }
      setSearchResults([]); setShowSuggestions(false);
    }
  }, [isOpen, editBookmark]);

  // DB search debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (selectedPlace || searchQuery.trim().length < 2) {
      setSearchResults([]); setShowSuggestions(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const client = createBrowserClient();
        const res = await client.workplaces.searchPlace({ query: searchQuery.trim() });
        setSearchResults(res.results || []);
        setShowSuggestions((res.results || []).length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }, [searchQuery, selectedPlace]);

  const handleFetch = async () => {
    if (!url.trim() || !url.includes("instagram.com")) {
      toast.error("Geçerli bir Instagram linki girin.");
      return;
    }
    try {
      setIsFetching(true);
      const client = createBrowserClient();
      const res = await client.scrape.scrapeInstagramReel({ url });
      if (res.success) {
        setCaption(res.caption || ""); // kaydet ama gösterme
        setImageUrl(res.thumbnail || "");
        setInstagramUsername(res.username || "");
        setFetched(true);
        toast.success("Görseller çekildi!");
      } else {
        toast.error(res.error || "İçerik alınamadı.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const placeName = selectedPlace?.name || searchQuery.trim();
    if (!placeName) { toast.error("Bir mekan seç veya yaz."); return; }
    try {
      setIsSaving(true);
      if (editBookmark) {
        const res = await updateBookmarkAction({
          bookmarkId: editBookmark.id, userId,
          title: placeName, description: caption || null,
          url: url.trim() || null, imageUrl: imageUrl.trim() || null,
          category: "Mekan", instagramUsername: instagramUsername.trim() || null,
          isVisited: editBookmark.is_visited || false, isFavorite: editBookmark.is_favorite || false,
        });
        if (res.error) { toast.error(res.error); return; }
        toast.success("Güncellendi!");
      } else {
        const res = await createBookmarkAction({
          userId, title: placeName, description: caption || null,
          url: url.trim() || null, imageUrl: imageUrl.trim() || null,
          category: "Mekan", instagramUsername: instagramUsername.trim() || null,
          isVisited: false, isFavorite: false,
        });
        if (res.error) { toast.error(res.error); return; }
        toast.success("Mekan eklendi! 📍");
      }
      onSave(); onClose();
    } catch {
      toast.error("Kaydetme başarısız.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-app-surface rounded-t-3xl border-t border-app-border z-50 p-5 shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-app-border shrink-0">
          <h2 className="text-sm font-black text-app-text uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={18} weight="fill" className="text-rose-500" />
            {editBookmark ? "Mekanı Düzenle" : "Mekan Kaydet"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-app-tab-track flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95 cursor-pointer">
            <X size={16} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pt-4 space-y-5 pb-6 pr-1">

          {/* 1. INSTAGRAM LİNKİ */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <InstagramLogo size={13} className="text-pink-500" />
              <label className="text-[10px] font-black text-app-muted uppercase tracking-wider">Instagram Linki</label>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (fetched && !editBookmark) setFetched(false); }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleFetch())}
                placeholder="https://www.instagram.com/reel/..."
                autoFocus={!editBookmark}
                className="flex-1 px-3 py-2.5 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/50 text-app-text text-xs placeholder:text-app-muted"
              />
              <button
                type="button"
                onClick={handleFetch}
                disabled={isFetching || !url.trim()}
                className="px-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {isFetching
                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <ArrowRight size={14} weight="bold" />}
                {isFetching ? "..." : "Çek"}
              </button>
            </div>
          </div>

          {/* 2. POST BİLGİSİ (çekildikten sonra) */}
          {fetched && (
            <div className="flex items-center gap-3 p-3 bg-app-tab-track/30 border border-app-border rounded-2xl">
              {imageUrl ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-app-border shrink-0">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-app-tab-track border border-app-border flex items-center justify-center shrink-0">
                  <InstagramLogo size={22} className="text-pink-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-app-muted uppercase tracking-wider mb-0.5">Instagram Paylaşımı</p>
                {instagramUsername && (
                  <div className="flex items-center gap-1">
                    <InstagramLogo size={11} className="text-pink-500" />
                    <span className="text-xs font-bold text-app-text">@{instagramUsername}</span>
                  </div>
                )}
                {caption && (
                  <p className="text-[10px] text-app-muted leading-snug mt-1 line-clamp-2 break-words">
                    {caption}
                  </p>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-[9px] text-rose-500 hover:underline truncate block mt-0.5"
                >
                  Paylaşımı aç ↗
                </a>
              </div>
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="shrink-0 text-app-muted hover:text-app-text"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* 3. MEKAN SEÇ (büyük alan) */}
          {fetched && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-wider block">
                Bu postaki mekan hangisi?
              </label>

              {/* Seçilmiş mekan */}
              {selectedPlace ? (
                <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
                    <MapPin size={16} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-app-text truncate">{selectedPlace.name}</p>
                    <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">Seçildi</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPlace(null); setSearchQuery(""); }}
                    className="shrink-0 text-app-muted hover:text-rose-500 transition-colors"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>
              ) : (
                /* Arama alanı */
                <div className="relative">
                  <div className="relative">
                    <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Mekan adını yaz veya ara..."
                      className="w-full pl-10 pr-4 py-3.5 bg-app-surface border border-app-border rounded-2xl focus:outline-none focus:border-rose-500/40 text-app-text text-sm font-bold placeholder:font-normal placeholder:text-app-muted"
                    />
                    {isSearching && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Özel mekan kartı — DB'de bulunamadıysa */}
                  {!isSearching && searchQuery.trim().length >= 2 && !showSuggestions && searchResults.length === 0 && (
                    <div className="mt-2 flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <MapPin size={16} weight="fill" className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-app-text truncate">"{searchQuery}"</p>
                        <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Özel mekan olarak eklenecek</p>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-app-surface border border-app-border rounded-2xl shadow-xl mt-1.5 overflow-hidden max-h-52 overflow-y-auto">
                      {searchResults.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => { setSelectedPlace({ name: place.name, id: place.id }); setShowSuggestions(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-app-tab-track/50 transition-colors text-left border-b border-app-border/50 last:border-0"
                        >
                          {place.image_url
                            ? <img src={place.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-app-border" />
                            : <div className="w-10 h-10 rounded-xl bg-app-tab-track flex items-center justify-center shrink-0"><MapPin size={16} weight="fill" className="text-rose-400" /></div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-app-text truncate">{place.name}</p>
                            <p className="text-[10px] text-app-muted truncate">{place.district || place.address || ""}</p>
                          </div>
                          {place.rating && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Star size={11} weight="fill" className="text-amber-400" />
                              <span className="text-[11px] font-black text-app-text">{Number(place.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Kaydet */}
          {fetched && (
            <div className="pt-1 shrink-0">
              <button
                type="submit"
                disabled={isSaving || (!selectedPlace && !searchQuery.trim())}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Check size={14} weight="bold" />}
                {isSaving ? "Kaydediliyor..." : editBookmark ? "Güncelle" : "Koleksiyona Ekle 📍"}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
