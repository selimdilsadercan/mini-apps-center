"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookmarkSimple,
  Trash,
  Play,
  CheckCircle,
  HourglassSimple,
} from "@phosphor-icons/react";
import YTDBShell from "../components/YTDBShell";
import SeriesListItem from "../components/SeriesListItem";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { fetchSeries } from "../lib/api";
import { getUserStore, getWatchProgress, toggleWatchlist } from "../lib/store";
import type { Series } from "../lib/types";

export default function ListemPage() {
  const router = useRouter();
  const { isAdmin } = useIsAdmin();
  const [store, setStore] = useState<
    Record<string, { watchedEpisodes: string[]; inWatchlist: boolean }>
  >({});
  const [allSeriesData, setAllSeriesData] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSeries();
        setAllSeriesData(data || []);
        setStore(getUserStore());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refresh = () => setStore(getUserStore());

  const watchlistIds = Object.keys(store).filter((id) => store[id]?.inWatchlist);
  const watchlistSeries = allSeriesData.filter((s) => watchlistIds.includes(s.id));

  const inProgressSeries = watchlistSeries.filter((s) => {
    const data = store[s.id];
    if (!data) return false;
    const watched = data.watchedEpisodes.length;
    return watched > 0 && watched < (s.episodes?.length || s.episodeCount || 0);
  });

  const notStartedSeries = watchlistSeries.filter((s) => {
    const data = store[s.id];
    return !data || data.watchedEpisodes.length === 0;
  });

  const completedSeries = watchlistSeries.filter((s) => {
    const data = store[s.id];
    if (!data) return false;
    return data.watchedEpisodes.length >= (s.episodes?.length || s.episodeCount || 0);
  });

  const handleRemove = (seriesId: string) => {
    toggleWatchlist(seriesId);
    refresh();
  };

  if (loading) {
    return (
      <YTDBShell
        activeTab="listem"
        onAdmin={isAdmin ? () => router.push("/apps/youtube-discover/admin") : undefined}
      >
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </YTDBShell>
    );
  }

  if (watchlistSeries.length === 0) {
    return (
      <YTDBShell
        activeTab="listem"
        onAdmin={isAdmin ? () => router.push("/apps/youtube-discover/admin") : undefined}
      >
        <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center shadow-sm">
          <BookmarkSimple size={40} className="text-app-muted mb-4" weight="duotone" />
          <p className="text-sm font-black text-app-text mb-1">Listen boş</p>
          <p className="text-xs font-medium text-app-muted mb-5 max-w-[240px]">
            Keşfet sayfasından favorilerini eklemeye başla.
          </p>
          <Link
            href="/apps/youtube-discover/kesfet"
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95"
          >
            İçerikleri Keşfet
          </Link>
        </div>
      </YTDBShell>
    );
  }

  const Section = ({
    title,
    icon,
    items,
    showProgress,
    faded,
  }: {
    title: string;
    icon: React.ReactNode;
    items: Series[];
    showProgress?: boolean;
    faded?: boolean;
  }) => {
    if (items.length === 0) return null;
    return (
      <section className={`space-y-3 ${faded ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2 px-1">
          {icon}
          <h3 className="text-[10px] font-black uppercase tracking-wider text-app-muted">
            {title}
          </h3>
        </div>
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="relative group">
              <SeriesListItem
                series={s}
                progress={
                  showProgress
                    ? getWatchProgress(
                        s.id,
                        s.episodes?.length || s.episodeCount || 0
                      )
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-app-surface border border-app-border text-app-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                aria-label="Listeden çıkar"
              >
                <Trash size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <YTDBShell
      activeTab="listem"
      onAdmin={isAdmin ? () => router.push("/apps/youtube-discover/admin") : undefined}
    >
      <div className="space-y-6">
        <p className="text-[12px] font-medium text-app-muted">
          {watchlistSeries.length} içeriği takip ediyorsun.
        </p>

        <Section
          title="Devam Et"
          icon={<Play size={14} weight="fill" className="text-red-500" />}
          items={inProgressSeries}
          showProgress
        />

        <Section
          title="Sırada"
          icon={<HourglassSimple size={14} weight="fill" className="text-blue-500" />}
          items={notStartedSeries}
        />

        <Section
          title="Tamamlananlar"
          icon={<CheckCircle size={14} weight="fill" className="text-emerald-500" />}
          items={completedSeries}
          faded
        />
      </div>
    </YTDBShell>
  );
}
