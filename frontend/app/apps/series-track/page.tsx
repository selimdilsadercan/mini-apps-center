"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  MagnifyingGlass,
  Plus,
  CheckCircle,
  XCircle,
  Trash,
  Monitor,
  Calendar,
  Star,
  Info,
  ArrowSquareOut,
  Play,
  Television,
  PlayCircle,
  Clock,
  Smiley,
  TrendUp,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { series_track } from "@/lib/client";
import SeriesTrackShell from "./components/SeriesTrackShell";
import {
  CHANNEL_SLOT_TIMES,
  getChannelSlotPrograms,
  getProgramForSlot,
  pickDefaultSlotTime,
} from "./constants";

const client = createBrowserClient();

function readSeriesDeepLink() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const programId = params.get("program");
  if (!programId) return null;
  return {
    programId,
    episodeNumber: params.get("episode") ? Number(params.get("episode")) : undefined,
    episodeId: params.get("episodeId") ?? undefined,
  };
}

// ==================== FRONTEND CACHE ====================
const CACHE_KEYS = {
  DETAILS: 'seriestrack_details_cache_v2',
  SEASONS: 'seriestrack_seasons_cache',
};

const getLocalCache = (key: string) => {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    return {};
  }
};

const setLocalCache = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) { }
};

const STATUS_LABELS: Record<series_track.SeriesStatus, { label: string; color: string; bg: string }> = {
  watching: { label: "İzliyorum", color: "text-blue-600", bg: "bg-blue-50" },
  plan_to_watch: { label: "İzlemek İstiyorum", color: "text-zinc-500", bg: "bg-zinc-100" },
  completed: { label: "Bitti", color: "text-emerald-600", bg: "bg-emerald-50" },
  dropped: { label: "Yarım Bıraktım", color: "text-rose-600", bg: "bg-rose-50" },
};

