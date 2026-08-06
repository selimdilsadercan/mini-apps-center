"use client";

import { useState, useEffect } from "react";
import { X, Star, Heart, MapPin, InstagramLogo, Check, MagnifyingGlass } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import toast from "react-hot-toast";
import { createBookmarkAction, updateBookmarkAction } from "../actions";

type CategoryType = "Mekan" | "Tarif" | "Alışveriş" | "Genel" | "Diğer";

export default function AddBookmarkDrawer({
  isOpen,
  onClose,
  onSave,
  userId,
  editBookmark,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  userId: string;
  editBookmark?: any;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [category, setCategory] = useState<CategoryType>("Mekan");

  // Place specific
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [isVisited, setIsVisited] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editBookmark) {
        setUrl(editBookmark.url || "");
        setTitle(editBookmark.title || "");
        setDescription(editBookmark.description || "");
        setImageUrl(editBookmark.image_url || "");
        setInstagramUsername(editBookmark.instagram_username || "");
        setCategory((editBookmark.category as CategoryType) || "Mekan");
        setCity(editBookmark.city || "");
        setDistrict(editBookmark.district || "");
        setRating(editBookmark.rating ? Number(editBookmark.rating) : 5);
        setIsVisited(editBookmark.is_visited || false);
        setIsFavorite(editBookmark.is_favorite || false);
      } else {
        setUrl("");
        setTitle("");
        setDescription("");
        setImageUrl("");
        setInstagramUsername("");
        setCategory("Mekan");
        setCity("");
        setDistrict("");
        setRating(5);
        setIsVisited(false);
        setIsFavorite(false);
      }
    }
  }, [isOpen, editBookmark]);

  if (!isOpen) return null;

  const handleFetchInfo = async () => {
    if (!url.trim()) {
      toast.error("Lütfen geçerli bir sosyal medya linki girin.");
      return;
    }

    try {
      setIsFetching(true);
      const client = createBrowserClient();

      let res;
      if (url.includes("instagram.com")) {
        res = await client.scrape.scrapeInstagramReel({ url });
      } else {
        toast.error("Şu an sadece Instagram linkleri otomatik çözülebilir.");
        setIsFetching(false);
        return;
      }

      if (res.success) {
        // Autofill
        setDescription(res.caption || "");
        setImageUrl(res.thumbnail || "");
        setInstagramUsername(res.username || "");

        // Try to guess a place name from username or caption first sentence
        if (res.username) {
          setTitle(`${res.username} Paylaşımı`);
        }

        // Simple heuristic for place title: take first few words of caption
        if (res.caption) {
          const cleanText = res.caption.replace(/[#\n]/g, " ").trim();
          const words = cleanText.split(/\s+/).slice(0, 4).join(" ");
          if (words) {
            setTitle(words);
          }
        }

        toast.success("Bilgiler başarıyla çekildi!");
      } else {
        toast.error(res.error || "İçerik bilgileri alınamadı.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Bağlantı sırasında bir hata oluştu.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Lütfen bir başlık girin.");
      return;
    }

    try {
      setIsSaving(true);

      if (editBookmark) {
        // Update
        const res = await updateBookmarkAction({
          bookmarkId: editBookmark.id,
          userId,
          title: title.trim(),
          description: description.trim() || null,
          url: url.trim() || null,
          imageUrl: imageUrl.trim() || null,
          category,
          instagramUsername: instagramUsername.trim() || null,
          city: category === "Mekan" ? (city.trim() || null) : null,
          district: category === "Mekan" ? (district.trim() || null) : null,
          rating: category === "Mekan" ? rating : null,
          isVisited: category === "Mekan" ? isVisited : false,
          isFavorite: category === "Mekan" ? isFavorite : editBookmark.is_favorite || false,
        });
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Kayıt güncellendi!");
      } else {
        // Create
        const res = await createBookmarkAction({
          userId,
          title: title.trim(),
          description: description.trim() || null,
          url: url.trim() || null,
          imageUrl: imageUrl.trim() || null,
          category,
          instagramUsername: instagramUsername.trim() || null,
          city: category === "Mekan" ? (city.trim() || null) : null,
          district: category === "Mekan" ? (district.trim() || null) : null,
          rating: category === "Mekan" ? rating : null,
          isVisited: category === "Mekan" ? isVisited : false,
          isFavorite: category === "Mekan" ? isFavorite : false,
        });
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Kayıt başarıyla eklendi! 🔖");
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Kaydetme işlemi başarısız oldu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-app-surface rounded-t-3xl border-t border-app-border z-50 p-5 shadow-2xl max-h-[92vh] flex flex-col transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-app-border shrink-0">
          <h2 className="text-sm font-black text-app-text uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={18} weight="fill" className="text-rose-500" />
            {editBookmark ? "Kaydı Düzenle" : "Yeni İçerik Kaydet"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-app-tab-track flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95 cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pt-4 space-y-4 pb-6 pr-1">

          {/* Instagram / Social Media Link Link Loader */}
          {!editBookmark && (
            <div className="bg-app-tab-track/30 p-3 rounded-2xl border border-app-border space-y-2">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-wider block">
                Instagram Linkinden Otomatik Çek (Opsiyonel)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    className="w-full pl-3 pr-8 py-2.5 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs placeholder:text-app-muted"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text text-xs"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleFetchInfo}
                  disabled={isFetching || !url.trim()}
                  className="px-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {isFetching ? "Çekiliyor..." : "Bilgileri Çek"}
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[10px] font-black text-app-muted uppercase tracking-wider mb-1.5 block">
              Başlık / Mekan Adı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Kahve Dünyası, Leziz Börek Tarifi..."
              className="w-full p-3 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs font-bold shadow-xs"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-[10px] font-black text-app-muted uppercase tracking-wider mb-1.5 block">
              Kategori
            </label>
            <div className="inline-flex flex-wrap gap-1.5">
              {(["Mekan", "Tarif", "Alışveriş", "Genel", "Diğer"] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${category === cat
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-app-tab-track text-app-muted hover:text-app-text border border-app-border"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Place Specific Fields */}
          {category === "Mekan" && (
            <div className="bg-rose-50/10 border border-rose-500/10 p-4 rounded-2xl space-y-4 transition-all">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} weight="fill" />
                Mekan Detayları
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-app-muted uppercase tracking-wider mb-1 block">
                    Şehir
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="İstanbul, Ankara..."
                    className="w-full p-2.5 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-app-muted uppercase tracking-wider mb-1 block">
                    İlçe
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Kadıköy, Beşiktaş..."
                    className="w-full p-2.5 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Rating Selector */}
              <div>
                <label className="text-[9px] font-black text-app-muted uppercase tracking-wider mb-1.5 block">
                  Puanlama ({rating} Yıldız)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-yellow-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Star
                        size={24}
                        weight={star <= rating ? "fill" : "regular"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* visited & favorite toggles */}
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isVisited}
                    onChange={(e) => setIsVisited(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded-xs border-app-border bg-app-surface"
                  />
                  <span className="text-xs font-bold text-app-text">Ziyaret Ettim</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded-xs border-app-border bg-app-surface"
                  />
                  <span className="text-xs font-bold text-app-text flex items-center gap-1">
                    <Heart size={14} weight={isFavorite ? "fill" : "regular"} className="text-rose-500" />
                    Favori Mekan
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Description / Notes */}
          <div>
            <label className="text-[10px] font-black text-app-muted uppercase tracking-wider mb-1.5 block">
              Notlar / Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mekan veya tarif hakkında notlarını yaz..."
              className="w-full h-24 p-3 bg-app-surface border border-app-border rounded-xl resize-none focus:outline-none focus:border-rose-500/30 text-app-text text-xs leading-relaxed"
            />
          </div>

          {/* Instagram Username / Link Source (Hidden/Optional advanced details) */}
          <div className="border-t border-app-border pt-4 space-y-3">
            <h4 className="text-[9px] font-black text-app-muted uppercase tracking-wider">Gelişmiş Bilgiler (Opsiyonel)</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-app-muted uppercase tracking-wider mb-1 block">
                  İçerik Sahibi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={instagramUsername}
                    onChange={(e) => setInstagramUsername(e.target.value)}
                    placeholder="Kullanıcı adı"
                    className="w-full pl-7 pr-3 py-2 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs"
                  />
                  <InstagramLogo size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pink-500" />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-app-muted uppercase tracking-wider mb-1 block">
                  Görsel Linki
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Görsel URL..."
                  className="w-full p-2 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs truncate"
                />
              </div>
            </div>

            {editBookmark && (
              <div>
                <label className="text-[9px] font-black text-app-muted uppercase tracking-wider mb-1 block">
                  Kaynak URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Sosyal Medya Linki"
                  className="w-full p-2 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-rose-500/30 text-app-text text-xs truncate"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSaving ? "Kaydediliyor..." : editBookmark ? "Güncellemeleri Kaydet" : "Koleksiyona Ekle"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
