"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Compass,
  ForkKnife,
  Sparkle,
} from "@phosphor-icons/react";
import YTDBShell from "../components/YTDBShell";
import SeriesListItem from "../components/SeriesListItem";
import DiscoverRow from "../components/DiscoverRow";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { fetchSeries } from "../lib/api";
import { getUserStore, toggleWatchlist } from "../lib/store";
import { CONTEXT_DESCRIPTIONS } from "../lib/types";
import type { Series } from "../lib/types";

export default function KesfetPage() {
  return (
    <Suspense
      fallback={
        <YTDBShell activeTab="kesfet">
          <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
            Yükleniyor...
          </div>
        </YTDBShell>
      }
    >
      <KesfetContent />
    </Suspense>
  );
}

function KesfetContent() {
  const router = useRouter();
  const { isAdmin } = useIsAdmin();

  const [allSeriesData, setAllSeriesData] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [store, setStore] = useState<
    Record<string, { watchedEpisodes: string[]; inWatchlist: boolean }>
  >({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSeries();
        setAllSeriesData(data || []);
        setStore(getUserStore());
      } catch (err) {
        console.error("Yükleme hatası:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refreshStore = () => setStore(getUserStore());

  const handleToggleWatchlist = (seriesId: string) => {
    toggleWatchlist(seriesId);
    refreshStore();
  };

  const isSearching = query.trim().length > 0;

  const filtered = useMemo(() => {
    if (!isSearching) return [];

    const q = query.toLowerCase();
    return allSeriesData
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.creator.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .sort((a, b) => (b.episodeCount || 0) - (a.episodeCount || 0));
  }, [allSeriesData, query, isSearching]);

  const yemekSeries = useMemo(() => {
    return allSeriesData.filter((s) => s.contexts?.includes("yemek"));
  }, [allSeriesData]);

  const restSeries = useMemo(() => {
    const yemekIds = new Set(yemekSeries.map((s) => s.id));
    return allSeriesData.filter((s) => !yemekIds.has(s.id));
  }, [allSeriesData, yemekSeries]);

  if (loading) {
    return (
      <YTDBShell
        activeTab="kesfet"
        onAdmin={isAdmin ? () => router.push("/apps/youtube-discover/admin") : undefined}
      >
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </YTDBShell>
    );
  }

  return (
    <YTDBShell
      activeTab="kesfet"
      onAdmin={isAdmin ? () => router.push("/apps/youtube-discover/admin") : undefined}
    >
      <div className="space-y-6">
        <div className="relative">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted"
          />
          <input
            type="text"
            placeholder="Seri veya kanal ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 bg-app-surface border border-app-border rounded-xl pl-9 pr-4 text-sm font-bold text-app-text placeholder:text-app-muted outline-none focus:border-red-500/30 transition-colors"
          />
        </div>

        {isSearching ? (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1 mb-3">
              {filtered.length} sonuç
            </p>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border shadow-sm">
                <Compass size={40} className="text-app-muted mx-auto mb-3" weight="duotone" />
                <p className="text-sm font-black text-app-text mb-1">Eşleşme bulunamadı</p>
                <p className="text-xs font-medium text-app-muted mb-4">Farklı bir arama dene.</p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:underline"
                >
                  Aramayı temizle
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => (
                  <SeriesListItem
                    key={s.id}
                    series={s}
                    inWatchlist={!!store[s.id]?.inWatchlist}
                    onToggleWatchlist={() => handleToggleWatchlist(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : allSeriesData.length === 0 ? (
          <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border shadow-sm">
            <Compass size={40} className="text-app-muted mx-auto mb-3" weight="duotone" />
            <p className="text-sm font-black text-app-text mb-1">Henüz seri yok</p>
            <p className="text-xs font-medium text-app-muted">Yakında burada içerikler olacak.</p>
          </div>
        ) : (
          <>
            <DiscoverRow
              title="Yemek yerken"
              subtitle={CONTEXT_DESCRIPTIONS.yemek}
              icon={<ForkKnife size={14} weight="fill" className="text-orange-500" />}
              items={yemekSeries}
            />

            {(restSeries.length > 0 || yemekSeries.length === 0) && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Sparkle size={14} weight="fill" className="text-red-500" />
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-app-text">
                    Tüm seriler
                  </h3>
                </div>
                <div className="space-y-2">
                  {(yemekSeries.length === 0 ? allSeriesData : restSeries).map((s) => (
                    <SeriesListItem
                      key={s.id}
                      series={s}
                      inWatchlist={!!store[s.id]?.inWatchlist}
                      onToggleWatchlist={() => handleToggleWatchlist(s.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </YTDBShell>
  );
}
