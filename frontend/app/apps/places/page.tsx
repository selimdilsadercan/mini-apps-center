"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import {
  CaretLeft,
  Coffee,
  Heart,
  MagnifyingGlass,
  MapPin,
  Clock,
  Sparkle,
  Phone,
  ArrowRight,
  Car,
  Selection,
  Eye,
  Trash,
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import { getAppRootUrl } from "@/lib/apps";
import { createBrowserClient } from "@/lib/api";
import { places } from "@/lib/client";
import { Drawer } from "vaul";

const client = createBrowserClient();

export default function PlacesPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  // State
  const [placeList, setPlaceList] = useState<places.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<places.Place | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const categories = ["Tümü", "Kafe", "Restoran", "Tatlıcı", "Bar"];

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const res = await client.places.listPlaces({
        userId: user?.id || undefined,
      });
      setPlaceList(res.places || []);
    } catch (err: any) {
      console.error("Failed to load places:", err);
      toast.error("Mekanlar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded) {
      fetchPlaces();
    }
  }, [isUserLoaded, user]);

  // Handle URL param to open a specific place on load
  useEffect(() => {
    if (placeList.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const placeId = params.get("id");
      if (placeId) {
        const found = placeList.find((p) => p.id === placeId);
        if (found) {
          setSelectedPlace(found);
          setIsDetailOpen(true);
        }
      }
    }
  }, [placeList]);

  const handleToggleFavorite = async (e: React.MouseEvent, placeId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Favorilere eklemek için giriş yapmalısınız.");
      return;
    }

    try {
      const res = await client.places.toggleFavorite({
        placeId,
        userId: user.id,
      });

      // Update state locally
      setPlaceList((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_favorite: res.isFavorite } : p
        )
      );

      if (selectedPlace && selectedPlace.id === placeId) {
        setSelectedPlace((prev) => prev ? { ...prev, is_favorite: res.isFavorite } : null);
      }

      toast.success(
        res.isFavorite ? "Favorilere eklendi! ❤️" : "Favorilerden çıkarıldı."
      );
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      toast.error("İşlem gerçekleştirilemedi.");
    }
  };

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      const res = await client.places.seedPlaces();
      toast.success(`${res.count} adet örnek mekan başarıyla eklendi! 🍕☕`);
      fetchPlaces();
    } catch (err: any) {
      toast.error("Örnek mekanlar eklenirken hata oluştu.");
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const filteredPlaces = placeList.filter((place) => {
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.district &&
        place.district.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "Tümü" || place.category === selectedCategory;

    const matchesFavorites = !showFavoritesOnly || place.is_favorite;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  return (
    <div className="min-h-screen bg-app-bg text-app-text pb-24">
      <Toaster position="bottom-center" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-app-surface/95 backdrop-blur-md border-b border-app-border/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            {/* Geri butonu */}
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-[#D97706]" />
            </button>

            {/* Başlık */}
            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <Coffee size={18} weight="fill" className="text-[#D97706] shrink-0" />
              <span className="truncate">
                Şehirdeki <span className="text-[#D97706]">Mekanlar</span>
              </span>
            </h1>

            {/* Info or Quick Action (Optional) */}
            {user && placeList.length > 0 && (
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${showFavoritesOnly
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "border-app-border text-app-muted hover:text-app-text bg-app-surface"
                  }`}
              >
                <Heart size={16} weight={showFavoritesOnly ? "fill" : "regular"} />
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted"
            />
            <input
              type="text"
              placeholder="Mekan veya bölge ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-[#D97706]/50 transition-colors"
            />
          </div>

          {/* Categories Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2.5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                    ? "bg-[#D97706] text-white"
                    : "bg-app-surface border border-app-border text-app-muted hover:text-app-text"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-app-surface rounded-2xl border border-app-border animate-pulse" />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-12 bg-app-surface rounded-2xl border border-app-border p-6 mt-4">
            <Coffee size={40} className="mx-auto text-app-muted mb-3" />
            <p className="font-bold text-sm text-app-text">Mekan bulunamadı</p>
            <p className="text-xs text-app-muted mt-1">
              {showFavoritesOnly ? "Henüz favori mekan eklememişsiniz." : "Arama kriterlerinize uyan bir yer bulunmuyor."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => {
                  setSelectedPlace(place);
                  setIsDetailOpen(true);
                }}
                className="bg-app-surface rounded-2xl border border-app-border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row"
              >
                {/* Image */}
                <div className="relative w-full sm:w-36 h-36 bg-app-surface-muted shrink-0">
                  {place.image_url ? (
                    <img
                      src={place.image_url}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee size={32} className="text-app-muted" />
                    </div>
                  )}

                  {/* Favorite Button Overlay */}
                  <button
                    onClick={(e) => handleToggleFavorite(e, place.id)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
                  >
                    <Heart
                      size={14}
                      weight={place.is_favorite ? "fill" : "regular"}
                      className={place.is_favorite ? "text-red-500" : "text-white"}
                    />
                  </button>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                        {place.category}
                      </span>
                      {place.rating && (
                        <div className="flex items-center gap-0.5 text-yellow-500 text-xs font-bold">
                          ★ {place.rating}
                        </div>
                      )}
                    </div>

                    <h3 className="font-black text-sm text-app-text mt-1.5 truncate">
                      {place.name}
                    </h3>
                    <p className="text-xs text-app-muted mt-1 line-clamp-2">
                      {place.description || "Açıklama bulunmuyor."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-border/40">
                    <div className="flex items-center gap-1 text-[10px] text-app-muted font-bold truncate">
                      <MapPin size={12} className="text-app-muted" />
                      <span>{place.district || "Popüler Mekan"}</span>
                    </div>

                    {place.business_id && (
                      <span className="flex items-center gap-0.5 text-[10px] font-black uppercase text-[#D97706]">
                        QR Menü var <ArrowRight size={10} weight="bold" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Place Details Drawer */}
      <Drawer.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-app-surface border-t border-app-border rounded-t-[32px] max-h-[85vh] outline-none z-50 flex flex-col overflow-hidden">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-app-border my-3 shrink-0" />

            {selectedPlace && (
              <div className="overflow-y-auto px-6 pb-8 space-y-5">
                {/* Header Image */}
                <div className="relative h-44 rounded-2xl overflow-hidden bg-app-surface-muted shrink-0 border border-app-border">
                  {selectedPlace.image_url ? (
                    <img
                      src={selectedPlace.image_url}
                      alt={selectedPlace.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee size={48} className="text-app-muted" />
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => handleToggleFavorite(e, selectedPlace.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
                  >
                    <Heart
                      size={16}
                      weight={selectedPlace.is_favorite ? "fill" : "regular"}
                      className={selectedPlace.is_favorite ? "text-red-500" : "text-white"}
                    />
                  </button>
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                      {selectedPlace.category}
                    </span>
                    {selectedPlace.rating && (
                      <span className="text-yellow-500 font-black text-sm flex items-center gap-0.5">
                        ★ {selectedPlace.rating}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-black text-app-text mt-2">
                    {selectedPlace.name}
                  </h2>
                  <p className="text-xs text-app-muted mt-2 leading-relaxed">
                    {selectedPlace.description || "Açıklama bulunmuyor."}
                  </p>
                </div>

                {/* Info Fields */}
                <div className="space-y-3 bg-app-bg/50 p-4 rounded-2xl border border-app-border/60">
                  {selectedPlace.working_hours && (
                    <div className="flex items-center gap-3 text-xs">
                      <Clock size={16} className="text-[#D97706]" />
                      <div>
                        <p className="font-bold text-app-muted text-[10px] uppercase">Çalışma Saatleri</p>
                        <p className="font-black mt-0.5">{selectedPlace.working_hours}</p>
                      </div>
                    </div>
                  )}

                  {selectedPlace.address && (
                    <div className="flex items-start gap-3 text-xs">
                      <MapPin size={16} className="text-[#D97706] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-app-muted text-[10px] uppercase">Adres</p>
                        <p className="font-medium mt-0.5 leading-relaxed">{selectedPlace.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Tags */}
                {selectedPlace.features && selectedPlace.features.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">Özellikler</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlace.features.map((feat) => (
                        <span
                          key={feat}
                          className="px-2.5 py-1 bg-app-bg border border-app-border rounded-lg text-xs font-semibold text-app-text"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Menu Action CTA */}
                {selectedPlace.business_id ? (
                  <button
                    onClick={() => {
                      router.push(`/apps/digital-menu?biz=${selectedPlace.business_id}`);
                    }}
                    className="w-full py-3.5 bg-[#D97706] hover:bg-[#D97706]/90 text-white font-black text-sm uppercase tracking-tight rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Dijital Menüyü İncele 🍽️</span>
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-app-muted border border-app-border border-dashed rounded-xl">
                    Bu mekanın henüz dijital menüsü bulunmuyor.
                  </div>
                )}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
