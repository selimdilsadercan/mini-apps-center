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
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
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

  const mapsHref =
    place?.url ||
    (place?.latitude != null && place?.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      : place?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
        : undefined);

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/apps/workplaces")}
            className="p-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label={t("aria.back")}
          >
            <ArrowLeft size={22} weight="bold" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              {t("detail.title")}
            </p>
            <h1 className="text-lg font-bold text-neutral-900 truncate">
              {place?.name ?? t("title")}
            </h1>
          </div>
          {place && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={statusLoading}
                className={`p-2.5 rounded-xl transition-colors ${
                  place.is_favorite
                    ? "bg-rose-500 text-white"
                    : "text-neutral-500 hover:bg-rose-50 hover:text-rose-500"
                } disabled:opacity-50`}
                aria-label={place.is_favorite ? t("aria.removeWantToGo") : t("aria.addWantToGo")}
              >
                <Heart size={22} weight={place.is_favorite ? "fill" : "regular"} />
              </button>
              <button
                type="button"
                onClick={handleToggleVisited}
                disabled={statusLoading}
                className={`p-2.5 rounded-xl transition-colors ${
                  place.is_visited
                    ? "bg-emerald-600 text-white"
                    : "text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600"
                } disabled:opacity-50`}
                aria-label={place.is_visited ? t("aria.removeVisited") : t("aria.addVisited")}
              >
                <CheckCircle size={22} weight={place.is_visited ? "fill" : "regular"} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
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
          <article className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="relative h-56 sm:h-72 w-full bg-neutral-100">
              {place.image_url ? (
                <img
                  src={place.image_url}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <Coffee size={64} weight="thin" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {place.is_favorite && (
                  <div className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                    <Heart size={14} weight="fill" />
                    {t("wantToGo")}
                  </div>
                )}
                {place.is_visited && (
                  <div className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle size={14} weight="fill" />
                    {t("visited")}
                  </div>
                )}
              </div>
              {place.district && (
                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md text-white text-sm font-bold rounded-full">
                  {place.district}
                </div>
              )}
              {place.rating != null && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-neutral-900 text-sm font-bold rounded-xl flex items-center gap-1 shadow-sm">
                  <span className="text-amber-500">★</span>
                  {place.rating}
                  {place.user_ratings_total != null && (
                    <span className="text-neutral-400 font-normal text-xs">
                      ({place.user_ratings_total})
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                {place.name}
              </h2>

              {place.address && (
                <p className="mt-2 text-sm text-neutral-500 flex items-start gap-2">
                  <MapPin size={18} className="shrink-0 mt-0.5 text-amber-700" />
                  <span>{place.address}</span>
                </p>
              )}

              {place.note && (
                <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <p className="text-sm font-bold text-neutral-700 mb-2">{t("detail.notes")}</p>
                  <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {place.note}
                  </p>
                </div>
              )}

              {place.tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-bold text-neutral-700 mb-3">{t("detail.tags")}</p>
                  <div className="flex flex-wrap gap-2">
                    {place.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-xl flex items-center gap-1.5"
                      >
                        <Tag size={14} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AmenityCard
                  label={t("amenity.wifi")}
                  active={place.wifi}
                  icon={<WifiHigh size={22} weight="bold" />}
                />
                <AmenityCard
                  label={t("amenity.parking")}
                  active={place.parking}
                  icon={<Car size={22} weight="bold" />}
                />
                <AmenityCard
                  label={t("amenity.power")}
                  active={place.power_outlets}
                  icon={<Plug size={22} weight="bold" />}
                />
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-neutral-700">
                  <SpeakerLow size={22} className="text-amber-700" />
                  <div>
                    <p className="text-sm font-bold">{t("amenity.quiet")}</p>
                    <p className="text-xs text-neutral-500">
                      {quietLevelLabel(place.quiet_level, t)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-6 rounded-full ${
                        level <= place.quiet_level ? "bg-amber-500" : "bg-neutral-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={statusLoading}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm border transition-colors disabled:opacity-50 ${
                    place.is_favorite
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  <Heart size={20} weight={place.is_favorite ? "fill" : "regular"} />
                  {t("wantToGo")}
                </button>
                <button
                  type="button"
                  onClick={handleToggleVisited}
                  disabled={statusLoading}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm border transition-colors disabled:opacity-50 ${
                    place.is_visited
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  <CheckCircle size={20} weight={place.is_visited ? "fill" : "regular"} />
                  {t("visited")}
                </button>
              </div>

              {mapsHref && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full py-4 bg-amber-700 text-white font-semibold rounded-2xl hover:bg-amber-800 transition-colors shadow-sm"
                >
                  <ArrowSquareOut size={20} weight="bold" />
                  {t("detail.openMaps")}
                </a>
              )}

              {place.suggested_by && (
                <p className="mt-6 text-center text-xs text-neutral-400">
                  {t("detail.suggestedBy", { name: place.suggested_by })}
                </p>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

function AmenityCard({
  label,
  active,
  icon,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  const t = useTranslations("workplaces");

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col items-center gap-2 text-center ${
        active
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-neutral-50 border-neutral-100 text-neutral-400"
      }`}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
      <span className="text-xs font-medium">
        {active ? t("amenity.yes") : t("amenity.no")}
      </span>
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
