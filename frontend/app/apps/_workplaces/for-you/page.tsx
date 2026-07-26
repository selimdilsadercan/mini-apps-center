"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import { Heart, CheckCircle, MagnifyingGlass } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";
import { PlaceCard } from "../components/PlaceCard";

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
    <div className="min-h-screen bg-neutral-50 pb-28">
      {/* Header Info */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Heart className="text-rose-500 animate-pulse" weight="fill" />
            For You
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            Gitmek istediğin ve gittiğin favori mekanlarının listesi
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex gap-2">
          <button
            onClick={() => setActiveTab("wantToGo")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === "wantToGo"
                ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <Heart size={16} weight={activeTab === "wantToGo" ? "fill" : "regular"} />
            <span>{t("filters.wantToGo") || "Gitmek İstiyorum"}</span>
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "wantToGo" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>
              {places.filter(p => p.is_favorite).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("visited")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === "visited"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <CheckCircle size={16} weight={activeTab === "visited" ? "fill" : "regular"} />
            <span>{t("filters.visited") || "Gittim"}</span>
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "visited" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"}`}>
              {places.filter(p => p.is_visited).length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
            <p className="text-neutral-500 font-medium">{t("loading")}</p>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleVisited={handleToggleVisited}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === "wantToGo" ? (
                <Heart size={32} className="text-rose-400" />
              ) : (
                <CheckCircle size={32} className="text-emerald-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              {activeTab === "wantToGo" ? "Henüz ekleme yapmadın" : "Henüz mekan ziyaret etmedin"}
            </h3>
            <p className="text-neutral-500 text-sm mt-2 max-w-sm mx-auto">
              {activeTab === "wantToGo" 
                ? "Gitmek istediğin mekanların kalp simgesine basarak bu listeye ekleyebilirsin."
                : "Ziyaret ettiğin mekanları işaretleyerek burada listeleyebilirsin."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
