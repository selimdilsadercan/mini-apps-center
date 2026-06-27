"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  SquaresFour,
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
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { series_track } from "@/lib/client";

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
  } catch (e) {}
};

const STATUS_LABELS: Record<series_track.SeriesStatus, { label: string; color: string; bg: string }> = {
  watching: { label: "İzliyorum", color: "text-blue-600", bg: "bg-blue-50" },
  plan_to_watch: { label: "İzlemek İstiyorum", color: "text-zinc-500", bg: "bg-zinc-100" },
  completed: { label: "Bitti", color: "text-emerald-600", bg: "bg-emerald-50" },
  dropped: { label: "Yarım Bıraktım", color: "text-rose-600", bg: "bg-rose-50" },
};

export default function SeriesTrackPage() {
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
    try {
      const res = await client.series_track.toggleEpisodeWatched({
        userId: user.id,
        seriesId: seriesId,
        seasonNumber: seasonNum,
        episodeNumber: episodeNum,
      });
      
      if (res.isWatched) {
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

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 font-sans selection:bg-indigo-100">
      <Toaster position="top-center" />

      {/* Subtle Premium Background Blur (Light) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] rounded-full blur-[120px] opacity-10 bg-indigo-200" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-[100px] opacity-10 bg-rose-100" />
      </div>

      <main className="flex-1 px-4 py-8 max-w-6xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all bg-white px-3.5 py-2 rounded-xl border border-gray-200/60 h-9 shadow-sm hover:border-gray-300 active:scale-95"
          >
            <SquaresFour size={16} weight="fill" className="text-indigo-500 shrink-0" />
            <span className="text-xs font-bold">Geri Dön</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(true)}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Plus size={18} weight="bold" className="text-indigo-600" />
              <span>Dizi Ekle</span>
            </button>
          </div>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-gray-900">SeriesTrack</h1>
          <p className="text-gray-500 text-sm">İzlediğin dizileri takip et, bölüm kaçırma.</p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {(["watching", "plan_to_watch", "dropped", "completed"] as series_track.SeriesStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatusTab(status)}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${
                activeStatusTab === status
                  ? "bg-white border-gray-200 text-gray-900 shadow-sm"
                  : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {STATUS_LABELS[status].label}
              <span className="ml-2 opacity-50">
                {mySeries.filter(s => s.status === status).length}
              </span>
            </button>
          ))}
        </div>

        {/* My List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : mySeries.filter(s => s.status === activeStatusTab).length === 0 ? (
          <div className="text-center py-32 bg-white border border-gray-200/50 rounded-3xl shadow-sm">
            <Monitor size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">Bu kategoride henüz dizi yok.</p>
            {activeStatusTab === "watching" && (
              <button 
                onClick={() => setShowSearch(true)}
                className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
              >
                Hemen bir dizi ara
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="group cursor-pointer relative bg-white border border-gray-200/50 hover:border-gray-300 rounded-[2rem] p-4 flex gap-6 transition-all hover:shadow-md shadow-sm"
                >
                  {/* Poster Area */}
                  <div className="w-32 aspect-[2/3] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 relative shrink-0 shadow-sm">
                    {series.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${series.poster_path}`} 
                        alt={series.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-center p-2 text-[10px]">
                        {series.title}
                      </div>
                    )}
                    
                    {/* Bookmark Tag */}
                    <div className="absolute top-0 left-2 w-4 h-6 bg-yellow-400 rounded-b-sm shadow-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-yellow-600/30 rounded-full" />
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="flex-1 min-w-0 py-2 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 truncate mb-4">{series.title}</h3>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black tracking-tighter text-gray-900">
                          {nextEp.isFinished ? "Bitti" : `S${nextEp.season} E${nextEp.episode}`}
                        </span>
                        {nextEp.totalLeft > 0 && (
                          <span className="text-sm font-bold text-indigo-600">+{nextEp.totalLeft}</span>
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
                              className="px-4 py-2 bg-white border border-gray-200 text-gray-900 text-[10px] font-black rounded-xl transition-all flex items-center gap-2 shadow-sm hover:border-indigo-200 active:scale-95 cursor-pointer"
                            >
                              <Play size={14} weight="fill" className="text-indigo-600" />
                              <span>İZLE</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWatched(series.id, nextEp.season, nextEp.episode);
                              }}
                              className="w-10 h-10 rounded-full bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 flex items-center justify-center transition-all group/btn cursor-pointer"
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
      </main>

      {/* Search Drawer */}
      <Drawer.Root open={showSearch} onOpenChange={setShowSearch}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white text-gray-900 flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-50 max-w-2xl mx-auto border-t border-gray-200">
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-indigo-500 outline-none transition-all"
                />
              </form>

              <div className="space-y-4">
                {searching ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                      className="self-center p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all active:scale-90"
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
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${
                                selectedSeries?.status === s.id 
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
                              className="px-4 py-2 bg-white border border-gray-200 text-gray-900 text-[10px] font-black rounded-xl flex items-center gap-2 transition-all hover:bg-indigo-50 hover:border-indigo-200 active:scale-95 shadow-sm uppercase tracking-wider"
                            >
                              <Monitor size={16} weight="bold" className="text-indigo-500" />
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
                              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                                activeSeason === s.season_number 
                                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" 
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
                              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                                    className={`group cursor-pointer flex items-center gap-5 py-4 border-b border-gray-50 hover:bg-white transition-all px-3 rounded-2xl -mx-3 ${!aired ? 'opacity-40' : ''}`}
                                  >
                                    {/* Checkbox */}
                                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                      watched 
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
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
    </div>
  );
}