// Self-contained card content for non-active slot programs — same design as the active (tvProgram) block
const TR_MONTHS_EPG = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
function EpgSlotProgCard({
  prog,
  accent,
  userId,
  allSeriesProgress,
  mySeries = [],
  onOpenSeriesDetail,
  onUpdateSeriesStatus,
}: {
  prog: series_track.TvProgramSummary;
  accent: string;
  userId: string;
  allSeriesProgress: Record<string, series_track.UserProgress[]>;
  mySeries?: series_track.UserSeries[];
  onOpenSeriesDetail?: (tmdbId: number) => void;
  onUpdateSeriesStatus?: (tmdbId: number, status: series_track.SeriesStatus) => void;
}) {
  const cardClient = createBrowserClient();
  const [tvProg, setTvProg] = useState<series_track.TvProgramDetails | null>(null);
  const [loadingProg, setLoadingProg] = useState(true);
  const [selectedEp, setSelectedEp] = useState<series_track.TvEpisode | null>(null);
  const [seasonEps, setSeasonEps] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(prog.season_number || 1);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [tmdbDetails, setTmdbDetails] = useState<any>(null);

  useEffect(() => {
    setLoadingProg(true);
    cardClient.series_track
      .getTvProgramDetails(prog.id, { userId })
      .then((details) => {
        setTvProg(details);
        setSelectedSeason(details.season_number || 1);
        const eps = details.episodes ?? [];
        const released = eps.filter((e) => e.is_released);
        const next = released.find((e) => !e.watched) ?? released[released.length - 1] ?? eps[0] ?? null;
        setSelectedEp(next);
      })
      .catch(console.error)
      .finally(() => setLoadingProg(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prog.id, userId]);

  useEffect(() => {
    if (!tvProg?.tmdb_id || !selectedSeason) return;
    setLoadingSeason(true);
    cardClient.series_track
      .getSeasonDetails(tvProg.tmdb_id, selectedSeason)
      .then((res: any) => setSeasonEps(res.episodes ?? []))
      .catch(console.error)
      .finally(() => setLoadingSeason(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvProg?.tmdb_id, selectedSeason]);

  useEffect(() => {
    if (!tvProg?.tmdb_id) return;
    cardClient.series_track
      .getSeriesDetails(tvProg.tmdb_id)
      .then((res: any) => setTmdbDetails(res))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvProg?.tmdb_id]);

  if (loadingProg) {
    return (
      <div className="mt-2 space-y-1.5 animate-pulse">
        <div className="h-3 bg-app-surface-muted rounded w-1/4" />
        <div className="h-3 bg-app-surface-muted rounded w-3/4" />
      </div>
    );
  }
  if (!tvProg) return null;

  const userSeriesRecord = mySeries.find((s) => s.tmdb_id === tvProg.tmdb_id);
  const isWatching = userSeriesRecord?.status === "watching";
  const isPlanToWatch = userSeriesRecord?.status === "plan_to_watch";

  const seriesProgress: series_track.UserProgress[] = userSeriesRecord
    ? allSeriesProgress[userSeriesRecord.id] || []
    : [];

  const isEpWatched = selectedEp
    ? !!(selectedEp.watched || seriesProgress?.some((p) => p.episode_number === selectedEp.episode_number && p.season_number === selectedSeason))
    : false;

  const isEpAvailable = selectedEp ? !!selectedEp.is_released : false;

  const handleWatch = () => {
    if (!selectedEp?.is_released) return;
    const query = encodeURIComponent(`${tvProg.title} ${selectedSeason}. sezon ${selectedEp.episode_number}. bölüm izle`);
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  };

  const handleToggleWatched = async () => {
    if (!selectedEp || !userId) return;
    try {
      const res = await cardClient.series_track.toggleTvEpisodeWatched(selectedEp.id, {
        userId,
      });
      setSelectedEp((prev) => (prev ? { ...prev, watched: res.watched } : null));
      toast.success(res.watched ? "Bölüm izlendi olarak işaretlendi!" : "İşaret kaldırıldı.");
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  return (
    <div className="p-3">
      <div className="flex gap-3 items-start">
        {/* Cover image */}
        <div
          className={`shrink-0 ${tvProg.tmdb_id ? "cursor-pointer group" : ""}`}
          onClick={() => tvProg.tmdb_id && onOpenSeriesDetail?.(tvProg.tmdb_id)}
        >
          {prog.cover_image ? (
            <img
              src={prog.cover_image}
              alt={prog.title}
              className="w-[72px] aspect-[2/3] object-cover rounded-xl border border-app-border group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-[72px] aspect-[2/3] rounded-xl border border-app-border bg-app-surface-muted flex items-center justify-center">
              <Television size={24} className="text-app-muted opacity-40" />
            </div>
          )}
        </div>

        {/* Right column: title + episode detail or status actions */}
        <div className="flex-1 min-w-0 flex gap-3">
          <div className="flex-1 min-w-0">
            <h2
              onClick={() => tvProg.tmdb_id && onOpenSeriesDetail?.(tvProg.tmdb_id)}
              className={`text-sm font-black text-app-text leading-snug line-clamp-2 ${
                tvProg.tmdb_id ? "cursor-pointer hover:underline" : ""
              }`}
            >
              {prog.title}
            </h2>
            {isWatching ? (
              loadingProg ? (
                <div className="mt-2 space-y-1.5 animate-pulse">
                  <div className="h-3 bg-app-surface-muted rounded w-1/4" />
                  <div className="h-3 bg-app-surface-muted rounded w-3/4" />
                </div>
              ) : selectedEp ? (
                <div className="mt-1 w-full text-left">
                  <p className="text-[10px] font-bold" style={{ color: accent }}>
                    S{selectedSeason} E{selectedEp.episode_number}
                  </p>
                  <h3 className="text-xs font-black text-app-text mt-0.5 leading-snug line-clamp-1">
                    {selectedEp.title}
                  </h3>
                  {selectedEp.description && (
                    <p className="text-[11px] text-app-muted leading-relaxed line-clamp-1 mt-0.5">
                      {selectedEp.description}
                    </p>
                  )}
                </div>
              ) : null
            ) : (
              <div className="mt-1">
                <p className="text-[10px] font-bold" style={{ color: accent }}>
                  S{selectedSeason} E{selectedEp?.episode_number ?? 1}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 shrink-0 justify-center">
            {isWatching ? (
              <>
                <button
                  disabled={!isEpAvailable}
                  onClick={handleWatch}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black transition-all ${
                    isEpAvailable
                      ? "bg-app-text text-app-bg hover:opacity-90 active:scale-[0.98]"
                      : "bg-app-surface-muted text-app-muted cursor-not-allowed opacity-50"
                  }`}
                >
                  <Play size={12} weight="fill" />
                  İzle
                </button>
                <button
                  disabled={!isEpAvailable}
                  onClick={handleToggleWatched}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black transition-all ${
                    !isEpAvailable
                      ? "bg-app-surface-muted text-app-muted cursor-not-allowed opacity-50"
                      : isEpWatched
                        ? "bg-emerald-500 text-white active:scale-[0.98]"
                        : "bg-app-tab-track text-app-text hover:bg-app-border active:scale-[0.98]"
                  }`}
                >
                  <CheckCircle size={13} weight={isEpWatched ? "fill" : "regular"} />
                  İzledim
                </button>
              </>
            ) : (
              <button
                onClick={() => tvProg.tmdb_id && onUpdateSeriesStatus?.(tvProg.tmdb_id, "watching")}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-[0.98]"
              >
                <Plus size={12} weight="bold" />
                Takip Et
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Episode strip below the flex row — shown only when watching */}
      {isWatching && (
        <div className="mt-3 pt-3 border-t border-app-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-app-muted">Bölümler</span>
            {tmdbDetails?.seasons && (
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="text-[10px] font-bold text-app-muted bg-app-tab-track border-0 rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                {tmdbDetails.seasons.map((s: { season_number: number }) => (
                  <option key={s.season_number} value={s.season_number}>
                    Sezon {s.season_number}
                  </option>
                ))}
              </select>
            )}
          </div>
          {loadingSeason ? (
            <div className="flex gap-1.5 overflow-hidden py-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="shrink-0 w-11 h-16 bg-app-tab-track rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto py-1 -mx-1 px-1 no-scrollbar min-w-0">
              {seasonEps.map((ep) => {
                const isSelected = ep.episode_number === selectedEp?.episode_number;
                const dbEpForDate = tvProg?.episodes?.find((e) => e.episode_number === ep.episode_number);
                const epDate = (() => {
                  if (dbEpForDate?.release_date) {
                    return new Date(dbEpForDate.release_date);
                  }
                  const activeSeason = tvProg.season_number || 1;
                  const activeEpisode = tvProg.episodes?.filter((e) => e.is_released).length || 1;
                  let offset = 0;
                  const targetSeason = selectedSeason;
                  const targetEpisode = ep.episode_number;
                  if (targetSeason === activeSeason) {
                    offset = targetEpisode - activeEpisode;
                  } else if (targetSeason > activeSeason) {
                    const activeSeasonCount = 16;
                    offset += activeSeasonCount - activeEpisode;
                    offset += targetEpisode;
                  } else {
                    const targetSeasonCount = 16;
                    offset -= activeEpisode;
                    offset -= targetSeasonCount - targetEpisode;
                  }
                  const baseDate = new Date(tvProg.start_date);
                  const daysPerEp = tvProg.schedule_type === "weekly" ? 7 : 1;
                  baseDate.setDate(baseDate.getDate() + offset * daysPerEp);
                  return baseDate;
                })();

                const day = epDate.getDate();
                const month = TR_MONTHS_EPG[epDate.getMonth()];
                const isReleased = epDate.getTime() <= Date.now();
                const isEpWatchedThis = (dbEpForDate?.watched ?? false) || seriesProgress?.some(
                  (p) => p.season_number === selectedSeason && p.episode_number === ep.episode_number
                );

                return (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEp(ep)}
                    className={`shrink-0 w-11 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95 relative ${
                      isSelected
                        ? "text-white shadow-sm"
                        : !isReleased
                          ? "bg-app-surface-muted text-app-muted hover:bg-app-tab-track"
                          : "bg-app-tab-track text-app-text hover:bg-app-border"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: accent,
                            opacity: isReleased ? 1 : 0.55,
                          }
                        : undefined
                    }
                  >
                    <div
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none ${
                        !isReleased
                          ? "bg-app-tab-track text-app-muted"
                          : isSelected
                            ? "bg-app-surface/25 text-white"
                            : "bg-app-surface text-app-text shadow-sm border border-app-border/70"
                      }`}
                    >
                      B{ep.episode_number}
                    </div>
                    <span
                      className={`text-sm font-black leading-none ${
                        !isReleased ? "text-app-muted" : isSelected ? "text-white" : "text-app-text"
                      }`}
                    >
                      {day}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase leading-none ${
                        isSelected ? "text-white/85" : "text-app-muted"
                      }`}
                    >
                      {month}
                    </span>
                    {isEpWatchedThis && (
                      <CheckCircle
                        size={11}
                        weight="fill"
                        className={`absolute bottom-0.5 right-0.5 ${isSelected ? "text-white/90" : "text-emerald-500"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SeriesTrackPage() {
  const initialDeepLink = readSeriesDeepLink();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [mySeries, setMySeries] = useState<series_track.UserSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<series_track.UserSeries | null>(null);
  const [seriesDetails, setSeriesDetails] = useState<any>(null);
  const [allSeriesDetails, setAllSeriesDetails] = useState<Record<string, any>>(() => getLocalCache(CACHE_KEYS.DETAILS));
  const [allSeriesProgress, setAllSeriesProgress] = useState<Record<string, series_track.UserProgress[]>>({});
  const [seasonDetails, setSeasonDetails] = useState<Record<number, any>>({});
  const [globalSeasonCache, setGlobalSeasonCache] = useState<Record<string, any>>(() => getLocalCache(CACHE_KEYS.SEASONS));
  const [userProgress, setUserProgress] = useState<series_track.UserProgress[]>([]);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [activeStatusTab, setActiveStatusTab] = useState<series_track.SeriesStatus>("watching");
  const [allSeasonsData, setAllSeasonsData] = useState<Record<number, any>>({});
  const [loadingGraph, setLoadingGraph] = useState(false);

  // TV Flow States
  const [activeTab, setActiveTab] = useState<'my-series' | 'tv-flow'>('tv-flow');
  const [channels, setChannels] = useState<series_track.TvChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("19:00");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    initialDeepLink?.programId ?? null,
  );
  const [tvProgram, setTvProgram] = useState<series_track.TvProgramDetails | null>(null);
  const [selectedTvEpisode, setSelectedTvEpisode] = useState<series_track.TvEpisode | null>(null);
  const [tvEpisodeStats, setTvEpisodeStats] = useState<series_track.TvEpisodeStatsResponse | null>(null);

  const [channelsLoading, setChannelsLoading] = useState(true);
  const [tvProgramLoading, setTvProgramLoading] = useState(
    () => Boolean(initialDeepLink?.programId),
  );
  const channelStripRef = useRef<HTMLDivElement>(null);
  const episodeStripRef = useRef<HTMLDivElement>(null);
  const episodeStripAutoScrolledRef = useRef<string | null>(null);
  const [tvStatsLoading, setTvStatsLoading] = useState(false);
  const [screenStatic, setScreenStatic] = useState(false);
  const episodeFocusRef = useRef<{ episodeNumber?: number; episodeId?: string } | null>(
    initialDeepLink
      ? {
        episodeNumber: initialDeepLink.episodeNumber,
        episodeId: initialDeepLink.episodeId,
      }
      : null,
  );

  // Multi-season EPG states
  const [tvSeriesTmdbDetails, setTvSeriesTmdbDetails] = useState<any>(null);
  const [epgSelectedSeason, setEpgSelectedSeason] = useState<number>(1);
  const [epgSeasonEpisodes, setEpgSeasonEpisodes] = useState<any[]>([]);
  const [loadingEpgSeason, setLoadingEpgSeason] = useState(false);

  useEffect(() => {
    if (tvProgram?.tmdb_id) {
      client.series_track.getSeriesDetails(tvProgram.tmdb_id).then((details) => {
        setTvSeriesTmdbDetails(details);
      }).catch(console.error);
    } else {
      setTvSeriesTmdbDetails(null);
    }
  }, [tvProgram?.tmdb_id]);

  useEffect(() => {
    if (tvProgram?.id) {
      setEpgSelectedSeason(tvProgram.season_number || 1);
      episodeStripAutoScrolledRef.current = null;
    }
  }, [tvProgram?.id, tvProgram?.season_number]);

  useEffect(() => {
    if (!tvProgram?.tmdb_id || !epgSelectedSeason) {
      setEpgSeasonEpisodes([]);
      setLoadingEpgSeason(false);
      return;
    }

    let cancelled = false;
    setLoadingEpgSeason(true);
    setEpgSeasonEpisodes([]);
    episodeStripAutoScrolledRef.current = null;

    client.series_track
      .getSeasonDetails(tvProgram.tmdb_id, epgSelectedSeason)
      .then((res) => {
        if (cancelled) return;
        setEpgSeasonEpisodes(res.episodes ?? []);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setEpgSeasonEpisodes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEpgSeason(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tvProgram?.tmdb_id, epgSelectedSeason]);

  useEffect(() => {
    if (
      !selectedTvEpisode ||
      loadingEpgSeason ||
      epgSeasonEpisodes.length === 0 ||
      !episodeStripRef.current
    ) {
      return;
    }

    const scrollKey = `${tvProgram?.id}-${epgSelectedSeason}-${selectedTvEpisode.episode_number}`;
    if (episodeStripAutoScrolledRef.current === scrollKey) return;

    const scrollToActiveEpisode = () => {
      const container = episodeStripRef.current;
      if (!container) return;

      const activeEl = container.querySelector(
        `[data-episode-num="${selectedTvEpisode.episode_number}"]`,
      ) as HTMLElement | null;
      if (!activeEl) return;

      episodeStripAutoScrolledRef.current = scrollKey;

      const targetLeft =
        activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "auto",
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToActiveEpisode);
    });
  }, [
    tvProgram?.id,
    selectedTvEpisode?.episode_number,
    epgSelectedSeason,
    loadingEpgSeason,
    epgSeasonEpisodes.length,
  ]);

  function getEpisodeOffset(targetSeason: number, targetEpisode: number): number {
    if (!tvSeriesTmdbDetails || !tvProgram) return 0;
    const activeSeason = tvProgram.season_number || 1;
    const activeEpisode = tvProgram.episodes?.filter(e => e.is_released).length || 1;

    let offset = 0;

    if (targetSeason === activeSeason) {
      return targetEpisode - activeEpisode;
    }

    const seasons = tvSeriesTmdbDetails.seasons || [];

    if (targetSeason > activeSeason) {
      const activeSeasonDetails = seasons.find((s: any) => s.season_number === activeSeason);
      const activeSeasonCount = activeSeasonDetails?.episode_count || 16;
      offset += (activeSeasonCount - activeEpisode);

      for (let s = activeSeason + 1; s < targetSeason; s++) {
        const sDetails = seasons.find((x: any) => x.season_number === s);
        offset += (sDetails?.episode_count || 16);
      }

      offset += targetEpisode;
    } else {
      const targetSeasonDetails = seasons.find((s: any) => s.season_number === targetSeason);
      const targetSeasonCount = targetSeasonDetails?.episode_count || 16;
      offset -= (targetSeasonCount - targetEpisode);

      for (let s = targetSeason + 1; s < activeSeason; s++) {
        const sDetails = seasons.find((x: any) => x.season_number === s);
        offset -= (sDetails?.episode_count || 16);
      }

      offset -= activeEpisode;
    }

    return offset;
  }

  const TR_MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;
  const EPISODE_AIR_HOUR = 19;

  function getEpisodeAirDateTime(releaseDate: Date): Date {
    const airDate = new Date(releaseDate);
    airDate.setHours(EPISODE_AIR_HOUR, 0, 0, 0);
    return airDate;
  }

  function isEpisodeAvailableNow(releaseDate: Date): boolean {
    return Date.now() >= getEpisodeAirDateTime(releaseDate).getTime();
  }

  function getEpisodeReleaseDate(season: number, episodeNumber: number): Date {
    if (tvProgram && season === tvProgram.season_number) {
      const dbEp = tvProgram.episodes?.find((x) => x.episode_number === episodeNumber);
      if (dbEp?.release_date) return new Date(dbEp.release_date);
    }
    const offset = getEpisodeOffset(season, episodeNumber);
    const date = new Date();
    if (tvProgram?.schedule_type === "weekly") {
      date.setDate(date.getDate() + offset * 7);
    } else {
      date.setDate(date.getDate() + offset);
    }
    return date;
  }

  function formatEpisodeDate(date: Date) {
    return {
      day: date.getDate(),
      month: TR_MONTHS_SHORT[date.getMonth()],
    };
  }

  // Load TV Channels
  useEffect(() => {
    if (activeTab === 'tv-flow') {
      fetchTvChannels();
    }
  }, [activeTab]);

  async function fetchTvChannels() {
    try {
      setChannelsLoading(true);
      const res = await client.series_track.getTvChannels();
      setChannels(res.channels || []);

      const hasDeepLink = Boolean(initialDeepLink?.programId || episodeFocusRef.current);

      // Auto-select first channel only when not opening a deep link
      if (!hasDeepLink && res.channels && res.channels.length > 0 && !activeChannelId) {
        const first = res.channels[0];
        const defaultSlot = pickDefaultSlotTime();
        const defaultProgram =
          getProgramForSlot(first, defaultSlot) ?? getChannelSlotPrograms(first)[0] ?? null;
        setActiveChannelId(first.id);
        setSelectedSlotTime(defaultProgram?.slot_time ?? defaultSlot);
        if (defaultProgram) setSelectedProgramId(defaultProgram.id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Kanallar yüklenirken bir hata oluştu.");
    } finally {
      setChannelsLoading(false);
    }
  }

  // Load TV Program details
  useEffect(() => {
    if (activeTab === 'tv-flow' && selectedProgramId) {
      setTvProgramLoading(true);
      fetchTvProgramDetails(selectedProgramId);
    } else {
      setTvProgram(null);
      setSelectedTvEpisode(null);
      setTvProgramLoading(false);
    }
  }, [selectedProgramId, activeTab, user]);

  async function fetchTvProgramDetails(id: string) {
    try {
      setTvProgramLoading(true);
      const res = await client.series_track.getTvProgramDetails(id, {
        userId: user?.id || "",
      });
      setTvProgram(res);
      setActiveChannelId(res.channel_id);

      if (res.episodes && res.episodes.length > 0) {
        const released = res.episodes.filter((e) => e.is_released);
        const focus = episodeFocusRef.current;
        episodeFocusRef.current = null;

        let selected =
          (focus?.episodeId
            ? res.episodes.find((e) => e.id === focus.episodeId)
            : undefined) ??
          (focus?.episodeNumber != null
            ? res.episodes.find((e) => e.episode_number === focus.episodeNumber)
            : undefined) ??
          released.find((e) => !e.watched) ??
          (released.length > 0 ? released[released.length - 1] : res.episodes[0]);

        setSelectedTvEpisode(selected);
      }
    } catch (err) {
      console.error(err);
      toast.error("Yayın detayları yüklenemedi.");
    } finally {
      setTvProgramLoading(false);
    }
  }

  // Fetch TV episode stats
  useEffect(() => {
    if (activeTab === 'tv-flow' && selectedTvEpisode) {
      fetchTvEpisodeStats(selectedTvEpisode.id);
    } else {
      setTvEpisodeStats(null);
    }
  }, [selectedTvEpisode, activeTab]);

  async function fetchTvEpisodeStats(epId: string) {
    try {
      setTvStatsLoading(true);
      const res = await client.series_track.getTvEpisodeStats(epId);
      setTvEpisodeStats(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTvStatsLoading(false);
    }
  }

  const triggerTvTransition = (action: () => void) => {
    setScreenStatic(true);
    setTimeout(() => {
      action();
      setTimeout(() => {
        setScreenStatic(false);
      }, 300);
    }, 200);
  };

  const handleChannelSwitch = (channel: series_track.TvChannel) => {
    triggerTvTransition(() => {
      setActiveChannelId(channel.id);
      const defaultSlot = pickDefaultSlotTime();
      const program =
        getProgramForSlot(channel, defaultSlot) ?? getChannelSlotPrograms(channel)[0] ?? null;
      setSelectedSlotTime(program?.slot_time ?? defaultSlot);
      if (program) {
        setSelectedProgramId(program.id);
      } else {
        setSelectedProgramId(null);
        setSelectedTvEpisode(null);
      }
    });
  };

  const handleSlotSwitch = (channel: series_track.TvChannel, slotTime: string) => {
    const program = getProgramForSlot(channel, slotTime);
    setSelectedSlotTime(slotTime);
    if (program) {
      setSelectedProgramId(program.id);
    } else {
      setSelectedProgramId(null);
      setSelectedTvEpisode(null);
    }
  };

  useEffect(() => {
    if (!activeChannelId || !channelStripRef.current) return;
    const activeEl = channelStripRef.current.querySelector(`[data-channel-id="${activeChannelId}"]`);
    activeEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeChannelId, channelsLoading]);

  const handleTvWatchToggle = async (episode: series_track.TvEpisode, emoji?: string) => {
    if (!user) {
      toast.error("İzleme durumunu kaydetmek için lütfen giriş yapın.", { icon: "🔒" });
      return;
    }

    try {
      const sendingEmoji = emoji === episode.emoji_reaction ? "none" : (emoji || "");
      const res = await client.series_track.toggleTvEpisodeWatched(episode.id, {
        userId: user.id,
        emojiReaction: sendingEmoji,
      });

      if (tvProgram) {
        const updatedEpisodes = tvProgram.episodes.map(e => {
          if (e.id === episode.id) {
            return {
              ...e,
              watched: res.watched,
              emoji_reaction: res.emoji_reaction,
            };
          }
          return e;
        });
        setTvProgram({ ...tvProgram, episodes: updatedEpisodes });

        if (selectedTvEpisode && selectedTvEpisode.id === episode.id) {
          setSelectedTvEpisode({
            ...selectedTvEpisode,
            watched: res.watched,
            emoji_reaction: res.emoji_reaction,
          });
        }
      }

      toast.success(res.watched ? "Bölüm izlendi!" : "Bölüm izleme kaydı kaldırıldı.");
      fetchTvEpisodeStats(episode.id);
      await silentFetchMySeries();
    } catch (err) {
      console.error(err);
      toast.error("İşlem gerçekleştirilemedi.");
    }
  };

  // Audio feedback helper
  const playClickSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playPulse = (time: number, freq: number, dur: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq / 2, time + dur);

        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + dur);
      };

      // Modern "double-tap" feedback
      playPulse(audioCtx.currentTime, 1000, 0.03);
      playPulse(audioCtx.currentTime + 0.05, 1200, 0.04);
    } catch (e) { }
  };

  useEffect(() => {
    setLocalCache(CACHE_KEYS.DETAILS, allSeriesDetails);
  }, [allSeriesDetails]);

  useEffect(() => {
    setLocalCache(CACHE_KEYS.SEASONS, globalSeasonCache);
  }, [globalSeasonCache]);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchMySeries();
    }
  }, [isUserLoaded, user]);

  const fetchMySeries = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await client.series_track.getUserSeries(user.id);
      const seriesList = res.series || [];
      setMySeries(seriesList);

      // Fetch progress for all
      const progressPromises = seriesList.map(s => client.series_track.getUserProgress(user.id, s.id));
      const progressResults = await Promise.all(progressPromises);

      const progressMap: Record<string, series_track.UserProgress[]> = {};
      seriesList.forEach((s, i) => {
        progressMap[s.id] = progressResults[i].progress || [];
      });
      setAllSeriesProgress(progressMap);

      // Fetch details for missing or old cache (older than 12h)
      const now = Date.now();
      const CACHE_STALE_TIME = 1000 * 60 * 60 * 12; // 12 hours

      const seriesToFetch = seriesList.filter(s => {
        const cached = allSeriesDetails[s.id];
        if (!cached) return true;
        if (!cached._cached_at || now - cached._cached_at > CACHE_STALE_TIME) return true;
        return false;
      });

      if (seriesToFetch.length > 0) {
        const detailsPromises = seriesToFetch.map(s => client.series_track.getSeriesDetails(s.tmdb_id));
        const detailsResults = await Promise.all(detailsPromises);

        const newDetailsMap = { ...allSeriesDetails };
        seriesToFetch.forEach((s, i) => {
          newDetailsMap[s.id] = {
            ...detailsResults[i],
            _cached_at: now
          };
        });
        setAllSeriesDetails(newDetailsMap);
      }

    } catch (error) {
      console.error("fetchMySeries error:", error);
      toast.error("Dizileriniz yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const silentFetchMySeries = async () => {
    if (!user) return;
    try {
      const res = await client.series_track.getUserSeries(user.id);
      const seriesList = res.series || [];
      setMySeries(seriesList);

      const progressPromises = seriesList.map(s => client.series_track.getUserProgress(user.id, s.id));
      const progressResults = await Promise.all(progressPromises);

      const progressMap: Record<string, series_track.UserProgress[]> = {};
      seriesList.forEach((s, i) => {
        progressMap[s.id] = progressResults[i].progress || [];
      });
      setAllSeriesProgress(progressMap);
    } catch (error) {
      console.error("silentFetchMySeries error:", error);
    }
  };

  const hasEpisodeAired = (airDate: string) => {
    if (!airDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const releaseDate = new Date(airDate);
    return releaseDate <= today;
  };

  const getNextEpisode = (seriesId: string) => {
    const progress = allSeriesProgress[seriesId] || [];
    const details = allSeriesDetails[seriesId];
    if (!details || !details.seasons) return { season: 1, episode: 1, totalLeft: 0, isAired: true, airDate: "", isFinished: false };

    // Find the highest watched episode
    let lastSeason = 0;
    let lastEpisode = 0;

    progress.forEach(p => {
      if (p.season_number > lastSeason || (p.season_number === lastSeason && p.episode_number > lastEpisode)) {
        lastSeason = p.season_number;
        lastEpisode = p.episode_number;
      }
    });

    // Calculate total aired episodes to find how many are left to watch
    const lastAiredInfo = details.last_episode_to_air;
    let totalAiredCount = 0;
    if (lastAiredInfo) {
      details.seasons.forEach((s: any) => {
        if (s.season_number > 0) {
          if (s.season_number < lastAiredInfo.season_number) {
            totalAiredCount += s.episode_count;
          } else if (s.season_number === lastAiredInfo.season_number) {
            totalAiredCount += lastAiredInfo.episode_number;
          }
        }
      });
    } else {
      totalAiredCount = details.number_of_episodes;
    }

    const totalUnwatchedAired = Math.max(0, totalAiredCount - progress.length);

    if (lastSeason === 0) {
      // Check if first episode is aired
      let isAired = true;
      let airDate = "";
      const nextToAir = details.next_episode_to_air;
      if (lastAiredInfo) {
        if (1 > lastAiredInfo.season_number || (1 === lastAiredInfo.season_number && 1 > lastAiredInfo.episode_number)) {
          isAired = false;
          if (nextToAir && nextToAir.season_number === 1 && nextToAir.episode_number === 1) {
            airDate = nextToAir.air_date;
            if (hasEpisodeAired(airDate)) isAired = true;
          }
        }
      }
      return {
        season: 1,
        episode: 1,
        totalLeft: isAired ? Math.max(0, totalUnwatchedAired - 1) : totalUnwatchedAired,
        isAired,
        airDate,
        isFinished: false
      };
    }

    // Find next episode in the same season or next season
    let nextSeasonNum = 0;
    let nextEpisodeNum = 0;
    const currentSeason = details.seasons.find((s: any) => s.season_number === lastSeason);

    if (currentSeason && lastEpisode < currentSeason.episode_count) {
      nextSeasonNum = lastSeason;
      nextEpisodeNum = lastEpisode + 1;
    } else {
      const nextSeason = details.seasons.find((s: any) => s.season_number === lastSeason + 1);
      if (nextSeason) {
        nextSeasonNum = lastSeason + 1;
        nextEpisodeNum = 1;
      }
    }

    if (nextSeasonNum === 0 || nextEpisodeNum === 0) {
      return { season: lastSeason, episode: lastEpisode, isFinished: true, totalLeft: 0, isAired: true, airDate: "" };
    }

    // Check if aired
    let isAired = true;
    let airDate = "";
    const nextToAir = details.next_episode_to_air;

    if (lastAiredInfo) {
      if (nextSeasonNum > lastAiredInfo.season_number ||
        (nextSeasonNum === lastAiredInfo.season_number && nextEpisodeNum > lastAiredInfo.episode_number)) {
        isAired = false;
        if (nextToAir && nextSeasonNum === nextToAir.season_number && nextEpisodeNum === nextToAir.episode_number) {
          airDate = nextToAir.air_date;
          // Even if TMDB says it's "next to air", if the date has passed, consider it aired
          if (hasEpisodeAired(airDate)) {
            isAired = true;
          }
        }
      }
    }

    return {
      season: nextSeasonNum,
      episode: nextEpisodeNum,
      totalLeft: isAired ? Math.max(0, totalUnwatchedAired - 1) : totalUnwatchedAired,
      isAired,
      airDate,
      isFinished: false
    };
  };

  const getNextEpisodeName = (seriesId: string, season: number, episode: number) => {
    const details = allSeriesDetails[seriesId];
    if (!details) return "";
    // We don't have full season details (episodes) in allSeriesDetails, only season counts.
    // So we can't easily get the name without another API call or a more complex cache.
    // Let's just return a clean string for now.
    return "";
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await client.series_track.searchSeries({ query: searchQuery });
      setSearchResults(res.results || []);
    } catch (error) {
      toast.error("Arama yapılamadı.");
    } finally {
      setSearching(false);
    }
  };

  const addToMyList = async (series: any) => {
    if (!user) return;

    // Audio and Haptic feedback
    playClickSound();
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    const targetStatus = activeStatusTab || "watching";

    try {
      const addRes = await client.series_track.addUserSeries({
        userId: user.id,
        tmdbId: series.id,
        title: series.name,
        posterPath: series.poster_path,
        backdropPath: series.backdrop_path,
        status: targetStatus,
      });
      toast.success(`${series.name} listeye eklendi.`);

      // Fetch details immediately to prevent empty sections/loading bugs in listing
      try {
        const details = await client.series_track.getSeriesDetails(series.id);
        if (addRes.series?.id) {
          setAllSeriesDetails(prev => ({
            ...prev,
            [addRes.series!.id]: {
              ...details,
              _cached_at: Date.now()
            }
          }));

          // If added as completed (Bitti), automatically mark all episodes as watched
          if (targetStatus === "completed" && details?.seasons) {
            const seasonsData = details.seasons
              ?.filter((s: any) => s.season_number > 0)
              .map((s: any) => ({
                season: s.season_number,
                count: s.episode_count
              })) || [];

            if (seasonsData.length > 0) {
              try {
                await client.series_track.markAllEpisodesWatched({
                  userId: user.id,
                  seriesId: addRes.series.id,
                  seasonsData: seasonsData,
                });
                const newProgress: series_track.UserProgress[] = [];
                seasonsData.forEach((s: any) => {
                  for (let i = 1; i <= s.count; i++) {
                    newProgress.push({
                      season_number: s.season,
                      episode_number: i,
                      watched_at: new Date().toISOString()
                    });
                  }
                });
                setAllSeriesProgress(prev => ({
                  ...prev,
                  [addRes.series!.id]: newProgress
                }));
              } catch (markErr) {
                console.error("Failed to mark episodes watched on completed add:", markErr);
              }
            }
          }
        }
      } catch (detailsErr) {
        console.error("Failed to prefetch newly added series details:", detailsErr);
      }

      fetchMySeries();
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      toast.error("Dizi eklenemedi.");
    }
  };

  const openSeriesDetailFromTv = async () => {
    if (!user || !tvProgram?.tmdb_id) return;

    let record = mySeries.find((s) => s.tmdb_id === tvProgram.tmdb_id);
    if (record) {
      fetchSeriesDetails(record);
      return;
    }

    try {
      const details = await client.series_track.getSeriesDetails(tvProgram.tmdb_id);
      await client.series_track.addUserSeries({
        userId: user.id,
        tmdbId: tvProgram.tmdb_id,
        title: tvProgram.title,
        posterPath: details.poster_path ?? undefined,
        backdropPath: details.backdrop_path ?? undefined,
        status: "watching",
      });
      const res = await client.series_track.getUserSeries(user.id);
      const seriesList = res.series || [];
      setMySeries(seriesList);
      record = seriesList.find((s) => s.tmdb_id === tvProgram.tmdb_id);
      if (record) fetchSeriesDetails(record);
    } catch {
      toast.error("Dizi detayları açılamadı.");
    }
  };

  const fetchSeriesDetails = async (series: series_track.UserSeries) => {
    if (!user) return;
    try {
      setSelectedSeries(series);
      setSeriesDetails(null);
      setSeasonDetails({});
      setAllSeasonsData({});
      setViewMode('list');

      const [details, progress] = await Promise.all([
        client.series_track.getSeriesDetails(series.tmdb_id),
        client.series_track.getUserProgress(user.id, series.id)
      ]);

      setSeriesDetails(details);
      const userProgressList = progress.progress || [];
      setUserProgress(userProgressList);

      if (details.seasons && details.seasons.length > 0) {
        let seasonToOpen = 1;

        if (userProgressList.length > 0) {
          const maxSeason = Math.max(...userProgressList.map(p => p.season_number));
          if (maxSeason > 1) {
            seasonToOpen = maxSeason;
          }
        }

        // Sezonun mevcut olduğundan emin ol
        const seasonExists = details.seasons.some((s: any) => s.season_number === seasonToOpen);
        if (!seasonExists) {
          const validSeasons = details.seasons.filter((s: any) => s.season_number > 0);
          seasonToOpen = validSeasons.length > 0
            ? validSeasons[0].season_number
            : details.seasons[0].season_number;
        }

        setActiveSeason(seasonToOpen);
        fetchSeasonDetails(series.tmdb_id, seasonToOpen);
      }
    } catch (error) {
      toast.error("Detaylar yüklenemedi.");
    }
  };

  const fetchAllSeasonsForGraph = async () => {
    if (!selectedSeries || !seriesDetails) return;
    setLoadingGraph(true);
    try {
      const seasons = seriesDetails.seasons.filter((s: any) => s.season_number > 0);
      const promises = seasons.map((s: any) =>
        client.series_track.getSeasonDetails(selectedSeries.tmdb_id, s.season_number)
      );
      const results = await Promise.all(promises);
      const data: Record<number, any> = {};
      results.forEach((res, i) => {
        data[seasons[i].season_number] = res;
      });
      setAllSeasonsData(data);
    } catch (error) {
      toast.error("Grafik verileri yüklenemedi.");
    } finally {
      setLoadingGraph(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (!rating) return "bg-app-tab-track text-app-muted border-0";
    if (rating >= 9.0) return "bg-[#107c41] text-white border-0 font-extrabold";
    if (rating >= 8.0) return "bg-[#258752] text-white border-0 font-bold";
    if (rating >= 7.0) return "bg-[#cc9425] text-white border-0 font-bold";
    if (rating >= 6.0) return "bg-[#c96324] text-white border-0 font-bold";
    return "bg-[#b8332a] text-white border-0 font-bold";
  };

  const fetchSeasonDetails = async (tmdbId: number, seasonNumber: number) => {
    const cacheKey = `${tmdbId}:${seasonNumber}`;
    if (globalSeasonCache[cacheKey]) {
      setSeasonDetails(prev => ({ ...prev, [seasonNumber]: globalSeasonCache[cacheKey] }));
      return;
    }

    try {
      const res = await client.series_track.getSeasonDetails(tmdbId, seasonNumber);
      setSeasonDetails(prev => ({ ...prev, [seasonNumber]: res }));
      setGlobalSeasonCache(prev => ({ ...prev, [cacheKey]: res }));
    } catch (error) {
      toast.error("Sezon detayları yüklenemedi.");
    }
  };

  const toggleWatched = async (seriesId: string, seasonNum: number, episodeNum: number) => {
    if (!user) return;

    // Audio and Haptic feedback
    playClickSound();
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    try {
      const res = await client.series_track.toggleEpisodeWatched({
        userId: user.id,
        seriesId: seriesId,
        seasonNumber: seasonNum,
        episodeNumber: episodeNum,
      });

      if (res.isWatched) {
        toast.success(`S${seasonNum} E${episodeNum} izlendi olarak işaretlendi.`, {
          icon: '✅',
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#10b981',
            fontSize: '12px',
            fontWeight: 'bold',
          },
          duration: 2000,
        });
        if (selectedSeries?.id === seriesId) {
          setUserProgress(prev => [...prev, { season_number: seasonNum, episode_number: episodeNum, watched_at: new Date().toISOString() }]);
        }
        // Update allSeriesProgress for the main list
        setAllSeriesProgress(prev => ({
          ...prev,
          [seriesId]: [...(prev[seriesId] || []), { season_number: seasonNum, episode_number: episodeNum, watched_at: new Date().toISOString() }]
        }));
      } else {
        if (selectedSeries?.id === seriesId) {
          setUserProgress(prev => prev.filter(p => !(p.season_number === seasonNum && p.episode_number === episodeNum)));
        }
        // Update allSeriesProgress for the main list
        setAllSeriesProgress(prev => ({
          ...prev,
          [seriesId]: (prev[seriesId] || []).filter(p => !(p.season_number === seasonNum && p.episode_number === episodeNum))
        }));
      }
    } catch (error) {
      toast.error("İşlem başarısız.");
    }
  };

  const markSeasonAsWatched = async () => {
    if (!user || !selectedSeries || !seasonDetails[activeSeason]) return;

    // Audio and Haptic feedback
    playClickSound();
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }

    const episodes = seasonDetails[activeSeason].episodes || [];
    const unwatchedEpisodeNumbers = episodes
      .filter((ep: any) => !isEpisodeWatched(activeSeason, ep.episode_number))
      .map((ep: any) => ep.episode_number);

    if (unwatchedEpisodeNumbers.length === 0) {
      toast.success("Tüm bölümler zaten izlendi.");
      return;
    }

    try {
      await client.series_track.markEpisodesWatched({
        userId: user.id,
        seriesId: selectedSeries.id,
        seasonNumber: activeSeason,
        episodeNumbers: unwatchedEpisodeNumbers,
      });

      const newProgress = unwatchedEpisodeNumbers.map((epNum: number) => ({
        season_number: activeSeason,
        episode_number: epNum,
        watched_at: new Date().toISOString()
      }));

      setUserProgress(prev => [...prev, ...newProgress]);
      setAllSeriesProgress(prev => ({
        ...prev,
        [selectedSeries.id]: [...(prev[selectedSeries.id] || []), ...newProgress]
      }));

      toast.success(`${activeSeason}. Sezon tümüyle izlendi.`);
    } catch (error) {
      toast.error("İşlem başarısız.");
    }
  };

  const markAllAsWatched = async () => {
    if (!user || !selectedSeries || !seriesDetails) return;

    // Audio and Haptic feedback
    playClickSound();
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }

    const seasonsData = seriesDetails.seasons
      ?.filter((s: any) => s.season_number > 0)
      .map((s: any) => ({
        season: s.season_number,
        count: s.episode_count
      })) || [];

    if (seasonsData.length === 0) return;

    try {
      await client.series_track.markAllEpisodesWatched({
        userId: user.id,
        seriesId: selectedSeries.id,
        seasonsData: seasonsData,
      });

      // Automatically set series status to 'completed' (Bitti)
      try {
        await client.series_track.updateUserSeriesStatus({
          userId: user.id,
          seriesId: selectedSeries.id,
          status: "completed",
        });
      } catch {
        /* status update fallback */
      }

      // Update local state for all episodes & series status
      const newProgress: series_track.UserProgress[] = [];
      seasonsData.forEach((s: any) => {
        for (let i = 1; i <= s.count; i++) {
          newProgress.push({
            season_number: s.season,
            episode_number: i,
            watched_at: new Date().toISOString()
          });
        }
      });

      setUserProgress(newProgress);
      setSelectedSeries(prev => prev ? { ...prev, status: "completed" } : null);
      setMySeries(prev => prev.map(s => s.id === selectedSeries.id ? { ...s, status: "completed" } : s));
      setAllSeriesProgress(prev => ({
        ...prev,
        [selectedSeries.id]: newProgress
      }));

      toast.success("Tüm dizi izlendi olarak işaretlendi!");
    } catch (error) {
      toast.error("İşlem başarısız.");
    }
  };

  const isEpisodeWatched = (seasonNum: number, episodeNum: number) => {
    if (selectedSeries?.status === "completed") return true;
    return userProgress.some(p => p.season_number === seasonNum && p.episode_number === episodeNum);
  };

  const formatDateTurkish = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  const getRelativeDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      // Normalize both dates to midnight local time for accurate day difference
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const dayMonth = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(targetDate);

      if (diffDays === 0) return `Bugün (${dayMonth})`;
      if (diffDays === 1) return `Yarın (${dayMonth})`;
      if (diffDays > 1 && diffDays < 7) return `${diffDays} gün sonra (${dayMonth})`;
      if (diffDays === -1) return `Dün (${dayMonth})`;
      if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} gün önce (${dayMonth})`;

      return formatDateTurkish(dateStr);
    } catch (e) {
      return dateStr;
    }
  };

  const updateSeriesStatus = async (status: series_track.SeriesStatus) => {
    if (!user || !selectedSeries) return;

    // Deselect/remove status if clicking the already selected status
    if (selectedSeries.status === status) {
      try {
        await client.series_track.deleteUserSeries(user.id, selectedSeries.id);
        setMySeries(prev => prev.filter(s => s.id !== selectedSeries.id));
        setSelectedSeries({ ...selectedSeries, status: undefined as any });
        toast.success("Seçim kaldırıldı.");
      } catch (error) {
        toast.error("İşlem başarısız.");
      }
      return;
    }

    try {
      await client.series_track.updateUserSeriesStatus({
        userId: user.id,
        seriesId: selectedSeries.id,
        status: status
      });
      setSelectedSeries({ ...selectedSeries, status: status });
      setMySeries(prev => {
        const exists = prev.some(s => s.id === selectedSeries.id);
        if (exists) {
          return prev.map(s => s.id === selectedSeries.id ? { ...s, status: status } : s);
        } else {
          return [...prev, { ...selectedSeries, status: status }];
        }
      });

      // If status changed to completed (Bitti), automatically mark all episodes watched
      if (status === "completed" && seriesDetails?.seasons) {
        const seasonsData = seriesDetails.seasons
          ?.filter((s: any) => s.season_number > 0)
          .map((s: any) => ({
            season: s.season_number,
            count: s.episode_count
          })) || [];

        if (seasonsData.length > 0) {
          client.series_track.markAllEpisodesWatched({
            userId: user.id,
            seriesId: selectedSeries.id,
            seasonsData: seasonsData,
          }).catch(console.error);

          const newProgress: series_track.UserProgress[] = [];
          seasonsData.forEach((s: any) => {
            for (let i = 1; i <= s.count; i++) {
              newProgress.push({
                season_number: s.season,
                episode_number: i,
                watched_at: new Date().toISOString()
              });
            }
          });
          setUserProgress(newProgress);
          setAllSeriesProgress(prev => ({
            ...prev,
            [selectedSeries.id]: newProgress
          }));
        }
      }

      toast.success(`Durum güncellendi: ${STATUS_LABELS[status].label}`);
    } catch (error) {
      toast.error("Durum güncellenemedi.");
    }
  };

  const handleQuickStatusUpdate = async (tmdbId: number, status: series_track.SeriesStatus) => {
    if (!user) return;
    const existing = mySeries.find((s) => s.tmdb_id === tmdbId);
    if (existing) {
      try {
        await client.series_track.updateUserSeriesStatus({
          userId: user.id,
          seriesId: existing.id,
          status: status,
        });
        setMySeries((prev) =>
          prev.map((s) => (s.id === existing.id ? { ...s, status: status } : s)),
        );
        toast.success(`Durum güncellendi: ${STATUS_LABELS[status].label}`);
      } catch {
        toast.error("Durum güncellenemedi.");
      }
    } else {
      try {
        const res = await client.series_track.addUserSeries({
          userId: user.id,
          tmdbId: tmdbId,
          title: "",
          status: status,
        });
        if (res.series) {
          const addedSeries = res.series;
          setMySeries((prev) => [...prev, addedSeries]);
        }
        toast.success(`Diziye eklendi: ${STATUS_LABELS[status].label}`);
      } catch {
        toast.error("Dizi eklenemedi.");
      }
    }
  };

  const removeFromList = async (seriesId: string) => {
    if (!user) return;

    // Audio and Haptic feedback
    playClickSound();
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    try {
      await client.series_track.deleteUserSeries(user.id, seriesId);
      setMySeries(prev => prev.filter(s => s.id !== seriesId));
      setSelectedSeries(null);
      toast.success("Dizi listeden kaldırıldı.");
    } catch (error) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  const handleWatch = (series: series_track.UserSeries, season: number, episode: number) => {
    let query = `${series.title} Sezon ${season} Bölüm ${episode} izle`;
    if (series.watch_url_slug) {
      query += ` ${series.watch_url_slug}`;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const updateWatchSlug = async (series: series_track.UserSeries, newSlug: string) => {
    if (!user) return;
    try {
      await client.series_track.addUserSeries({
        userId: user.id,
        tmdbId: series.tmdb_id,
        title: series.title,
        watchUrlSlug: newSlug
      });
      setMySeries(prev => prev.map(s => s.id === series.id ? { ...s, watch_url_slug: newSlug } : s));
      if (selectedSeries?.id === series.id) {
        setSelectedSeries({ ...selectedSeries, watch_url_slug: newSlug });
      }
      toast.success("İzleme linki güncellendi.");
    } catch (e) {
      toast.error("Güncelleme başarısız.");
    }
  };

  const handleOpenSeriesByTmdbId = (tmdbId: number) => {
    const existing = mySeries.find((s) => s.tmdb_id === tmdbId);
    if (existing) {
      fetchSeriesDetails(existing);
    } else {
      fetchSeriesDetails({
        id: String(tmdbId),
        tmdb_id: tmdbId,
        title: "",
        poster_path: null,
        backdrop_path: null,
        watch_url_slug: null,
        status: "watching",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);
  return (
    <>
      <SeriesTrackShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAdd={() => setShowSearch(true)}
      >
        <Toaster position="top-center" />

        {activeTab === 'my-series' ? (
          <>
            {/* Status Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-app-tab-track mb-4 overflow-x-auto no-scrollbar">
              {(["watching", "plan_to_watch", "dropped", "completed"] as series_track.SeriesStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatusTab(status)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${activeStatusTab === status
                      ? "bg-app-tab-active text-app-text shadow-sm"
                      : "text-app-muted hover:text-app-text"
                    }`}
                >
                  {STATUS_LABELS[status].label}
                  <span className="ml-1 text-app-muted tabular-nums">
                    {mySeries.filter(s => s.status === status).length}
                  </span>
                </button>
              ))}
            </div>

            {/* My List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-app-surface rounded-xl animate-pulse border border-app-border" />
                ))}
              </div>
            ) : mySeries.filter(s => s.status === activeStatusTab).length === 0 ? (
              <div className="text-center py-16 bg-app-surface border border-app-border rounded-2xl shadow-sm">
                <Monitor size={48} className="mx-auto text-app-muted mb-4" />
                <p className="text-app-muted font-medium">Bu kategoride henüz dizi yok.</p>
                {activeStatusTab === "watching" && (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="mt-4 text-red-600 font-bold text-sm hover:underline"
                  >
                    Hemen bir dizi ara
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {mySeries
                  .filter(s => s.status === activeStatusTab)
                  .map((series) => {
                    const nextEp = getNextEpisode(series.id);
                    const progress = allSeriesProgress[series.id] || [];
                    const details = allSeriesDetails[series.id];
                    const progressPercent = details ? (progress.length / details.number_of_episodes) * 100 : 0;

                    return (
                      <motion.div
                        layoutId={series.id}
                        key={series.id}
                        onClick={() => fetchSeriesDetails(series)}
                        className="group cursor-pointer bg-app-surface border border-app-border hover:bg-app-surface-muted/40 rounded-xl p-3 flex gap-3 transition-colors shadow-sm active:scale-[0.99]"
                      >
                        <div className="w-[88px] aspect-[2/3] rounded-xl overflow-hidden border border-app-border bg-app-surface-muted relative shrink-0">
                          {series.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                              alt={series.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-app-muted font-bold text-center p-1 text-[9px]">
                              {series.title}
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-app-tab-track">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-black text-app-text truncate">{series.title}</h3>

                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-lg font-black tracking-tight text-app-text">
                                {nextEp.isFinished ? "Bitti" : `S${nextEp.season} E${nextEp.episode}`}
                              </span>
                              {nextEp.totalLeft > 0 && (
                                <span className="text-sm font-bold text-app-muted">+{nextEp.totalLeft}</span>
                              )}
                            </div>

                            <p className="text-xs text-app-muted mt-2 truncate font-medium">
                              {nextEp.isFinished
                                ? "Tüm bölümleri izledin."
                                : `Sıradaki: Sezon ${nextEp.season}, Bölüm ${nextEp.episode}`}
                            </p>
                          </div>

                          <div className="flex items-center justify-end mt-4">
                            <div className="flex items-center gap-2">
                              {nextEp.isFinished ? (
                                <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                                  Tamamlandı 🎉
                                </div>
                              ) : nextEp.isAired ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleWatch(series, nextEp.season, nextEp.episode);
                                    }}
                                    className="px-4 py-2 bg-app-surface border border-app-border text-app-text text-[10px] font-black rounded-xl transition-colors flex items-center gap-2 shadow-sm hover:bg-app-surface-muted/40 active:scale-95 cursor-pointer"
                                  >
                                    <Play size={14} weight="fill" className="text-app-text" />
                                    <span>İZLE</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleWatched(series.id, nextEp.season, nextEp.episode);
                                    }}
                                    className="w-10 h-10 rounded-full bg-app-surface-muted hover:bg-app-surface-muted/80 border border-app-border flex items-center justify-center transition-colors group/btn cursor-pointer active:scale-90"
                                  >
                                    <CheckCircle size={20} weight="bold" className="text-app-muted group-hover/btn:text-emerald-500" />
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-black text-amber-600">
                                  <Calendar size={14} weight="bold" className="shrink-0" />
                                  <span>{nextEp.airDate ? getRelativeDate(nextEp.airDate) : "YAKINDA"}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </>
        ) : (
          /* ==================== TV GUIDE / ANALOG FLOW VIEW ==================== */
          <div className="space-y-3">
            {/* Horizontal channel strip */}
            <div
              ref={channelStripRef}
              className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {channelsLoading
                ? [1, 2, 3, 4].map((n) => (
                  <div key={n} className="shrink-0 w-[88px] h-[80px] bg-app-surface border border-app-border rounded-xl animate-pulse" />
                ))
                : channels.map((chan, idx) => {
                  const isActive = chan.id === activeChannelId;
                  return (
                    <div key={chan.id} className="relative shrink-0 snap-center">
                      <button
                        data-channel-id={chan.id}
                        onClick={() => handleChannelSwitch(chan)}
                        className={`group w-[88px] min-h-[56px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all active:scale-95 ${isActive
                            ? "shadow-sm"
                            : "border-app-border bg-app-surface/60 hover:bg-app-surface-muted/40"
                          }`}
                        style={
                          isActive
                            ? {
                              backgroundColor: `${chan.color}12`,
                              borderColor: `${chan.color}55`,
                            }
                            : undefined
                        }
                      >
                        <span
                          className={`text-[10px] font-black uppercase w-full text-center leading-tight line-clamp-2 ${isActive ? "text-app-text" : "text-app-muted"
                            }`}
                        >
                          {chan.name}
                        </span>
                      </button>

                      {/* EPG / Flow Schedule button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Select the channel and select the first program's slot to open details/episodes calendar
                          handleChannelSwitch(chan);
                          const programs = getChannelSlotPrograms(chan);
                          if (programs.length > 0) {
                            const firstProg = programs[0];
                            if (firstProg.slot_time) {
                              handleSlotSwitch(chan, firstProg.slot_time);
                            }
                          }
                          // Auto scroll to EPG section if loaded
                          setTimeout(() => {
                            const element = document.getElementById("epg-section-episodes");
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth", block: "center" });
                            } else {
                              toast.success(`${chan.name} akışı seçildi, bölümler için karta tıklayın.`);
                            }
                          }, 300);
                        }}
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border flex items-center justify-center shadow-sm transition-all active:scale-90 bg-app-surface ${isActive ? "border-red-500/50 text-red-500" : "border-app-border text-app-muted hover:text-app-text"
                          }`}
                        title="Kanal Akışı"
                      >
                        <Calendar size={10} weight="bold" />
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Channel schedule — vertical series cards */}
            {activeChannel && (
              <div className="flex flex-col gap-3">
                {channelsLoading
                  ? CHANNEL_SLOT_TIMES.map((slotTime) => (
                    <div key={slotTime} className="space-y-1.5">
                      <div className="flex items-center gap-2 px-0.5">
                        <div className="h-3 w-10 bg-app-surface-muted rounded animate-pulse" />
                        <div className="flex-1 h-px bg-app-border/50" />
                      </div>
                      <div className="bg-app-surface border border-app-border rounded-2xl p-3 animate-pulse">
                        <div className="flex gap-3 items-start">
                          <div className="w-[72px] aspect-[2/3] bg-app-surface-muted rounded-xl shrink-0" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-app-surface-muted rounded w-2/3" />
                            <div className="h-3 bg-app-surface-muted rounded w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  : CHANNEL_SLOT_TIMES.map((slotTime) => {
                    const prog = getProgramForSlot<series_track.TvProgramSummary>(activeChannel, slotTime);
                    if (!prog) return null;

                    const isSlotActive = selectedSlotTime === slotTime;
                    const accent = activeChannel.color;
                    const isThisProgramLoaded = isSlotActive && tvProgram?.id === prog?.id;
                    const showCardLoading = isSlotActive && tvProgramLoading;

                    return (
                      <div key={slotTime} className="space-y-1.5">
                        <div className="flex items-center gap-2 px-0.5 w-full text-left group">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider tabular-nums shrink-0 text-app-muted"
                          >
                            {slotTime}
                          </span>
                          <div
                            className="flex-1 h-px bg-app-border/50"
                          />
                        </div>

                        <div
                          className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm transition-all"
                        >
                          {!prog ? (
                            <div className="flex flex-col items-center justify-center py-10 text-app-muted px-3">
                              <Television size={28} className="mb-2 opacity-40" />
                              <span className="text-xs font-bold">Boş slot</span>
                            </div>
                          ) : (
                            <EpgSlotProgCard
                              prog={prog}
                              accent={accent}
                              userId={user?.id ?? ""}
                              allSeriesProgress={allSeriesProgress}
                              mySeries={mySeries}
                              onOpenSeriesDetail={handleOpenSeriesByTmdbId}
                              onUpdateSeriesStatus={handleQuickStatusUpdate}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </SeriesTrackShell>

      {/* Search Drawer */}
      <Drawer.Root open={showSearch} onOpenChange={setShowSearch}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-app-surface text-app-text flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-50 max-w-xl mx-auto border-t border-app-border">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-app-tab-track mb-8" />
              <Drawer.Title className="text-2xl font-black mb-2">Dizi Ara</Drawer.Title>
              <Drawer.Description className="text-app-muted text-xs mb-6">
                İzlemek istediğiniz diziyi TMDB üzerinden arayın ve listenize ekleyin.
              </Drawer.Description>

              <form onSubmit={handleSearch} className="relative mb-8">
                <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Dizi adı yazın..."
                  className="w-full bg-app-surface-muted border border-app-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-red-500 outline-none transition-all"
                />
              </form>

              <div className="space-y-4">
                {searching ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchResults.map((result) => (
                  <div key={result.id} className="flex gap-4 p-3 bg-app-surface-muted/50 border border-app-border rounded-2xl hover:bg-app-surface-muted transition-all group">
                    <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-app-tab-track">
                      {result.poster_path && (
                        <img src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-bold truncate text-app-text">{result.name}</h4>
                      <p className="text-xs text-app-muted line-clamp-2 mt-1">{result.overview || "Açıklama yok."}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-app-muted">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {result.first_air_date?.split('-')[0]}</span>
                        <span className="flex items-center gap-1 text-yellow-500"><Star size={12} weight="fill" /> {result.vote_average?.toFixed(1)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToMyList(result)}
                      className="self-center p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all active:scale-90"
                    >
                      <Plus size={20} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Details Drawer */}
      <Drawer.Root open={!!selectedSeries} onOpenChange={(open) => !open && setSelectedSeries(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-app-bg text-app-text flex flex-col fixed inset-0 outline-none z-50">
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {!seriesDetails ? (
                <div className="flex flex-col items-center justify-center h-screen">
                  <Drawer.Title className="sr-only">Dizi Detayları Yükleniyor</Drawer.Title>
                  <Drawer.Description className="sr-only">Lütfen bekleyin, dizi bilgileri getiriliyor.</Drawer.Description>
                  <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative min-h-screen pb-32">
                  {/* Backdrop */}
                  <div className="h-[40vh] md:h-[50vh] relative overflow-hidden">
                    <img
                      src={`https://image.tmdb.org/t/p/original${seriesDetails.backdrop_path}`}
                      className="w-full h-full object-cover opacity-20 blur-[2px] scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/60 to-transparent" />

                    <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex items-center justify-between z-20">
                      <button
                        onClick={() => setSelectedSeries(null)}
                        className="w-11 h-11 bg-app-surface border border-app-border rounded-2xl flex items-center justify-center hover:bg-app-surface-muted transition-all active:scale-95 shadow-sm"
                      >
                        <CaretLeft size={22} weight="bold" className="text-app-text" />
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => selectedSeries && removeFromList(selectedSeries.id)}
                          className="w-11 h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl flex items-center justify-center transition-all active:scale-95"
                          title="Listeden Kaldır"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="max-w-5xl mx-auto px-6 md:px-10 -mt-56 relative z-10">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                      <div className="w-40 md:w-56 aspect-[2/3] rounded-[2rem] overflow-hidden shadow-xl border border-white shrink-0">
                        <img src={`https://image.tmdb.org/t/p/w500${seriesDetails.poster_path}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 pt-4 md:pt-6">
                        <Drawer.Title className="text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-tight text-app-text">{seriesDetails.name}</Drawer.Title>
                        <Drawer.Description className="sr-only">
                          {seriesDetails.name} dizi detayları ve bölüm takibi.
                        </Drawer.Description>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-app-muted mb-6">
                          <span className="flex items-center gap-1.5 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                            <Star size={16} weight="fill" />
                            <span className="text-base">{seriesDetails.vote_average?.toFixed(1)}</span>
                          </span>
                          <span className="bg-app-surface px-3 py-1.5 rounded-xl border border-app-border">{seriesDetails.first_air_date?.split('-')[0]}</span>
                          <span className="bg-app-surface px-3 py-1.5 rounded-xl border border-app-border">{seriesDetails.number_of_seasons} Sezon</span>
                          <span className="bg-app-surface px-3 py-1.5 rounded-xl border border-app-border">{seriesDetails.number_of_episodes} Bölüm</span>
                        </div>

                        <div className="flex bg-app-tab-track/50 p-1 rounded-2xl border border-app-border w-fit mb-8">
                          {[
                            { id: "plan_to_watch", label: "İzlemek İstiyorum" },
                            { id: "watching", label: "İzliyorum" },
                            { id: "dropped", label: "Yarım Bıraktım" },
                            { id: "completed", label: "İzledim" }
                          ].map(s => (
                            <button
                              key={s.id}
                              onClick={() => updateSeriesStatus(s.id as any)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${selectedSeries?.status === s.id
                                ? "bg-app-surface text-app-text shadow-sm border border-app-border"
                                : "text-app-muted hover:text-app-muted"
                                }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        {(selectedSeries?.status === "watching" || selectedSeries?.status === "dropped" || selectedSeries?.status === "plan_to_watch") && (
                          <div className="flex flex-wrap items-center gap-2 mb-8">
                            <button
                              onClick={markAllAsWatched}
                              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-lg flex items-center gap-2 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/40 active:scale-95 shadow-sm uppercase tracking-wider"
                            >
                              <CheckCircle size={16} weight="bold" />
                              <span>Tümünü İzledim</span>
                            </button>

                            <button
                              onClick={markSeasonAsWatched}
                              className="px-4 py-2 bg-app-tab-track border border-app-border text-app-text text-[10px] font-black rounded-lg flex items-center gap-2 transition-all hover:bg-app-border active:scale-95 shadow-sm uppercase tracking-wider"
                            >
                              <Monitor size={16} weight="bold" className="text-app-muted" />
                              <span>Bu Sezonu İzledim</span>
                            </button>
                          </div>
                        )}
                        <p className="text-app-muted text-base leading-relaxed max-w-2xl font-medium opacity-80">{seriesDetails.overview}</p>
                      </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="mt-12 flex items-center justify-between border-b border-app-border pb-5">
                      <div className="flex bg-app-tab-track p-1 rounded-xl border border-app-border">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-app-surface text-app-text shadow-sm border border-app-border' : 'text-app-muted hover:text-app-text'}`}
                        >
                          Bölüm Listesi
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('graph');
                            if (Object.keys(allSeasonsData).length === 0) fetchAllSeasonsForGraph();
                          }}
                          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'graph' ? 'bg-app-surface text-app-text shadow-sm border border-app-border' : 'text-app-muted hover:text-app-text'}`}
                        >
                          Rating Grafiği
                        </button>
                      </div>
                    </div>

                    {viewMode === 'list' ? (
                      <div className="mt-10">
                        {/* Seasons Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-5 scrollbar-hide no-scrollbar">
                          {[...(seriesDetails.seasons || [])].filter((s: any) => s.season_number > 0).reverse().map((s: any) => (
                            <button
                              key={s.season_number}
                              onClick={() => {
                                setActiveSeason(s.season_number);
                                fetchSeasonDetails(seriesDetails.id || seriesDetails.tmdb_id, s.season_number);
                              }}
                              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${activeSeason === s.season_number
                                ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20"
                                : "bg-app-surface border-app-border text-app-muted hover:text-app-text hover:border-app-muted"
                                }`}
                            >
                              Sezon {s.season_number}
                            </button>
                          ))}
                        </div>

                        {/* Episodes List */}
                        <div className="mt-6 border-t border-app-border">
                          {!seasonDetails[activeSeason] ? (
                            <div className="flex justify-center py-24">
                              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              {seasonDetails[activeSeason].episodes?.map((ep: any) => {
                                const watched = isEpisodeWatched(activeSeason, ep.episode_number);
                                const aired = hasEpisodeAired(ep.air_date);

                                return (
                                  <div
                                    key={ep.id}
                                    onClick={() => {
                                      if (!aired && !watched) {
                                        toast.error("Bu bölüm henüz yayınlanmadı.");
                                        return;
                                      }
                                      if (selectedSeries) toggleWatched(selectedSeries.id, activeSeason, ep.episode_number);
                                    }}
                                    className={`group cursor-pointer flex items-center gap-5 py-4 border-b border-app-border hover:bg-app-surface transition-all px-3 rounded-2xl -mx-3 active:scale-[0.98] ${!aired ? 'opacity-40' : ''}`}
                                  >
                                    {/* Checkbox */}
                                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${watched
                                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                                      : !aired
                                        ? "bg-app-tab-track text-app-muted border border-app-border"
                                        : "bg-app-surface text-app-muted border border-app-border group-hover:border-app-muted"
                                      }`}>
                                      <CheckCircle size={22} weight="bold" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-5">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className={`text-xl font-black tracking-tighter whitespace-nowrap ${watched ? 'text-app-muted' : 'text-app-muted'}`}>
                                          S{activeSeason} B{ep.episode_number}
                                        </span>
                                        <span className="text-app-muted font-bold text-lg">-</span>
                                        <span className={`text-lg font-bold truncate tracking-tight ${watched ? 'text-app-muted' : 'text-app-text'}`}>
                                          {ep.name}
                                        </span>
                                      </div>

                                      <div className="flex flex-col items-end shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${aired ? 'text-app-muted' : 'text-amber-600'}`}>
                                          {aired ? formatDateTurkish(ep.air_date) : getRelativeDate(ep.air_date)}
                                        </span>
                                        {!aired && (
                                          <span className="text-[9px] text-app-muted font-bold mt-0.5">
                                            {formatDateTurkish(ep.air_date)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Rating Graph View */
                      <div className="mt-10 overflow-x-auto pb-16 scrollbar-hide">
                        {loadingGraph ? (
                          <div className="flex flex-col items-center justify-center py-32 gap-5">
                            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-app-muted text-base font-black animate-pulse tracking-tighter uppercase">Rating verileri işleniyor</p>
                          </div>
                        ) : (
                          <div className="min-w-max">
                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-5 mb-10 px-4 bg-app-surface p-4 rounded-2xl border border-app-border w-fit shadow-sm">
                              {[
                                { label: "Elite", color: "bg-[#107c41]" },
                                { label: "Great", color: "bg-[#258752]" },
                                { label: "Good", color: "bg-[#cc9425]" },
                                { label: "Regular", color: "bg-[#c96324]" },
                                { label: "Bad", color: "bg-[#b8332a]" },
                              ].map(item => (
                                <div key={item.label} className="flex items-center gap-2.5">
                                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{item.label}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-8">
                              {/* Row Labels (E1, E2...) */}
                              <div className="flex flex-col gap-2 pt-10">
                                {Array.from({ length: Math.max(...Object.values(allSeasonsData).map((s: any) => s.episodes?.length || 0)) }).map((_, i) => (
                                  <div key={i} className="h-10 flex items-center justify-end pr-3 text-[10px] font-black text-app-muted w-8">
                                    E{i + 1}
                                  </div>
                                ))}
                              </div>

                              {/* Columns (Seasons) */}
                              <div className="flex gap-2">
                                {Object.keys(allSeasonsData).sort((a, b) => Number(a) - Number(b)).map((seasonNum) => (
                                  <div key={seasonNum} className="flex flex-col gap-2">
                                    <div className="h-8 flex items-center justify-center text-xs font-black text-app-muted mb-1">
                                      S{seasonNum}
                                    </div>
                                    {allSeasonsData[Number(seasonNum)].episodes?.map((ep: any) => (
                                      <div
                                        key={ep.id}
                                        className={`w-14 h-10 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-default shadow-sm ${getRatingColor(ep.vote_average)}`}
                                      >
                                        <span className="text-xs font-black tracking-tighter text-white">{ep.vote_average ? ep.vote_average.toFixed(1) : "-"}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
