"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
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
  Shield,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { series_track } from "@/lib/client";
import SeriesTrackShell from "./components/SeriesTrackShell";

const client = createBrowserClient();

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

export default function SeriesTrackPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isAdmin } = useIsAdmin();
  const [mySeries, setMySeries] = useState<series_track.UserSeries[]>([]);
  const [loading, setLoading] = useState(true);

  // TV Flow States
  const [activeTab, setActiveTab] = useState<'my-series' | 'tv-flow'>('tv-flow');
  const [channels, setChannels] = useState<series_track.TvChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [tvProgram, setTvProgram] = useState<series_track.TvProgramDetails | null>(null);
  const [selectedTvEpisode, setSelectedTvEpisode] = useState<series_track.TvEpisode | null>(null);
  const [tvEpisodeStats, setTvEpisodeStats] = useState<series_track.TvEpisodeStatsResponse | null>(null);

  const [channelsLoading, setChannelsLoading] = useState(true);
  const [tvProgramLoading, setTvProgramLoading] = useState(false);
  const channelStripRef = useRef<HTMLDivElement>(null);
  const episodeStripRef = useRef<HTMLDivElement>(null);
  const [tvStatsLoading, setTvStatsLoading] = useState(false);
  const [screenStatic, setScreenStatic] = useState(false);

  // Admin Panel states
  const [adminSelectedEpisodeNumber, setAdminSelectedEpisodeNumber] = useState<number>(1);

  const handleAdminSetEpisode = async () => {
    if (!tvProgram) return;
    try {
      await client.series_track.setTvActiveEpisode({
        programId: tvProgram.id,
        episodeNumber: adminSelectedEpisodeNumber,
      });
      toast.success("Aktif bölüm güncellendi!");
      fetchTvProgramDetails(tvProgram.id);
    } catch (err) {
      console.error(err);
      toast.error("Aktif bölüm güncellenemedi.");
    }
  };

  // Dynamic EPG season & episode rebuild states
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [adminSelectedTmdbId, setAdminSelectedTmdbId] = useState<number>(37680); // Suits
  const [adminSeriesDetails, setAdminSeriesDetails] = useState<any>(null);
  const [adminSelectedSeason, setAdminSelectedSeason] = useState<number>(1);
  const [adminSelectedEpisode, setAdminSelectedEpisode] = useState<number>(1);
  const [adminLoadingDetails, setAdminLoadingDetails] = useState(false);
  const [adminStartDate, setAdminStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adminScheduleType, setAdminScheduleType] = useState<string>("daily");

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const ADMIN_POPULAR_SHOWS = [
    { id: 37680, name: "Suits" },
    { id: 2316, name: "The Office" },
    { id: 42009, name: "Black Mirror" },
    { id: 1396, name: "Breaking Bad" },
    { id: 1668, name: "Friends" },
    { id: 1399, name: "Game of Thrones" },
    { id: 1410, name: "Modern Family" },
  ];

  useEffect(() => {
    if (showAdminDrawer && adminSelectedTmdbId) {
      loadAdminSeriesDetails(adminSelectedTmdbId);
    }
  }, [adminSelectedTmdbId, showAdminDrawer]);

  const loadAdminSeriesDetails = async (tmdbId: number) => {
    try {
      setAdminLoadingDetails(true);
      const details = await client.series_track.getSeriesDetails(tmdbId);
      setAdminSeriesDetails(details);
      setAdminSelectedSeason(details.seasons?.[0]?.season_number || 1);
      setAdminSelectedEpisode(1);
    } catch (err) {
      console.error(err);
      toast.error("Seri detayları TMDB'den yüklenemedi.");
    } finally {
      setAdminLoadingDetails(false);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      setLoadingCalendar(true);
      const res = await client.series_track.getTvCalendarEvents();
      setCalendarEvents(res.events || []);
    } catch (err) {
      console.error("fetchCalendarEvents error:", err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Multi-season EPG states
  const [tvSeriesTmdbDetails, setTvSeriesTmdbDetails] = useState<any>(null);
  const [epgSelectedSeason, setEpgSelectedSeason] = useState<number>(1);
  const [epgSeasonEpisodes, setEpgSeasonEpisodes] = useState<any[]>([]);
  const [loadingEpgSeason, setLoadingEpgSeason] = useState(false);

  useEffect(() => {
    if (tvProgram && tvProgram.tmdb_id) {
      client.series_track.getSeriesDetails(tvProgram.tmdb_id).then(details => {
        setTvSeriesTmdbDetails(details);
      }).catch(console.error);
      setEpgSelectedSeason(tvProgram.season_number || 1);
    } else {
      setTvSeriesTmdbDetails(null);
    }
  }, [tvProgram]);

  useEffect(() => {
    if (tvProgram && tvProgram.tmdb_id && epgSelectedSeason) {
      setLoadingEpgSeason(true);
      client.series_track.getSeasonDetails(tvProgram.tmdb_id, epgSelectedSeason).then(res => {
        setEpgSeasonEpisodes(res.episodes || []);
      }).catch(console.error).finally(() => {
        setLoadingEpgSeason(false);
      });
    } else {
      setEpgSeasonEpisodes([]);
    }
  }, [tvProgram, epgSelectedSeason]);

  useEffect(() => {
    if (!selectedTvEpisode || !episodeStripRef.current) return;
    const activeEl = episodeStripRef.current.querySelector(
      `[data-episode-num="${selectedTvEpisode.episode_number}"]`
    );
    activeEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedTvEpisode?.episode_number, epgSelectedSeason, loadingEpgSeason]);

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

  useEffect(() => {
    if (activeTab === "tv-flow") {
      fetchCalendarEvents();
    }
  }, [activeTab]);

  const handleAdminChangeSeasonEpisode = async () => {
    if (!tvProgram) return;
    try {
      await client.series_track.changeTvProgramSeasonEpisode({
        programId: tvProgram.id,
        tmdbId: adminSelectedTmdbId,
        seasonNumber: adminSelectedSeason,
        episodeNumber: adminSelectedEpisode,
        startDate: new Date(adminStartDate).toISOString(),
        scheduleType: adminScheduleType,
      });
      toast.success("Yayın akışı başarıyla güncellendi!");
      setShowAdminDrawer(false);
      fetchTvProgramDetails(tvProgram.id);
      fetchCalendarEvents();
    } catch (err) {
      console.error(err);
      toast.error("Yayın akışı güncellenemedi.");
    }
  };

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

      // Auto-select first channel
      if (res.channels && res.channels.length > 0 && !activeChannelId) {
        setActiveChannelId(res.channels[0].id);
        if (res.channels[0].active_program) {
          setSelectedProgramId(res.channels[0].active_program.id);
        }
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
      fetchTvProgramDetails(selectedProgramId);
    } else {
      setTvProgram(null);
    }
  }, [selectedProgramId, activeTab, user]);

  async function fetchTvProgramDetails(id: string) {
    try {
      setTvProgramLoading(true);
      const res = await client.series_track.getTvProgramDetails(id, {
        userId: user?.id || "",
      });
      setTvProgram(res);

      if (res.episodes && res.episodes.length > 0) {
        const released = res.episodes.filter(e => e.is_released);
        const latestReleased = released.length > 0 ? released[released.length - 1] : res.episodes[0];
        setSelectedTvEpisode(latestReleased);
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
      if (channel.active_program) {
        setSelectedProgramId(channel.active_program.id);
      } else {
        setSelectedProgramId(null);
        setSelectedTvEpisode(null);
      }
    });
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

    try {
      await client.series_track.addUserSeries({
        userId: user.id,
        tmdbId: series.id,
        title: series.name,
        posterPath: series.poster_path,
        backdropPath: series.backdrop_path,
        status: "watching",
      });
      toast.success(`${series.name} listeye eklendi.`);
      fetchMySeries();
      setShowSearch(false);
    } catch (error) {
      toast.error("Dizi eklenemedi.");
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
    if (rating >= 9.0) return "bg-emerald-900 text-emerald-100 border-emerald-800";
    if (rating >= 8.0) return "bg-emerald-700 text-emerald-50 border-emerald-600";
    if (rating >= 7.0) return "bg-yellow-600/80 text-yellow-50 border-yellow-500/50";
    if (rating >= 6.0) return "bg-orange-600/80 text-orange-50 border-orange-500/50";
    return "bg-rose-900/80 text-rose-50 border-rose-800/50";
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

      // Update local state for all episodes
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
    try {
      await client.series_track.updateUserSeriesStatus({
        userId: user.id,
        seriesId: selectedSeries.id,
        status: status
      });
      setSelectedSeries({ ...selectedSeries, status: status });
      setMySeries(prev => prev.map(s => s.id === selectedSeries.id ? { ...s, status: status } : s));
      toast.success(`Durum güncellendi: ${STATUS_LABELS[status].label}`);
    } catch (error) {
      toast.error("Durum güncellenemedi.");
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
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 mb-4 overflow-x-auto no-scrollbar">
              {(["watching", "plan_to_watch", "dropped", "completed"] as series_track.SeriesStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatusTab(status)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${
                    activeStatusTab === status
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {STATUS_LABELS[status].label}
                  <span className="ml-1 text-red-500 tabular-nums">
                    {mySeries.filter(s => s.status === status).length}
                  </span>
                </button>
              ))}
            </div>

            {/* My List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-gray-200/60" />
                ))}
              </div>
            ) : mySeries.filter(s => s.status === activeStatusTab).length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200/60 rounded-2xl shadow-sm">
                <Monitor size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">Bu kategoride henüz dizi yok.</p>
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
                        className="group cursor-pointer bg-white border border-gray-200/60 hover:border-red-200 rounded-xl p-3 flex gap-3 transition-all shadow-sm active:scale-[0.99]"
                      >
                        <div className="w-[88px] aspect-[2/3] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 relative shrink-0">
                          {series.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                              alt={series.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-center p-1 text-[9px]">
                              {series.title}
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-black text-gray-900 truncate">{series.title}</h3>

                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-lg font-black tracking-tight text-gray-900">
                                {nextEp.isFinished ? "Bitti" : `S${nextEp.season} E${nextEp.episode}`}
                              </span>
                              {nextEp.totalLeft > 0 && (
                                <span className="text-sm font-bold text-red-600">+{nextEp.totalLeft}</span>
                              )}
                            </div>

                            <p className="text-xs text-gray-400 mt-2 truncate font-medium">
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
                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-900 text-[10px] font-black rounded-xl transition-all flex items-center gap-2 shadow-sm hover:border-red-200 active:scale-95 cursor-pointer"
                                  >
                                    <Play size={14} weight="fill" className="text-red-600" />
                                    <span>İZLE</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleWatched(series.id, nextEp.season, nextEp.episode);
                                    }}
                                    className="w-10 h-10 rounded-full bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 flex items-center justify-center transition-all group/btn cursor-pointer active:scale-90"
                                  >
                                    <CheckCircle size={20} weight="bold" className="text-gray-300 group-hover/btn:text-emerald-500" />
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
                    <div key={n} className="shrink-0 w-[88px] h-[80px] bg-white border border-gray-200/60 rounded-xl animate-pulse" />
                  ))
                : channels.map((chan, idx) => {
                    const isActive = chan.id === activeChannelId;
                    return (
                      <button
                        key={chan.id}
                        data-channel-id={chan.id}
                        onClick={() => handleChannelSwitch(chan)}
                        className={`shrink-0 snap-center w-[88px] min-h-[80px] flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95 ${
                          isActive
                            ? "bg-white shadow-sm"
                            : "bg-white/60 border-gray-200/40 hover:bg-white"
                        }`}
                        style={isActive ? { borderColor: chan.color } : undefined}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isActive ? `${chan.color}18` : "#f1f5f9",
                            color: isActive ? chan.color : "#94a3b8",
                          }}
                        >
                          <Television size={16} weight={isActive ? "fill" : "regular"} />
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase w-full text-center leading-tight line-clamp-2 ${
                            isActive ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {chan.name}
                        </span>
                        <span className="text-[8px] font-mono text-gray-400 leading-none shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </button>
                    );
                  })}
            </div>

            {/* Program + episode */}
            <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
              {tvProgramLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                  <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Yükleniyor…</span>
                </div>
              ) : selectedTvEpisode && tvProgram ? (
                (() => {
                  const accent = activeChannel?.color || "#EF4444";
                  const currentSeriesRecord = mySeries.find((s) => s.tmdb_id === tvProgram.tmdb_id);
                  const seriesProgress = currentSeriesRecord ? allSeriesProgress[currentSeriesRecord.id] || [] : [];
                  const isEpWatched = !!(
                    selectedTvEpisode.watched ||
                    seriesProgress?.some(
                      (p) =>
                        p.season_number === (epgSelectedSeason || tvProgram.season_number || 1) &&
                        p.episode_number === selectedTvEpisode.episode_number
                    )
                  );

                  return (
                    <div className="space-y-4">
                      {/* Hero */}
                      <div className="flex gap-3">
                        {tvProgram.cover_image && (
                          <img
                            src={tvProgram.cover_image}
                            alt={tvProgram.title}
                            className="w-[72px] aspect-[2/3] object-cover rounded-xl border border-gray-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h2 className="text-sm font-black text-gray-900 leading-tight truncate">
                                {tvProgram.title}
                              </h2>
                              <p className="text-[10px] font-bold mt-0.5" style={{ color: accent }}>
                                Sezon {epgSelectedSeason || tvProgram.season_number} · Bölüm {selectedTvEpisode.episode_number}
                              </p>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => setShowAdminDrawer(true)}
                                className="shrink-0 w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
                                title="Yayını düzenle"
                              >
                                <Shield size={15} />
                              </button>
                            )}
                          </div>
                          <h3 className="text-base font-black text-gray-950 mt-2 leading-snug">
                            {selectedTvEpisode.title}
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-1">
                            {selectedTvEpisode.description || "Bu bölüm için açıklama yok."}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const query = `${tvProgram.title} Sezon ${tvProgram.season_number || 1} Bölüm ${selectedTvEpisode.episode_number} izle`;
                            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-black active:scale-[0.98] transition-all"
                        >
                          <Play size={14} weight="fill" />
                          İzle
                        </button>
                        <button
                          onClick={() => handleTvWatchToggle(selectedTvEpisode)}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-[0.98] ${
                            isEpWatched
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <CheckCircle size={15} weight={isEpWatched ? "fill" : "regular"} />
                          İzledim
                        </button>
                      </div>

                      {isEpWatched && (
                        <div className="flex items-center gap-1">
                          {["🔥", "😂", "😢", "😮", "👍"].map((emoji) => {
                            const isSelected = selectedTvEpisode.emoji_reaction === emoji;
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleTvWatchToggle(selectedTvEpisode, emoji)}
                                className={`h-8 w-8 flex items-center justify-center text-sm rounded-lg transition-all ${
                                  isSelected ? "bg-red-50 ring-1 ring-red-200 scale-105" : "bg-gray-50 hover:bg-gray-100"
                                }`}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {tvEpisodeStats && tvEpisodeStats.watch_count > 0 && (
                        <p className="text-[10px] text-gray-400">
                          <span className="font-bold text-gray-600">{tvEpisodeStats.watch_count}</span> kişi izledi
                          {Object.keys(tvEpisodeStats.emojis).length > 0 && (
                            <span className="ml-2">
                              {Object.entries(tvEpisodeStats.emojis)
                                .slice(0, 3)
                                .map(([emoji, count]) => `${emoji}${count}`)
                                .join(" ")}
                            </span>
                          )}
                        </p>
                      )}

                      {/* Episode strip */}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Bölümler
                          </span>
                          {tvSeriesTmdbDetails && (
                            <select
                              value={epgSelectedSeason}
                              onChange={(e) => setEpgSelectedSeason(Number(e.target.value))}
                              className="text-[10px] font-bold text-gray-600 bg-gray-100 border-0 rounded-lg px-2 py-1 outline-none cursor-pointer"
                            >
                              {tvSeriesTmdbDetails.seasons?.map((s: { season_number: number }) => (
                                <option key={s.season_number} value={s.season_number}>
                                  Sezon {s.season_number}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {loadingEpgSeason ? (
                          <div className="flex gap-1.5 overflow-hidden py-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div key={n} className="shrink-0 w-11 h-16 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                          </div>
                        ) : (
                          <div
                            ref={episodeStripRef}
                            className="flex gap-1.5 overflow-x-auto py-1 snap-x snap-mandatory"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                          >
                            {epgSeasonEpisodes?.map((ep) => {
                              const releaseDate = getEpisodeReleaseDate(epgSelectedSeason, ep.episode_number);
                              const { day, month } = formatEpisodeDate(releaseDate);
                              const isReleased = releaseDate <= new Date();
                              const isWatched =
                                epgSelectedSeason === tvProgram.season_number
                                  ? tvProgram.episodes?.find((x) => x.episode_number === ep.episode_number)?.watched
                                  : seriesProgress?.some(
                                      (p) =>
                                        p.season_number === epgSelectedSeason &&
                                        p.episode_number === ep.episode_number
                                    );
                              const isSelected = selectedTvEpisode.episode_number === ep.episode_number;

                              return (
                                <button
                                  key={ep.id}
                                  data-episode-num={ep.episode_number}
                                  disabled={!isReleased}
                                  onClick={() => {
                                    if (epgSelectedSeason === tvProgram.season_number) {
                                      const matchedDbEp = tvProgram.episodes?.find(
                                        (x) => x.episode_number === ep.episode_number
                                      );
                                      if (matchedDbEp) setSelectedTvEpisode(matchedDbEp);
                                    } else {
                                      setSelectedTvEpisode({
                                        id: ep.id,
                                        episode_number: ep.episode_number,
                                        title: ep.name || `Bölüm ${ep.episode_number}`,
                                        description: ep.overview || "",
                                        stream_info: "Netflix",
                                        release_date: releaseDate.toISOString(),
                                        is_released: isReleased,
                                        watched: isWatched || false,
                                        emoji_reaction: null,
                                      });
                                    }
                                  }}
                                  className={`shrink-0 snap-center relative w-11 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-95 ${
                                    !isReleased
                                      ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                                      : isSelected
                                        ? "text-white shadow-sm"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                  style={isSelected && isReleased ? { backgroundColor: accent } : undefined}
                                  title={`B${ep.episode_number} · ${ep.name || `Bölüm ${ep.episode_number}`}`}
                                >
                                  <div
                                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none ${
                                      !isReleased
                                        ? "bg-gray-100 text-gray-400"
                                        : isSelected
                                          ? "bg-white/25 text-white"
                                          : "bg-white text-gray-700 shadow-sm border border-gray-200/70"
                                    }`}
                                  >
                                    B{ep.episode_number}
                                  </div>
                                  <span
                                    className={`text-sm font-black leading-none ${
                                      !isReleased ? "text-gray-300" : isSelected ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {day}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold uppercase leading-none ${
                                      isSelected ? "text-white/85" : isReleased ? "text-gray-500" : "text-gray-300"
                                    }`}
                                  >
                                    {month}
                                  </span>
                                  {isWatched && (
                                    <CheckCircle
                                      size={11}
                                      weight="fill"
                                      className={`absolute bottom-0.5 right-0.5 ${
                                        isSelected ? "text-white/90" : "text-emerald-500"
                                      }`}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm text-center">
                  <Television size={32} className="mb-2 opacity-40" />
                  <span>Bu kanalda aktif yayın yok</span>
                </div>
              )}
            </div>
          </div>
        )}

    </SeriesTrackShell>

      {/* Search Drawer */}
      <Drawer.Root open={showSearch} onOpenChange={setShowSearch}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white text-gray-900 flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-50 max-w-xl mx-auto border-t border-gray-200">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-100 mb-8" />
              <Drawer.Title className="text-2xl font-black mb-2">Dizi Ara</Drawer.Title>
              <Drawer.Description className="text-gray-500 text-xs mb-6">
                İzlemek istediğiniz diziyi TMDB üzerinden arayın ve listenize ekleyin.
              </Drawer.Description>

              <form onSubmit={handleSearch} className="relative mb-8">
                <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Dizi adı yazın..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-red-500 outline-none transition-all"
                />
              </form>

              <div className="space-y-4">
                {searching ? (
                  <div className="flex justify-center py-12"> 
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchResults.map((result) => (
                  <div key={result.id} className="flex gap-4 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                    <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {result.poster_path && (
                        <img src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-bold truncate text-gray-900">{result.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{result.overview || "Açıklama yok."}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-gray-400">
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
          <Drawer.Content className="bg-[#FAF9F7] text-gray-900 flex flex-col fixed inset-0 outline-none z-50">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F7] via-[#FAF9F7]/60 to-transparent" />

                    <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex items-center justify-between z-20">
                      <button
                        onClick={() => setSelectedSeries(null)}
                        className="w-11 h-11 bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                      >
                        <CaretLeft size={22} weight="bold" className="text-gray-900" />
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
                        <Drawer.Title className="text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-tight text-gray-900">{seriesDetails.name}</Drawer.Title>
                        <Drawer.Description className="sr-only">
                          {seriesDetails.name} dizi detayları ve bölüm takibi.
                        </Drawer.Description>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500 mb-6">
                          <span className="flex items-center gap-1.5 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                            <Star size={16} weight="fill" />
                            <span className="text-base">{seriesDetails.vote_average?.toFixed(1)}</span>
                          </span>
                          <span className="bg-white px-3 py-1.5 rounded-xl border border-gray-200">{seriesDetails.first_air_date?.split('-')[0]}</span>
                          <span className="bg-white px-3 py-1.5 rounded-xl border border-gray-200">{seriesDetails.number_of_seasons} Sezon</span>
                          <span className="bg-white px-3 py-1.5 rounded-xl border border-gray-200">{seriesDetails.number_of_episodes} Bölüm</span>
                        </div>

                        <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-200/50 w-fit mb-8">
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
                                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                  : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        {selectedSeries?.status === "watching" && (
                          <div className="flex flex-wrap items-center gap-2 mb-8">
                            <button
                              onClick={markAllAsWatched}
                              className="px-4 py-2 bg-white border border-gray-200 text-emerald-600 text-[10px] font-black rounded-xl flex items-center gap-2 transition-all hover:bg-emerald-50 hover:border-emerald-200 active:scale-95 shadow-sm uppercase tracking-wider"
                            >
                              <CheckCircle size={16} weight="bold" />
                              <span>Tümünü İzledim</span>
                            </button>

                            <button
                              onClick={markSeasonAsWatched}
                              className="px-4 py-2 bg-white border border-gray-200 text-gray-900 text-[10px] font-black rounded-xl flex items-center gap-2 transition-all hover:bg-red-50 hover:border-red-200 active:scale-95 shadow-sm uppercase tracking-wider"
                            >
                              <Monitor size={16} weight="bold" className="text-red-500" />
                              <span>Bu Sezonu İzledim</span>
                            </button>
                          </div>
                        )}
                        <p className="text-gray-600 text-base leading-relaxed max-w-2xl font-medium opacity-80">{seriesDetails.overview}</p>
                      </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="mt-12 flex items-center justify-between border-b border-gray-200 pb-5">
                      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Bölüm Listesi
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('graph');
                            if (Object.keys(allSeasonsData).length === 0) fetchAllSeasonsForGraph();
                          }}
                          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'graph' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
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
                                fetchSeasonDetails(seriesDetails.id, s.season_number);
                              }}
                              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${activeSeason === s.season_number
                                  ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20"
                                  : "bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300"
                                }`}
                            >
                              Sezon {s.season_number}
                            </button>
                          ))}
                        </div>

                        {/* Episodes List */}
                        <div className="mt-6 border-t border-gray-100">
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
                                    className={`group cursor-pointer flex items-center gap-5 py-4 border-b border-gray-50 hover:bg-white transition-all px-3 rounded-2xl -mx-3 active:scale-[0.98] ${!aired ? 'opacity-40' : ''}`}
                                  >
                                    {/* Checkbox */}
                                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${watched
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                                        : !aired
                                          ? "bg-gray-100 text-gray-200 border border-gray-200"
                                          : "bg-white text-gray-200 border border-gray-200 group-hover:border-gray-400"
                                      }`}>
                                      <CheckCircle size={22} weight="bold" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-5">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <span className={`text-xl font-black tracking-tighter whitespace-nowrap ${watched ? 'text-gray-300' : 'text-gray-400'}`}>
                                          S{activeSeason} B{ep.episode_number}
                                        </span>
                                        <span className="text-gray-200 font-bold text-lg">-</span>
                                        <span className={`text-lg font-bold truncate tracking-tight ${watched ? 'text-gray-300' : 'text-gray-900'}`}>
                                          {ep.name}
                                        </span>
                                      </div>

                                      <div className="flex flex-col items-end shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${aired ? 'text-gray-400' : 'text-amber-600'}`}>
                                          {aired ? formatDateTurkish(ep.air_date) : getRelativeDate(ep.air_date)}
                                        </span>
                                        {!aired && (
                                          <span className="text-[9px] text-gray-400 font-bold mt-0.5">
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
                            <p className="text-gray-400 text-base font-black animate-pulse tracking-tighter uppercase">Rating verileri işleniyor</p>
                          </div>
                        ) : (
                          <div className="min-w-max">
                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-5 mb-10 px-4 bg-white p-4 rounded-2xl border border-gray-200/50 w-fit shadow-sm">
                              {[
                                { label: "Elite", color: "bg-emerald-800" },
                                { label: "Great", color: "bg-emerald-600" },
                                { label: "Good", color: "bg-yellow-500" },
                                { label: "Regular", color: "bg-orange-500" },
                                { label: "Bad", color: "bg-rose-800" },
                              ].map(item => (
                                <div key={item.label} className="flex items-center gap-2.5">
                                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-8">
                              {/* Row Labels (E1, E2...) */}
                              <div className="flex flex-col gap-2 pt-10">
                                {Array.from({ length: Math.max(...Object.values(allSeasonsData).map((s: any) => s.episodes?.length || 0)) }).map((_, i) => (
                                  <div key={i} className="h-10 flex items-center justify-end pr-3 text-[10px] font-black text-gray-300 w-8">
                                    E{i + 1}
                                  </div>
                                ))}
                              </div>

                              {/* Columns (Seasons) */}
                              <div className="flex gap-2">
                                {Object.keys(allSeasonsData).sort((a, b) => Number(a) - Number(b)).map((seasonNum) => (
                                  <div key={seasonNum} className="flex flex-col gap-2">
                                    <div className="h-8 flex items-center justify-center text-xs font-black text-gray-400 mb-1">
                                      S{seasonNum}
                                    </div>
                                    {allSeasonsData[Number(seasonNum)].episodes?.map((ep: any) => (
                                      <div
                                        key={ep.id}
                                        className={`w-14 h-10 rounded-lg flex flex-col items-center justify-center transition-all hover:brightness-110 cursor-default border ${getRatingColor(ep.vote_average)}`}
                                      >
                                        <span className="text-sm font-black tracking-tighter text-white">{ep.vote_average?.toFixed(1)}</span>
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

      {/* Admin Panel Drawer */}
      <Drawer.Root open={showAdminDrawer} onOpenChange={setShowAdminDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" />
          <Drawer.Content className="bg-white text-gray-900 flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85dvh] outline-none z-50 max-w-xl mx-auto border-t border-gray-200">
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-200 mb-4" />
              <div>
                <Drawer.Title className="text-2xl font-black mb-1 flex items-center gap-2">
                  <Shield size={24} className="text-rose-600" />
                  <span>Akış Yönetim Paneli</span>
                </Drawer.Title>
                <Drawer.Description className="text-gray-500 text-xs">
                  Bu kanalda yayınlanan programın içeriğini, aktif sezonunu ve yayındaki aktif bölümünü değiştirin.
                </Drawer.Description>
              </div>

              {/* 1. Dizi Seçimi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">1. Program Dizisi Seç</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ADMIN_POPULAR_SHOWS.map((show) => {
                    const isSelected = adminSelectedTmdbId === show.id;
                    return (
                      <button
                        key={show.id}
                        onClick={() => setAdminSelectedTmdbId(show.id)}
                        className={`p-3 rounded-2xl border text-left text-xs font-black transition-all cursor-pointer ${isSelected
                            ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                            : "bg-gray-50 border-gray-200/60 text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        {show.name}
                      </button>
                    );
                  })}
                  {/* Custom TMDB ID input option */}
                  <div className="p-2 rounded-2xl border border-gray-200/60 bg-gray-50 flex items-center gap-1.5 col-span-2 md:col-span-1">
                    <input
                      type="number"
                      placeholder="TMDB ID..."
                      value={adminSelectedTmdbId || ""}
                      onChange={(e) => setAdminSelectedTmdbId(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Sezon & Bölüm Seçimi (Sezonlara Göre Gruplanmış Bölümler) */}
              {adminLoadingDetails ? (
                <div className="flex items-center justify-center py-12 text-gray-400 font-mono text-xs">
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Dizi detayları yükleniyor...</span>
                </div>
              ) : adminSeriesDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Season selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider block">2. Sezon Seç</label>
                      <select
                        value={adminSelectedSeason}
                        onChange={(e) => {
                          setAdminSelectedSeason(Number(e.target.value));
                          setAdminSelectedEpisode(1);
                        }}
                        className="w-full bg-white border border-gray-200 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                      >
                        {adminSeriesDetails.seasons?.map((s: any) => (
                          <option key={s.season_number} value={s.season_number}>
                            {s.name || `Sezon ${s.season_number}`} ({s.episode_count} Bölüm)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Episode selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider block">3. Yayındaki Bölüm</label>
                      <select
                        value={adminSelectedEpisode}
                        onChange={(e) => setAdminSelectedEpisode(Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer font-mono"
                      >
                        {Array.from({
                          length: adminSeriesDetails.seasons?.find((s: any) => s.season_number === adminSelectedSeason)?.episode_count || 0
                        }).map((_, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            Bölüm {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Schedule details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider block">Başlangıç Tarihi</label>
                      <input
                        type="date"
                        value={adminStartDate}
                        onChange={(e) => setAdminStartDate(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider block">Tekrar Sıklığı</label>
                      <select
                        value={adminScheduleType}
                        onChange={(e) => setAdminScheduleType(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs font-bold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                      >
                        <option value="daily">Günlük (Her Gün 1 Bölüm)</option>
                        <option value="weekly">Haftalık (Her Hafta 1 Bölüm)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-mono">Dizi seçildiğinde sezon bilgisi burada listelenecektir.</p>
              )}

              {/* 3. Takvim Görünümü (Calendar View) */}
              <div className="space-y-3 pt-4 border-t border-gray-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Yayın Takvimi (Önizleme)</label>
                  <span className="text-[9px] font-mono text-gray-400">Gelecek 28 Gün</span>
                </div>
                {loadingCalendar ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : calendarEvents.length > 0 ? (
                  <div className="grid grid-cols-7 gap-1.5 p-3 bg-gray-50 border border-gray-150 rounded-2xl max-h-72 overflow-y-auto">
                    {/* Calendar days labels */}
                    {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                      <div key={d} className="text-center text-[9px] font-black text-gray-400 uppercase font-mono py-1">
                        {d}
                      </div>
                    ))}
                    {(() => {
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      const dayDiff = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1;
                      startOfWeek.setDate(startOfWeek.getDate() - dayDiff); // Monday

                      return Array.from({ length: 28 }).map((_, idx) => {
                        const cellDate = new Date(startOfWeek);
                        cellDate.setDate(cellDate.getDate() + idx);
                        const isToday = cellDate.toDateString() === today.toDateString();

                        // Find EPG episodes for this day
                        const dayEvents = calendarEvents.filter((ev) => {
                          const evDate = new Date(ev.release_date);
                          return evDate.toDateString() === cellDate.toDateString();
                        });

                        return (
                          <div
                            key={idx}
                            className={`min-h-[55px] p-1.5 rounded-xl border flex flex-col justify-between ${isToday
                                ? "bg-rose-50/60 border-rose-200"
                                : "bg-white border-gray-200/50"
                              }`}
                          >
                            <span className={`text-[9px] font-mono font-bold ${isToday ? "text-rose-600 font-extrabold" : "text-gray-400"}`}>
                              {cellDate.getDate()}
                            </span>
                            <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                              {dayEvents.map((ev, eIdx) => (
                                <div
                                  key={eIdx}
                                  title={`${ev.program_title} - Sezon ${ev.season_number} Bölüm ${ev.episode_number}: ${ev.title}`}
                                  className="text-[8px] font-black px-1 py-0.5 rounded-md truncate leading-tight bg-pink-100/75 text-pink-750 border border-pink-200/30"
                                >
                                  {ev.program_title.split(" ")[0]} S{ev.season_number}E{ev.episode_number}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-mono py-2">Henüz takvimde planlanmış bir bölüm yok.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-150">
                <button
                  disabled={adminLoadingDetails || !adminSeriesDetails}
                  onClick={handleAdminChangeSeasonEpisode}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-2xl text-xs uppercase tracking-wider font-mono shadow-sm transition-all active:scale-95 cursor-pointer"
                  style={{ backgroundColor: (adminLoadingDetails || !adminSeriesDetails) ? "" : "#E11D48" }}
                >
                  Yayın Akışını Güncelle
                </button>
                <button
                  onClick={() => setShowAdminDrawer(false)}
                  className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-black rounded-2xl text-xs uppercase tracking-wider font-mono transition-all active:scale-95 cursor-pointer"
                >
                  Kapat
                </button>
              </div>

            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
