"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import {
  ArrowLeft,
  ArrowSquareOut,
  Car,
  Coffee,
  Heart,
  CheckCircle,
  MapPin,
  Plug,
  SpeakerLow,
  Tag,
  WifiHigh,
  Globe,
  Clock,
  Pencil,
  Trash,
  House,
  Coins,
  Eye,
  X,
  Phone,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";

function quietLevelLabel(
  level: number,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const label = t(`quietLevels.${level}`);
  if (label === `workplaces.quietLevels.${level}`) {
    return t("quietLevels.fallback", { level });
  }
  return label;
}

function PlaceDetailContent() {
  const t = useTranslations("workplaces");
  const client = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get("placeId");
  const { user, isLoaded: isUserLoaded } = useUser();

  const [place, setPlace] = useState<workplaces.Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isHoursExpanded, setIsHoursExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newPlace, setNewPlace] = useState({
    name: "",
    note: "",
    url: "",
    wifi: false,
    parking: false,
    power_outlets: false,
    quiet_level: 3,
    tags: "",
    wifi_status: "NO",
    parking_status: [] as string[],
    outlets_status: "NO",
    outdoor_status: "NO",
    view_status: "NO",
    coffee_price: "MODERATE",
    areas: [] as string[],
    google_place_id: "",
  });

  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }
    client.users.checkAdmin(user.id)
      .then((res) => setIsAdmin(res.isAdmin))
      .catch((err) => console.error("Failed to check admin status:", err));
  }, [user?.id, client]);

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      setLoading(false);
      setError(t("detail.noPlaceId"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let found: workplaces.Place | undefined;
      try {
        const res = await client.workplaces.getPlace(placeId, {
          userId: user?.id,
        });
        found = res.place;
      } catch (getErr) {
        console.warn("getPlace failed, falling back to listPlaces:", getErr);
        const res = await client.workplaces.listPlaces({ userId: user?.id });
        found = res.places.find((p) => p.id === placeId);
      }

      if (found) {
        setPlace(found);
      } else {
        setError(t("detail.notFound"));
      }
    } catch (err) {
      console.error("Failed to fetch place:", err);
      setError(t("detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [placeId, user?.id, client]);

  useEffect(() => {
    if (!isUserLoaded) return;
    loadPlace();
  }, [isUserLoaded, loadPlace]);

  const handleToggleFavorite = async () => {
    if (!place) return;
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    try {
      setStatusLoading(true);
      const res = await client.workplaces.toggleFavorite({
        placeId: place.id,
        userId: user.id,
      });
      setPlace({ ...place, is_favorite: res.isFavorite });
    } catch (err) {
      console.error("toggleFavorite failed:", err);
      toast.error(t("toast.updateFailed"));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleToggleVisited = async () => {
    if (!place) return;
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    try {
      setStatusLoading(true);
      const res = await client.workplaces.toggleVisited({
        placeId: place.id,
        userId: user.id,
      });
      setPlace({ ...place, is_visited: res.isVisited });
    } catch (err) {
      console.error("toggleVisited failed:", err);
      toast.error(t("toast.updateFailed"));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleEditClick = () => {
    if (!place) return;
    let initialParking: string[] = [];
    if (Array.isArray(place.metadata?.parking_status)) {
      initialParking = place.metadata.parking_status;
    } else if (place.metadata?.parking_status && place.metadata.parking_status !== "NO") {
      initialParking = [place.metadata.parking_status];
    } else if (place.parking) {
      initialParking = ["FREE"];
    }

    setNewPlace({
      name: place.name,
      note: place.note || "",
      url: place.url || "",
      wifi: place.wifi || false,
      parking: place.parking || false,
      power_outlets: place.power_outlets || false,
      quiet_level: place.quiet_level || 3,
      tags: place.tags.join(", "),
      wifi_status: place.metadata?.wifi_status || (place.wifi ? "FREE_FAST" : "NO"),
      parking_status: initialParking,
      outlets_status: place.metadata?.outlets_status || (place.power_outlets ? "SOME" : "NO"),
      outdoor_status: place.metadata?.outdoor_status || "NO",
      view_status: place.metadata?.view_status || "NO",
      coffee_price: place.metadata?.coffee_price || "MODERATE",
      areas: Array.isArray(place.metadata?.areas) ? place.metadata.areas : [],
      google_place_id: place.metadata?.google_place_id || (place.url ? place.url.match(/place_id:([^&\?#]+)/)?.[1] : "") || "",
    });
    setShowEditModal(true);
  };

  const handleDeletePlace = async () => {
    if (!place || !user?.id) return;
    if (!window.confirm("Bu mekanı silmek istediğinize emin misiniz?")) return;
    try {
      setStatusLoading(true);
      await client.workplaces.deletePlace({
        placeId: place.id,
        userId: user.id,
      });
      toast.success("Mekan başarıyla silindi");
      router.push("/apps/workplaces");
    } catch (err) {
      console.error("Failed to delete place:", err);
      toast.error("Mekan silinemedi");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSyncFromMaps = async () => {
    if (!place || !user?.id) return;
    const gId = newPlace.google_place_id || place.metadata?.google_place_id;
    if (!gId) {
      toast.error("Bu mekanın Google Place ID bilgisi bulunmuyor.");
      return;
    }
    try {
      setStatusLoading(true);
      await client.workplaces.updatePlace({
        id: place.id,
        userId: user.id,
        name: newPlace.name,
        note: newPlace.note,
        url: newPlace.url,
        wifi: newPlace.wifi_status !== "NO",
        parking: Array.isArray(newPlace.parking_status) && newPlace.parking_status.length > 0,
        power_outlets: newPlace.outlets_status !== "NO",
        quiet_level: newPlace.quiet_level,
        tags: newPlace.tags.split(",").map((t) => t.trim()).filter(Boolean),
        metadata: {
          ...(place.metadata || {}),
          wifi_status: newPlace.wifi_status,
          parking_status: newPlace.parking_status,
          outlets_status: newPlace.outlets_status,
          outdoor_status: newPlace.outdoor_status,
          view_status: newPlace.view_status,
          coffee_price: newPlace.coffee_price,
          areas: newPlace.areas,
          google_place_id: gId,
        },
        google_place_id: gId,
      });
      toast.success("Google Maps verileri başarıyla senkronize edildi!");
      setShowEditModal(false);
      loadPlace();
    } catch (err) {
      console.error(err);
      toast.error("Google Maps'ten veri çekilirken hata oluştu.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place || !user?.id) return;
    try {
      setStatusLoading(true);
      const wifiBool = newPlace.wifi_status !== "NO";
      const parkingBool = Array.isArray(newPlace.parking_status) && newPlace.parking_status.length > 0;
      const powerBool = newPlace.outlets_status !== "NO";

      const metadata = {
        ...(place.metadata || {}),
        wifi_status: newPlace.wifi_status,
        parking_status: newPlace.parking_status,
        outlets_status: newPlace.outlets_status,
        outdoor_status: newPlace.outdoor_status,
        view_status: newPlace.view_status,
        coffee_price: newPlace.coffee_price,
        areas: newPlace.areas,
        google_place_id: newPlace.google_place_id || place.metadata?.google_place_id,
      };

      await client.workplaces.updatePlace({
        id: place.id,
        userId: user.id,
        name: newPlace.name,
        note: newPlace.note,
        url: newPlace.url,
        wifi: wifiBool,
        parking: parkingBool,
        power_outlets: powerBool,
        quiet_level: newPlace.quiet_level,
        tags: newPlace.tags.split(",").map((t) => t.trim()).filter(Boolean),
        metadata: metadata,
        google_place_id: newPlace.google_place_id || place.metadata?.google_place_id,
      });
      toast.success("Mekan başarıyla güncellendi");
      setShowEditModal(false);
      loadPlace();
    } catch (err) {
      console.error("Failed to save place:", err);
      toast.error("İşlem başarısız oldu");
    } finally {
      setStatusLoading(false);
    }
  };

  const mapsHref =
    place?.url ||
    (place?.latitude != null && place?.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      : place?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
        : undefined);

  const todayDay = new Date().getDay();
  const todayText = useMemo(() => {
    if (!place?.metadata?.opening_hours?.weekday_text) return null;
    const weekdayText = place.metadata.opening_hours.weekday_text;
    const googleIndex = todayDay === 0 ? 6 : todayDay - 1;
    const rawText = weekdayText[googleIndex] || null;
    if (!rawText) return null;

    const formatted = formatTo24Hour(rawText);
    const firstColon = formatted.indexOf(":");
    if (firstColon === -1) return formatted;

    const timePart = formatted.substring(firstColon + 1).trim(); // e.g. "08:00–00:00"
    const parts = timePart.split(/[–\-]/);
    if (parts.length === 2 && place.metadata.opening_hours?.open_now) {
      const closeTime = parts[1].trim();
      if (closeTime === "00:00") {
        return "00:00'a kadar açık";
      }
      let suffix = "a";
      if (closeTime.endsWith(":30")) {
        suffix = "a"; // otuz'a
      } else if (closeTime.endsWith(":00")) {
        const hour = closeTime.split(":")[0];
        if (hour === "22" || hour === "02" || hour === "12") {
          suffix = "ye"; // iki'ye
        } else if (hour === "19" || hour === "09") {
          suffix = "a"; // dokuz'a
        } else if (hour === "16" || hour === "06") {
          suffix = "ya"; // altı'ya
        } else {
          suffix = "e"; // yirmi'ye, yedi'ye, sekiz'e, bir'e, üç'e etc.
        }
      }
      return `${closeTime}'${suffix} kadar açık`;
    }
    return timePart;
  }, [place, todayDay]);

  const parkingText = useMemo(() => {
    if (Array.isArray(place?.metadata?.parking_status)) {
      if (place.metadata.parking_status.length === 0) return "Yok";
      return place.metadata.parking_status.map((k: string) => parkingLabels[k] || k).join(", ");
    }
    return parkingLabels[place?.metadata?.parking_status] || (place?.parking ? "Var" : "Yok");
  }, [place]);

  const areasText = useMemo(() => {
    if (Array.isArray(place?.metadata?.areas)) {
      if (place.metadata.areas.length === 0) return "Belirtilmemiş";
      return place.metadata.areas.map((k: string) => areaLabels[k] || k).join(", ");
    }
    return "Belirtilmemiş";
  }, [place]);

  const coffeePriceText = useMemo(() => {
    return priceLabels[place?.metadata?.coffee_price] || "Belirtilmemiş";
  }, [place]);

  const quietLevelText = useMemo(() => {
    if (!place?.quiet_level) return "Orta";
    const labels: Record<number, string> = {
      1: "Çok Gürültülü",
      2: "Gürültülü",
      3: "Orta",
      4: "Sessiz",
      5: "Çok Sessiz",
    };
    return labels[place.quiet_level] || "Orta";
  }, [place]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
            <p className="text-neutral-500 font-medium">{t("detail.loading")}</p>
          </div>
        ) : error || !place ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300 px-6">
            <Coffee size={40} className="text-neutral-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900">
              {error ?? t("detail.notFound")}
            </h2>
            <Link
              href="/apps/workplaces"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 transition-colors"
            >
              <ArrowLeft size={18} weight="bold" />
              {t("detail.backToList")}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Section: Header & Image Gallery (Spans full width) */}
            <article className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {place.district && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200">
                        {place.district}
                      </span>
                    )}
                    {place.rating != null && (
                      <span className="px-2.5 py-1 bg-neutral-50 text-neutral-800 text-xs font-bold rounded-lg border border-neutral-200 flex items-center gap-1">
                        <span className="text-amber-500">★</span>
                        {place.rating}
                        {place.user_ratings_total != null && (
                          <span className="text-neutral-400 font-normal text-[10px]">
                            ({place.user_ratings_total})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/apps/workplaces")}
                      className="p-2 -ml-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
                      aria-label="Geri Dön"
                    >
                      <ArrowLeft size={22} weight="bold" />
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                      {place.name}
                    </h2>
                  </div>

                  {place.address && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-neutral-500">
                      <div className="flex items-start gap-2">
                        <MapPin size={18} className="shrink-0 mt-0.5 text-amber-700" />
                        <span>{place.address}</span>
                      </div>
                      {mapsHref && (
                        <a
                          href={mapsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 font-bold rounded-lg transition-all text-[11px] no-underline"
                        >
                          <ArrowSquareOut size={13} weight="bold" />
                          {t("detail.openMaps")}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions inline inside the card */}
                <div className="flex items-center gap-1.5 shrink-0 self-start md:self-center">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Mekanı Düzenle"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeletePlace}
                        disabled={statusLoading}
                        className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Mekanı Sil"
                      >
                        <Trash size={20} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={statusLoading}
                    className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                      place.is_favorite
                        ? "bg-rose-500 text-white"
                        : "text-neutral-500 hover:bg-rose-50 hover:text-rose-500"
                    } disabled:opacity-50`}
                    aria-label={place.is_favorite ? t("aria.removeWantToGo") : t("aria.addWantToGo")}
                  >
                    <Heart size={20} weight={place.is_favorite ? "fill" : "regular"} />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleVisited}
                    disabled={statusLoading}
                    className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                      place.is_visited
                        ? "bg-emerald-600 text-white"
                        : "text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600"
                    } disabled:opacity-50`}
                    aria-label={place.is_visited ? t("aria.removeVisited") : t("aria.addVisited")}
                  >
                    <CheckCircle size={20} weight={place.is_visited ? "fill" : "regular"} />
                  </button>
                </div>
              </div>

              {/* Photo Gallery Grid - Scrollable horizontal row */}
              {place.metadata?.photos && place.metadata.photos.length > 0 ? (
                <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-none snap-x snap-mandatory">
                  {place.metadata.photos.map((photoUrl: string, idx: number) => (
                    <div key={idx} className="relative aspect-video w-[70vw] sm:w-[280px] md:w-[320px] shrink-0 rounded-2xl overflow-hidden bg-neutral-100 group shadow-sm border border-neutral-200/50 snap-start">
                      <img
                        src={photoUrl}
                        alt={`${place.name} - Görsel ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                place.image_url && (
                  <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200/50">
                    <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                  </div>
                )
              )}
            </article>

            {/* Bottom Section: Split Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bottom Left: Notes, Tags & Amenities */}
              <div className="lg:col-span-2 space-y-6">
                {/* Amenities Card (7 items grid) */}
                <article className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-450">Özellikler & İmkanlar</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <AmenityCard
                      label="WiFi"
                      statusText={wifiLabels[place.metadata?.wifi_status] || (place.wifi ? "Var" : "Yok")}
                      active={place.metadata?.wifi_status !== "NO" && place.wifi}
                      icon={<WifiHigh size={20} />}
                    />
                    <AmenityCard
                      label="Otopark"
                      statusText={parkingText}
                      active={place.parking}
                      icon={<Car size={20} />}
                    />
                    <AmenityCard
                      label="Priz"
                      statusText={outletsLabels[place.metadata?.outlets_status] || (place.power_outlets ? "Var" : "Yok")}
                      active={place.metadata?.outlets_status !== "NO" && place.power_outlets}
                      icon={<Plug size={20} />}
                    />
                    <AmenityCard
                      label="Mevcut Alanlar"
                      statusText={areasText}
                      active={Array.isArray(place.metadata?.areas) && place.metadata.areas.length > 0}
                      icon={<House size={20} />}
                    />
                    <AmenityCard
                      label="Manzara"
                      statusText={viewLabels[place.metadata?.view_status] || "Yok"}
                      active={place.metadata?.view_status !== "NO" && place.metadata?.view_status}
                      icon={<Eye size={20} />}
                    />
                    <AmenityCard
                      label="Sessizlik"
                      statusText={quietLevelText}
                      active={place.quiet_level >= 3}
                      icon={<SpeakerLow size={20} />}
                    />
                    <AmenityCard
                      label="Kahve Fiyatı"
                      statusText={coffeePriceText}
                      active={place.metadata?.coffee_price !== "EXPENSIVE"}
                      icon={<Coins size={20} />}
                    />
                  </div>
                </article>

                {(place.note || place.tags.length > 0) && (
                  <article className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm">
                    {place.note && (
                      <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                        <p className="text-xs font-bold text-neutral-455 uppercase tracking-wider mb-2">{t("detail.notes")}</p>
                        <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {place.note}
                        </p>
                      </div>
                    )}

                    {place.tags.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-neutral-455 uppercase tracking-wider mb-3">{t("detail.tags")}</p>
                        <div className="flex flex-wrap gap-2">
                          {place.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1.5 bg-neutral-50 border border-neutral-150 text-neutral-600 text-xs font-bold rounded-xl flex items-center gap-1.5"
                            >
                              <Tag size={13} className="text-neutral-400" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                )}
              </div>

              {/* Bottom Right: Hours & Contact */}
              <div className="space-y-6">

                {/* Hours / Contact Card */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-450">İletişim & Çalışma Saatleri</p>

                  {place.metadata?.phone && (
                    <div className="flex items-center gap-3 text-sm text-neutral-600 font-medium">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                        <Phone size={18} />
                      </div>
                      <a href={`tel:${place.metadata.phone}`} className="hover:text-amber-800 transition-colors font-bold text-xs truncate">
                        {place.metadata.phone}
                      </a>
                    </div>
                  )}
                  {place.metadata?.website && (
                    <div className="flex items-center gap-3 text-sm text-neutral-600 font-medium">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                        <Globe size={18} />
                      </div>
                      <a href={place.metadata.website} target="_blank" rel="noopener noreferrer" className="hover:text-amber-800 transition-colors font-bold text-xs truncate">
                        {place.metadata.website}
                      </a>
                    </div>
                  )}
                  {place.metadata?.opening_hours && (
                    <div className="border-t border-neutral-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                        className="flex items-center justify-between w-full hover:bg-neutral-50 p-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                          <Clock size={18} className="text-amber-700 shrink-0" />
                          {place.metadata.opening_hours.open_now !== undefined && (
                            <span className={`font-extrabold ${place.metadata.opening_hours.open_now ? "text-emerald-700" : "text-rose-700"}`}>
                              {place.metadata.opening_hours.open_now ? "Açık" : "Kapalı"}
                            </span>
                          )}
                          {todayText && (
                            <span className="text-[11px] text-neutral-400 font-bold hidden sm:inline">
                              • {todayText}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <motion.span
                            animate={{ rotate: isHoursExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-neutral-500 flex items-center"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.span>
                        </div>
                      </button>

                      {isHoursExpanded && place.metadata.opening_hours.weekday_text && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pl-7 pt-1.5 space-y-1 text-xs text-neutral-500 font-bold border-l-2 border-amber-150 ml-2 mt-1"
                        >
                          {place.metadata.opening_hours.weekday_text.map((text: string, idx: number) => {
                            const isToday = idx === (todayDay === 0 ? 6 : todayDay - 1);
                            return (
                              <li key={idx} className={`${isToday ? "text-amber-800 font-extrabold" : "text-neutral-500"}`}>
                                {formatTo24Hour(text)}
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-neutral-900">Mekanı Düzenle</h2>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 cursor-pointer"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1 no-scrollbar">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Mekan Adı</label>
                  <input
                    required
                    type="text"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border border-neutral-200 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Notlar / Açıklama</label>
                  <textarea
                    value={newPlace.note}
                    onChange={(e) => setNewPlace({ ...newPlace, note: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border border-neutral-200 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all h-24 resize-none text-xs text-neutral-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Harita Linki (Google Maps)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newPlace.url}
                      onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                      className="flex-1 min-w-0 px-4 py-2 bg-neutral-100 border border-neutral-200 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                    />
                    {(newPlace.google_place_id || place?.metadata?.google_place_id || (newPlace.url ? newPlace.url.match(/place_id:([^&\?#]+)/)?.[1] : null)) && (
                      <button
                        type="button"
                        onClick={handleSyncFromMaps}
                        className="px-3 bg-amber-50 hover:bg-amber-100 text-amber-850 font-bold border border-amber-200 rounded-xl transition-colors text-xs cursor-pointer whitespace-nowrap"
                        title="Google Maps üzerinden verileri çeker"
                      >
                        Maps'ten Güncelle
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges selects */}
                <div className="grid grid-cols-1 gap-4 py-2 border-y border-neutral-100 my-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">WiFi Durumu</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(wifiLabels).map(([key, label]) => {
                        const isSelected = newPlace.wifi_status === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, wifi_status: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Kahve Fiyatı</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(priceLabels).map(([key, label]) => {
                        const isSelected = newPlace.coffee_price === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, coffee_price: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Priz / Güç Çıkışı</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(outletsLabels).map(([key, label]) => {
                        const isSelected = newPlace.outlets_status === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, outlets_status: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Manzara</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(viewLabels).map(([key, label]) => {
                        const isSelected = newPlace.view_status === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, view_status: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Otopark Seçenekleri</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(parkingLabels).map(([key, label]) => {
                        if (key === "NO") return null;
                        const isSelected = Array.isArray(newPlace.parking_status)
                          ? newPlace.parking_status.includes(key)
                          : false;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              let current = Array.isArray(newPlace.parking_status) ? [...newPlace.parking_status] : [];
                              if (current.includes(key)) {
                                current = current.filter((k) => k !== key);
                              } else {
                                current.push(key);
                              }
                              setNewPlace({ ...newPlace, parking_status: current });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Mevcut Alanlar</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(areaLabels).map(([key, label]) => {
                        const isSelected = Array.isArray(newPlace.areas)
                          ? newPlace.areas.includes(key)
                          : false;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              let current = Array.isArray(newPlace.areas) ? [...newPlace.areas] : [];
                              if (current.includes(key)) {
                                current = current.filter((k) => k !== key);
                              } else {
                                current.push(key);
                              }
                              setNewPlace({ ...newPlace, areas: current });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Etiketler (Virgülle ayırın)</label>
                  <input
                    type="text"
                    value={newPlace.tags}
                    onChange={(e) => setNewPlace({ ...newPlace, tags: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border border-neutral-200 focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors text-xs cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl transition-colors shadow-sm text-xs cursor-pointer"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const wifiLabels: Record<string, string> = {
  NO: "Yok",
  FREE_FAST: "Ücretsiz & Hızlı",
  FREE_SLOW: "Ücretsiz & Yavaş",
  PAID: "Ücretli",
};

const parkingLabels: Record<string, string> = {
  NO: "Yok",
  FREE: "Ücretsiz Otopark",
  PAID: "Ücretli Otopark",
  STREET: "Yol Üstü Park",
};

const outletsLabels: Record<string, string> = {
  NO: "Yok",
  PLENTY: "Fazlaca Priz",
  SOME: "Yeterli Priz",
  FEW: "Çok Az Priz",
};

const outdoorLabels: Record<string, string> = {
  NO: "Kapalı Alan",
  GARDEN: "Bahçe / Avlu",
  TERRACE: "Teras / Balkon",
};

const viewLabels: Record<string, string> = {
  NO: "Manzara Yok",
  SEA: "Deniz Manzarası",
  PARK: "Park / Yeşil Alan",
  CITY: "Şehir Manzarası",
};

const priceLabels: Record<string, string> = {
  CHEAP: "Uygun / Ucuz",
  MODERATE: "Orta / Normal",
  EXPENSIVE: "Pahalı / Yüksek",
};

const areaLabels: Record<string, string> = {
  INDOOR: "İç Mekan",
  GARDEN: "Bahçe",
  TERRACE: "Teras",
  STUDY_ZONE: "Çalışma Masaları",
};

function AmenityCard({
  label,
  statusText,
  active,
  icon,
}: {
  label: string;
  statusText: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all ${active
          ? "bg-amber-50/70 border-amber-200/80 text-amber-900 shadow-sm"
          : "bg-neutral-50 border-neutral-100 text-neutral-450"
        }`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${active ? "bg-amber-100 text-amber-800" : "bg-neutral-150 text-neutral-400"}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">{label}</p>
        <p className={`text-xs font-bold truncate ${active ? "text-amber-950" : "text-neutral-500"}`} title={statusText}>
          {statusText}
        </p>
      </div>
    </div>
  );
}

function PlaceDetailFallback() {
  const t = useTranslations("workplaces");

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
      <p className="text-neutral-500 font-medium">{t("detail.loading")}</p>
    </div>
  );
}

export default function WorkplacesPlacePage() {
  return (
    <Suspense fallback={<PlaceDetailFallback />}>
      <PlaceDetailContent />
    </Suspense>
  );
}

function formatTo24Hour(text: string): string {
  if (!text) return text;
  return text.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, hh, mm, ampm) => {
    let hour = parseInt(hh, 10);
    const m = ampm.toUpperCase();
    if (m === "PM" && hour < 12) {
      hour += 12;
    } else if (m === "AM" && hour === 12) {
      hour = 0;
    }
    const hourStr = hour.toString().padStart(2, "0");
    return `${hourStr}:${mm}`;
  });
}
