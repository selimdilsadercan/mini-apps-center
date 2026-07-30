"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { campus_events, outdoor_activities, workplaces } from "@/lib/client";
import VenueOutdoorSection from "../components/venue/VenueOutdoorSection";
import VenueQuickLinks from "../components/venue/VenueQuickLinks";
import VenueRankedSection from "../components/venue/VenueRankedSection";
import { getOutdoorCategory } from "../lib/outdoor-categories";
import { getOutdoorCategoryId, hasWorkplaceDetails } from "../lib/venue-details";
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
  DotsThreeVertical,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";
import {
  DEFAULT_VENUE_CITY,
  VENUE_PRIMARY_TYPES,
} from "../lib/venue-types";
import { resolvePlaceImageSrc } from "../lib/place-image";
import { resolveMapsHref } from "../lib/maps-link";

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
  const outdoorId = searchParams.get("outdoorId");
  const { user, isLoaded: isUserLoaded } = useUser();

  const [place, setPlace] = useState<workplaces.Place | null>(null);
  const [outdoorVenue, setOutdoorVenue] = useState<outdoor_activities.Venue | null>(null);
  const [venueEvents, setVenueEvents] = useState<campus_events.CampusEvent[]>([]);
  const [hasMenu, setHasMenu] = useState(false);
  const [businessName, setBusinessName] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isHoursExpanded, setIsHoursExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

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
    types: ["cafe"] as string[],
    google_place_id: "",
    rating: "" as string | number,
    user_ratings_total: "" as string | number,
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

  const backHref = outdoorId ? "/apps/outdoor-activities" : "/apps/workplaces";

  const loadVenue = useCallback(async () => {
    if (!placeId && !outdoorId) {
      setLoading(false);
      setError(t("detail.noPlaceId"));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPlace(null);
      setOutdoorVenue(null);
      setVenueEvents([]);
      setHasMenu(false);
      setBusinessName(undefined);

      if (outdoorId) {
        const res = await client.outdoor_activities.getVenue(outdoorId);
        if (res.venue) {
          setOutdoorVenue(res.venue);
        } else {
          setError(t("detail.notFound"));
        }
        return;
      }

      let found: workplaces.Place | undefined;
      try {
        const res = await client.workplaces.getPlace(placeId!, {
          userId: user?.id,
        });
        found = res.place;
      } catch (getErr) {
        console.warn("getPlace failed, falling back to listPlaces:", getErr);
        const res = await client.workplaces.listPlaces({ userId: user?.id, city: DEFAULT_VENUE_CITY });
        found = res.places.find((p) => p.id === placeId);
      }

      if (found) {
        setPlace(found);

        if (found.businessId) {
          const [businessRes, menuRes, eventsRes] = await Promise.all([
            client.digital_menu.getBusiness(found.businessId).catch(() => null),
            client.digital_menu.getMenuData(found.businessId).catch(() => null),
            client.campus_events.getEvents({ businessId: found.businessId }).catch(() => null),
          ]);

          if (businessRes?.business) {
            setBusinessName(businessRes.business.name);
          }
          const menuItems = menuRes?.items?.length ?? 0;
          const menuCategories = menuRes?.categories?.length ?? 0;
          setHasMenu(menuItems > 0 || menuCategories > 0);
          setVenueEvents(eventsRes?.events ?? []);
        }
      } else {
        setError(t("detail.notFound"));
      }
    } catch (err) {
      console.error("Failed to fetch venue:", err);
      setError(t("detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [placeId, outdoorId, user?.id, client]);

  useEffect(() => {
    if (!isUserLoaded) return;
    loadVenue();
  }, [isUserLoaded, loadVenue]);

  useEffect(() => {
    setShowAdminMenu(false);
  }, [placeId, outdoorId]);

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
      types: place.types || ["cafe"],
      google_place_id: place.metadata?.google_place_id || (place.url ? place.url.match(/place_id:([^&\?#]+)/)?.[1] : "") || "",
      rating: place.rating ?? "",
      user_ratings_total: place.user_ratings_total ?? "",
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
        types: newPlace.types,
      });
      toast.success("Google Maps verileri başarıyla senkronize edildi!");
      setShowEditModal(false);
      loadVenue();
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

      const parseRating = (v: string | number | undefined) => {
        if (v === "" || v === undefined || v === null) return undefined;
        const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
        return Number.isNaN(n) ? undefined : n;
      };
      const parseReviewCount = (v: string | number | undefined) => {
        if (v === "" || v === undefined || v === null) return undefined;
        const n = typeof v === "number" ? v : parseInt(String(v).replace(/[^\d]/g, ""), 10);
        return Number.isNaN(n) ? undefined : n;
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
        types: newPlace.types,
        rating: parseRating(newPlace.rating),
        user_ratings_total: parseReviewCount(newPlace.user_ratings_total),
      });
      toast.success("Mekan başarıyla güncellendi");
      setShowEditModal(false);
      loadVenue();
    } catch (err) {
      console.error("Failed to save place:", err);
      toast.error("İşlem başarısız oldu");
    } finally {
      setStatusLoading(false);
    }
  };

  const mapsHref = place ? resolveMapsHref(place) : undefined;

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

  const isOutdoorOnly = !!outdoorVenue && !place;
  const outdoorCategoryId = isOutdoorOnly
    ? outdoorVenue?.category ?? null
    : place
      ? getOutdoorCategoryId(place)
      : null;
  const showWorkplaceDetails = !!place && hasWorkplaceDetails(place);
  const venueName = place?.name ?? outdoorVenue?.name ?? "";
  const venueDistrict = place?.district ?? outdoorVenue?.district ?? null;
  const venueCity = place?.city ?? outdoorVenue?.city ?? null;
  
  const venueRating = place ? place.internal_rating : (outdoorVenue?.rating ?? null);
  const venueRatingsTotal = place ? place.internal_review_count : null;

  const venueAddress =
    place?.address ??
    outdoorVenue?.address ??
    (outdoorVenue
      ? [outdoorVenue.district, outdoorVenue.city].filter(Boolean).join(", ")
      : null);
  const outdoorCategory = outdoorCategoryId ? getOutdoorCategory(outdoorCategoryId) : undefined;

  return (
    <div className="space-y-3 pb-24 sm:pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
            <p className="text-app-muted font-medium">{t("detail.loading")}</p>
          </div>
        ) : error || (!place && !outdoorVenue) ? (
          <div className="text-center py-12 bg-app-surface rounded-2xl border border-app-border px-6">
            <Coffee size={40} className="text-app-muted mx-auto mb-4" />
            <h2 className="text-sm font-bold text-app-text">
              {error ?? t("detail.notFound")}
            </h2>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-[#D97706] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={16} weight="bold" />
              {t("detail.backToList")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Hero image — mobile-first, edge-to-edge */}
            {place && resolvePlaceImageSrc(place.image_url) ? (
              <div className="-mx-4 relative aspect-[4/3] sm:aspect-[16/9] sm:mx-0 sm:rounded-2xl overflow-hidden bg-neutral-100 dark:bg-zinc-800 border-y sm:border border-app-border">
                <img
                  src={resolvePlaceImageSrc(place.image_url)}
                  alt={venueName}
                  className="w-full h-full object-cover"
                />
                <p className="absolute bottom-2 right-2 text-[9px] text-white/90 bg-black/40 px-2 py-0.5 rounded-full">
                  © Google
                </p>
              </div>
            ) : place?.metadata?.photos && place.metadata.photos.length > 0 ? (
              <div className="-mx-4 sm:mx-0 flex overflow-x-auto gap-2 pb-1 px-4 sm:px-0 scrollbar-none snap-x snap-mandatory">
                {place.metadata.photos.map((photoUrl: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/3] w-[88vw] sm:w-[280px] shrink-0 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-zinc-800 border border-app-border snap-start"
                  >
                    <img
                      src={photoUrl}
                      alt={`${venueName} - Görsel ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : outdoorVenue?.imageUrl ? (
              <div className="-mx-4 relative aspect-[4/3] sm:aspect-[16/9] sm:mx-0 sm:rounded-2xl overflow-hidden bg-neutral-100 dark:bg-zinc-800 border-y sm:border border-app-border">
                <img
                  src={outdoorVenue.imageUrl}
                  alt={venueName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            {/* Title & badges */}
            <article className="relative bg-app-surface rounded-2xl border border-app-border p-4 space-y-3">
              {place && isAdmin && (
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    onClick={() => setShowAdminMenu((open) => !open)}
                    className="p-1.5 rounded-lg text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="Yönetim menüsü"
                  >
                    <DotsThreeVertical size={20} weight="bold" />
                  </button>
                  {showAdminMenu && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Menüyü kapat"
                        onClick={() => setShowAdminMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 min-w-[9.5rem] rounded-xl border border-app-border bg-app-surface shadow-lg py-1 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminMenu(false);
                            handleEditClick();
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold text-app-text hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Pencil size={16} />
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminMenu(false);
                            handleDeletePlace();
                          }}
                          disabled={statusLoading}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash size={16} />
                          Sil
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className={`flex flex-wrap items-center gap-1.5 ${place && isAdmin ? "pr-8" : ""}`}>
                {venueDistrict && (
                  <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-[10px] font-bold rounded-md border border-amber-200 dark:border-amber-800/60">
                    {venueDistrict}
                  </span>
                )}
                {!venueDistrict && venueCity && (
                  <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-[10px] font-bold rounded-md border border-amber-200 dark:border-amber-800/60">
                    {venueCity}
                  </span>
                )}
                {outdoorCategory && (
                  <span className="px-2 py-0.5 bg-[#0F766E]/10 text-[#0F766E] text-[10px] font-bold rounded-md border border-[#0F766E]/20">
                    {outdoorCategory.name}
                  </span>
                )}
                {venueRating != null && (
                  <span className="px-2 py-0.5 bg-neutral-50 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-[10px] font-bold rounded-md border border-neutral-200 dark:border-zinc-700 flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    {typeof venueRating === 'number' ? venueRating.toFixed(1) : venueRating}
                    {venueRatingsTotal != null && venueRatingsTotal > 0 && (
                      <span className="text-neutral-400 dark:text-zinc-500 font-normal">
                        ({venueRatingsTotal})
                      </span>
                    )}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-extrabold text-app-text tracking-tight leading-tight">
                {venueName}
              </h2>

              {venueAddress && (
                <div className="space-y-2">
                  <p className="text-sm text-app-muted leading-snug">{venueAddress}</p>
                  {mapsHref && (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/60 font-bold rounded-xl transition-all text-xs no-underline"
                    >
                      <ArrowSquareOut size={14} weight="bold" />
                      {t("detail.openMaps")}
                    </a>
                  )}
                </div>
              )}

              {place && (
                <div className="hidden sm:flex items-center gap-2 pt-1 border-t border-app-border">
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={statusLoading}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                      place.is_favorite
                        ? "bg-rose-500 text-white"
                        : "border border-app-border text-app-muted hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    }`}
                  >
                    <Heart size={16} weight={place.is_favorite ? "fill" : "regular"} />
                    {place.is_favorite ? "Listede" : "Gitmek istiyorum"}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleVisited}
                    disabled={statusLoading}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                      place.is_visited
                        ? "bg-emerald-600 text-white"
                        : "border border-app-border text-app-muted hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    <CheckCircle size={16} weight={place.is_visited ? "fill" : "regular"} />
                    {place.is_visited ? "Gittim" : "Gittim de"}
                  </button>
                </div>
              )}
            </article>

            {place?.businessId && (
              <VenueQuickLinks
                businessId={place.businessId}
                businessName={businessName}
                events={venueEvents}
                hasMenu={hasMenu}
              />
            )}

            {place && (
              <VenueRankedSection placeId={place.id} city={place.city} />
            )}

            {place && (
              <div className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-app-muted">
                  İletişim & Çalışma Saatleri
                </p>

                {place.metadata?.phone && (
                  <a
                    href={`tel:${place.metadata.phone}`}
                    className="flex items-center gap-3 text-sm text-app-muted font-medium no-underline"
                  >
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shrink-0">
                      <Phone size={18} />
                    </div>
                    <span className="font-bold text-xs">{place.metadata.phone}</span>
                  </a>
                )}
                {place.metadata?.website && (
                  <a
                    href={place.metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-app-muted font-medium no-underline"
                  >
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shrink-0">
                      <Globe size={18} />
                    </div>
                    <span className="font-bold text-xs truncate">{place.metadata.website}</span>
                  </a>
                )}
                {place.metadata?.opening_hours && (
                  <div className="border-t border-app-border pt-3">
                    <button
                      type="button"
                      onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                      className="flex items-center justify-between w-full hover:bg-neutral-50 dark:hover:bg-zinc-800/60 p-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 text-xs text-app-muted min-w-0">
                        <Clock size={18} className="text-amber-700 dark:text-amber-500 shrink-0" />
                        {place.metadata.opening_hours.open_now !== undefined && (
                          <span
                            className={`font-extrabold shrink-0 ${place.metadata.opening_hours.open_now ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                          >
                            {place.metadata.opening_hours.open_now ? "Açık" : "Kapalı"}
                          </span>
                        )}
                        {todayText && (
                          <span className="text-[11px] text-app-muted font-bold truncate">
                            • {todayText}
                          </span>
                        )}
                      </div>
                      <motion.span
                        animate={{ rotate: isHoursExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-app-muted flex items-center shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.span>
                    </button>

                    {isHoursExpanded && place.metadata.opening_hours.weekday_text && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="pl-7 pt-1.5 space-y-1 text-xs text-app-muted font-bold border-l-2 border-amber-200 dark:border-amber-800 ml-2 mt-1"
                      >
                        {place.metadata.opening_hours.weekday_text.map((text: string, idx: number) => {
                          const isToday = idx === (todayDay === 0 ? 6 : todayDay - 1);
                          return (
                            <li
                              key={idx}
                              className={`${isToday ? "text-amber-800 dark:text-amber-300 font-extrabold" : "text-app-muted"}`}
                            >
                              {formatTo24Hour(text)}
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {outdoorCategoryId && (
              <VenueOutdoorSection
                categoryId={outdoorCategoryId}
                websiteUrl={
                  isOutdoorOnly
                    ? outdoorVenue?.websiteUrl
                    : place?.metadata?.website || place?.url
                }
              />
            )}

            {showWorkplaceDetails && place && (
              <article className="bg-app-surface rounded-2xl border border-app-border p-4 shadow-sm space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-app-muted">
                  Özellikler & İmkanlar
                </p>
                <div className="grid grid-cols-2 gap-2">
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
                )}

            {place && (
              <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-app-border bg-app-bg/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
                <div className="flex gap-2 max-w-5xl mx-auto">
                  {mapsHref && (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2.5 rounded-xl bg-app-surface border border-app-border text-app-muted transition-colors no-underline shrink-0"
                      aria-label={t("detail.openMaps")}
                    >
                      <MapPin size={20} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={statusLoading}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                      place.is_favorite
                        ? "bg-rose-500 text-white"
                        : "bg-app-surface border border-app-border text-app-muted"
                    }`}
                    aria-label={place.is_favorite ? t("aria.removeWantToGo") : t("aria.addWantToGo")}
                  >
                    <Heart size={16} weight={place.is_favorite ? "fill" : "regular"} />
                    {place.is_favorite ? "Listede" : "Gitmek istiyorum"}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleVisited}
                    disabled={statusLoading}
                    className={`flex items-center justify-center p-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                      place.is_visited
                        ? "bg-emerald-600 text-white"
                        : "bg-app-surface border border-app-border text-app-muted"
                    }`}
                    aria-label={place.is_visited ? t("aria.removeVisited") : t("aria.addVisited")}
                  >
                    <CheckCircle size={20} weight={place.is_visited ? "fill" : "regular"} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
              className="relative w-full max-w-lg bg-app-surface rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-app-border"
            >
              <div className="px-6 py-4 border-b border-app-border flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-app-text">Mekanı Düzenle</h2>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-800 hover:text-app-text cursor-pointer"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1 no-scrollbar">
                <div>
                  <label className="block text-sm font-medium text-app-text mb-1">Mekan Adı</label>
                  <input
                    required
                    type="text"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 focus:bg-app-surface focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-app-text font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text mb-1">Notlar / Açıklama</label>
                  <textarea
                    value={newPlace.note}
                    onChange={(e) => setNewPlace({ ...newPlace, note: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 focus:bg-app-surface focus:border-amber-500 rounded-xl outline-none transition-all h-24 resize-none text-xs text-app-text font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text mb-1">Harita Linki (Google Maps)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newPlace.url}
                      onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                      className="flex-1 min-w-0 px-4 py-2 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 focus:bg-app-surface focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-app-text font-semibold"
                    />
                    {(newPlace.google_place_id || place?.metadata?.google_place_id || (newPlace.url ? newPlace.url.match(/place_id:([^&\?#]+)/)?.[1] : null)) && (
                      <button
                        type="button"
                        onClick={handleSyncFromMaps}
                        className="px-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800 rounded-xl transition-colors text-xs cursor-pointer whitespace-nowrap"
                        title="Google Maps üzerinden verileri çeker"
                      >
                        Maps'ten Güncelle
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-app-text mb-1">Google Maps Puanı</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={newPlace.rating ?? ""}
                      onChange={(e) => setNewPlace({ ...newPlace, rating: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 focus:bg-app-surface focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-app-text font-semibold"
                      placeholder="4.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app-text mb-1">Yorum Sayısı</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={newPlace.user_ratings_total ?? ""}
                      onChange={(e) => setNewPlace({ ...newPlace, user_ratings_total: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 focus:bg-app-surface focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-app-text font-semibold"
                      placeholder="246"
                    />
                  </div>
                </div>

                {/* Badges selects */}
                <div className="grid grid-cols-1 gap-4 py-2 border-y border-app-border my-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">Mekan Türleri</label>
                    <div className="flex flex-wrap gap-2">
                      {VENUE_PRIMARY_TYPES.map((type) => {
                        const isSelected = newPlace.types.includes(type.id);
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              const current = [...newPlace.types];
                              if (current.includes(type.id)) {
                                if (current.length > 1) {
                                  setNewPlace({ ...newPlace, types: current.filter(t => t !== type.id) });
                                }
                              } else {
                                current.push(type.id);
                                setNewPlace({ ...newPlace, types: current });
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                                : "bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-700"
                              }`}
                          >
                            {t(`venueTypes.${type.id}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">WiFi Durumu</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(wifiLabels).map(([key, label]) => {
                        const isSelected = newPlace.wifi_status === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, wifi_status: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                                : "bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-700"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">Kahve Fiyatı</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(priceLabels).map(([key, label]) => {
                        const isSelected = newPlace.coffee_price === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, coffee_price: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                                : "bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-700"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">Priz / Güç Çıkışı</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(outletsLabels).map(([key, label]) => {
                        const isSelected = newPlace.outlets_status === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, outlets_status: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                                : "bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-700"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">Manzara</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(viewLabels).map(([key, label]) => {
                        const isSelected = newPlace.view_status === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewPlace({ ...newPlace, view_status: key })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                                ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                                : "bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-700"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">Otopark Seçenekleri</label>
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
                                ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                                : "bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-700"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-1.5">Mevcut Alanlar</label>
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
                                ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                                : "bg-neutral-50 dark:bg-zinc-800 border-neutral-200 dark:border-zinc-700 text-app-muted hover:bg-neutral-100 dark:hover:bg-zinc-700"
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
                  <label className="block text-sm font-medium text-app-text mb-1">Etiketler (Virgülle ayırın)</label>
                  <input
                    type="text"
                    value={newPlace.tags}
                    onChange={(e) => setNewPlace({ ...newPlace, tags: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 focus:bg-app-surface focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-app-text font-semibold"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-app-border sticky bottom-0 bg-app-surface">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-zinc-800 text-app-text font-medium rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors text-xs cursor-pointer"
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
          ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-100 shadow-sm"
          : "bg-neutral-50 dark:bg-zinc-800/50 border-neutral-100 dark:border-zinc-700 text-app-muted"
        }`}
    >
      <div className={`p-2 rounded-xl shrink-0 ${active ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300" : "bg-neutral-100 dark:bg-zinc-700 text-neutral-400 dark:text-zinc-400"}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-app-muted">{label}</p>
        <p className={`text-xs font-bold truncate ${active ? "text-amber-950 dark:text-amber-100" : "text-app-text/70"}`} title={statusText}>
          {statusText}
        </p>
      </div>
    </div>
  );
}

function PlaceDetailFallback() {
  const t = useTranslations("workplaces");

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      <p className="text-xs text-app-muted font-medium">{t("detail.loading")}</p>
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
