"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import { Heart, CheckCircle } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { useTranslations } from "@/contexts/LanguageContext";
import { PlaceCard } from "../components/PlaceCard";
import { DEFAULT_VENUE_CITY } from "../lib/venue-types";

export default function ForYouPage() {
  const t = useTranslations("workplaces");
  const client = useMemo(() => createBrowserClient(), []);
  const { user } = useUser();
  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wantToGo" | "visited">("wantToGo");

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.workplaces.listPlaces({
        userId: user?.id,
        city: DEFAULT_VENUE_CITY,
      });
      setPlaces(res.places ?? []);
    } catch (err) {
      console.error("Failed to fetch places:", err);
      toast.error(t("toast.loadFailed"));
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, client]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleToggleFavorite = async (placeId: string) => {
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    try {
      const res = await client.workplaces.toggleFavorite({
        placeId,
        userId: user.id,
      });
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_favorite: res.isFavorite } : p,
        ),
      );
    } catch (err) {
      console.error("toggleFavorite failed:", err);
      toast.error(t("toast.updateFailed"));
    }
  };

  const handleToggleVisited = async (placeId: string) => {
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    try {
      const res = await client.workplaces.toggleVisited({
        placeId,
        userId: user.id,
      });
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_visited: res.isVisited } : p,
        ),
      );
    } catch (err) {
      console.error("toggleVisited failed:", err);
      toast.error(t("toast.updateFailed"));
    }
  };

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (activeTab === "wantToGo") {
        return place.is_favorite;
      } else {
        return place.is_visited;
      }
    });
  }, [places, activeTab]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-app-muted">
        Gitmek istediğin ve gittiğin favori mekanların listesi
      </p>

      <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl border border-app-border bg-app-tab-track">
        <button
          type="button"
          onClick={() => setActiveTab("wantToGo")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
            activeTab === "wantToGo"
              ? "bg-app-tab-active text-app-text shadow-sm"
              : "text-app-muted"
          }`}
        >
          <Heart size={14} weight={activeTab === "wantToGo" ? "fill" : "bold"} />
          <span>{t("filters.wantToGo") || "Gitmek İstiyorum"}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
            {places.filter((p) => p.is_favorite).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("visited")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
            activeTab === "visited"
              ? "bg-app-tab-active text-app-text shadow-sm"
              : "text-app-muted"
          }`}
        >
          <CheckCircle size={14} weight={activeTab === "visited" ? "fill" : "bold"} />
          <span>{t("filters.visited") || "Gittim"}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
            {places.filter((p) => p.is_visited).length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-xs text-app-muted font-medium">{t("loading")}</p>
        </div>
      ) : filteredPlaces.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden divide-y divide-gray-100/80 dark:divide-zinc-800/80">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onToggleFavorite={handleToggleFavorite}
              onToggleVisited={handleToggleVisited}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-app-surface rounded-2xl border border-app-border">
          {activeTab === "wantToGo" ? (
            <Heart size={32} className="mx-auto text-rose-400 mb-2" />
          ) : (
            <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
          )}
          <h3 className="text-sm font-bold text-app-text">
            {activeTab === "wantToGo" ? "Henüz ekleme yapmadın" : "Henüz mekan ziyaret etmedin"}
          </h3>
          <p className="text-xs text-app-muted mt-1 max-w-sm mx-auto">
            {activeTab === "wantToGo"
              ? "Gitmek istediğin mekanların kalp simgesine basarak bu listeye ekleyebilirsin."
              : "Ziyaret ettiğin mekanları işaretleyerek burada listeleyebilirsin."}
          </p>
        </div>
      )}
    </div>
  );
}
