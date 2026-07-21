"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/api";
import {
  FilmStrip,
  Television,
  Trophy,
  ArrowsClockwise,
  MagnifyingGlass,
  Info,
  Calendar,
  Trash,
  HandHeart,
  Check,
  X
} from "@phosphor-icons/react";
import toast from "react-hot-toast";

const client = createBrowserClient();

export default function AdminCatalogPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"movies" | "series" | "matches" | "contributions">("movies");
  const [searchTerm, setSearchTerm] = useState("");
  const [movieSubTab, setMovieSubTab] = useState<"popular" | "top_rated" | "all">("popular");
  const [seriesSubTab, setSeriesSubTab] = useState<"popular" | "top_rated" | "all">("popular");

  // Add Movie Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [movieQuery, setMovieQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch admin catalog data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminCatalog"],
    queryFn: async () => {
      const res = await client.catalog.getAdminCatalog();
      return res;
    }
  });

  // Fetch contributions (only recipes for now, approved + pending)
  const { data: contribs, isLoading: isContribsLoading } = useQuery({
    queryKey: ["adminContributions"],
    queryFn: async () => {
      const res = await client.contributions.getContributions("recipe", { onlyApproved: false });
      return res.contributions || [];
    },
    enabled: activeTab === "contributions"
  });

  // Approve/Reject contribution mutation
  const approveContribMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      return await client.contributions.approveContribution({ id, approved });
    },
    onSuccess: (_, variables) => {
      if (variables.approved) {
        toast.success("Tarif başarıyla onaylandı ve topluluğa eklendi!");
      } else {
        toast.success("Tarif reddedildi ve silindi.");
      }
      queryClient.invalidateQueries({ queryKey: ["adminContributions"] });
    },
    onError: (err: any) => {
      toast.error(`İşlem hatası: ${err.message || "Bilinmeyen hata"}`);
    }
  });

  const promoteMovieMutation = useMutation({
    mutationFn: async (movieId: string) => {
      return await client.catalog.promoteMovieToPopular({ movieId, popularity: 9999.0 });
    },
    onSuccess: () => {
      toast.success("Film başarıyla öne çıkarılarak kataloğa eklendi!");
      setIsAddModalOpen(false);
      setMovieQuery("");
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ["adminCatalog"] });
    },
    onError: (err: any) => {
      toast.error(`Ekleme hatası: ${err.message || "Bilinmeyen hata"}`);
    }
  });

  const handleSearchTmdb = async () => {
    if (!movieQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await client.catalog.searchFilms({ query: movieQuery });
      setSearchResults(res.movies || []);
    } catch (err) {
      toast.error("TMDB arama hatası");
    } finally {
      setIsSearching(false);
    }
  };

  // Sync mutations
  const syncMoviesMutation = useMutation({
    mutationFn: async () => {
      return await client.catalog.runSyncPopularFilms();
    },
    onSuccess: () => {
      toast.success("Popüler filmler başarıyla eşitlendi!");
      queryClient.invalidateQueries({ queryKey: ["adminCatalog"] });
    },
    onError: (err: any) => {
      toast.error(`Eşitleme hatası: ${err.message || "Bilinmeyen hata"}`);
    }
  });

  const syncMatchesMutation = useMutation({
    mutationFn: async () => {
      return await client.catalog.runSyncBigMatches();
    },
    onSuccess: (res: any) => {
      toast.success(`${res.count} maç başarıyla eşitlendi!`);
      queryClient.invalidateQueries({ queryKey: ["adminCatalog"] });
    },
    onError: (err: any) => {
      toast.error(`Eşitleme hatası: ${err.message || "Bilinmeyen hata"}`);
    }
  });

  const deleteMovieMutation = useMutation({
    mutationFn: async (movieId: string) => {
      return await client.catalog.deleteCatalogMovie(movieId);
    },
    onSuccess: () => {
      toast.success("Film katalogdan kaldırıldı.");
      queryClient.invalidateQueries({ queryKey: ["adminCatalog"] });
    },
    onError: (err: any) => {
      toast.error(`Silme hatası: ${err.message || "Bilinmeyen hata"}`);
    }
  });

  const deleteMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return await client.catalog.deleteCatalogMatch(matchId);
    },
    onSuccess: () => {
      toast.success("Maç katalogdan kaldırıldı.");
      queryClient.invalidateQueries({ queryKey: ["adminCatalog"] });
    },
    onError: (err: any) => {
      toast.error(`Silme hatası: ${err.message || "Bilinmeyen hata"}`);
    }
  });

  const rawMovies = data?.movies || [];
  const rawSeries = data?.series || [];
  const matches = data?.matches || [];

  // Movie filtering & sorting
  const filteredMovies = useMemo(() => {
    let list = rawMovies.filter(m =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.original_title && m.original_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (movieSubTab === "popular") {
      list = list.filter(m => m.is_popular === "true");
    } else if (movieSubTab === "top_rated") {
      list = list.filter(m => m.is_top_rated === "true").sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0));
    }
    return list;
  }, [rawMovies, searchTerm, movieSubTab]);

  // Series filtering & sorting
  const filteredSeries = useMemo(() => {
    let list = rawSeries.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.original_name && s.original_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (seriesSubTab === "popular") {
      list = list.filter(s => s.is_popular === "true");
    } else if (seriesSubTab === "top_rated") {
      list = [...list].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    }
    return list;
  }, [rawSeries, searchTerm, seriesSubTab]);

  const filteredMatches = matches.filter(m =>
    m.home.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.away.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.competition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Katalog Yönetimi</h1>
          <p className="text-sm text-stone-500 mt-1">Sistem genelinde cache'lenen medya ve spor maçları.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "movies" && (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 active:scale-95 transition-all cursor-pointer font-black"
              >
                <span>Yeni Önerilen Ekle</span>
              </button>
              <button
                onClick={() => syncMoviesMutation.mutate()}
                disabled={syncMoviesMutation.isPending}
                className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200/80 disabled:opacity-50 text-stone-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-stone-200/60 active:scale-95 transition-all cursor-pointer font-black"
              >
                <ArrowsClockwise size={14} className={syncMoviesMutation.isPending ? "animate-spin" : ""} />
                <span>Filmleri Eşitle</span>
              </button>
            </>
          )}

          {activeTab === "matches" && (
            <button
              onClick={() => syncMatchesMutation.mutate()}
              disabled={syncMatchesMutation.isPending}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer font-black"
            >
              <ArrowsClockwise size={14} className={syncMatchesMutation.isPending ? "animate-spin" : ""} />
              <span>Maçları Eşitle</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-stone-200 bg-stone-100 shrink-0">
          <button
            onClick={() => { setActiveTab("movies"); setSearchTerm(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "movies" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-950"
            }`}
          >
            <FilmStrip size={14} weight={activeTab === "movies" ? "fill" : "bold"} />
            <span>Filmler ({filteredMovies.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab("series"); setSearchTerm(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "series" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-950"
            }`}
          >
            <Television size={14} weight={activeTab === "series" ? "fill" : "bold"} />
            <span>Diziler ({filteredSeries.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab("matches"); setSearchTerm(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "matches" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-950"
              }`}
          >
            <Trophy size={14} weight={activeTab === "matches" ? "fill" : "bold"} />
            <span>Maçlar ({matches.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab("contributions"); setSearchTerm(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activeTab === "contributions" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-950"
              }`}
          >
            <HandHeart size={14} weight={activeTab === "contributions" ? "fill" : "bold"} />
            <span>Katkılar ({contribs?.length || 0})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Katalogda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-stone-200 focus:outline-none focus:border-stone-500 text-xs bg-white text-stone-900 placeholder-stone-400"
          />
        </div>
      </div>

      {/* Main Grid/List Container */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
          <ArrowsClockwise size={32} className="animate-spin text-stone-500" />
          <span className="text-xs font-bold uppercase tracking-widest">Katalog Yükleniyor...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
          {/* MOVIES TAB */}
          {activeTab === "movies" && (
            <div className="flex flex-col">
              {/* Sub-tabs segment buttons */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                <button
                  onClick={() => setMovieSubTab("popular")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    movieSubTab === "popular"
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-950 hover:bg-stone-100"
                  }`}
                >
                  Popüler Öneriler
                </button>
                <button
                  onClick={() => setMovieSubTab("top_rated")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    movieSubTab === "top_rated"
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-950 hover:bg-stone-100"
                  }`}
                >
                  Yüksek Puanlılar
                </button>
                <button
                  onClick={() => setMovieSubTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    movieSubTab === "all"
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-500 hover:text-stone-950 hover:bg-stone-100"
                  }`}
                >
                  Tümü ({rawMovies.length})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase tracking-wider text-stone-400">
                      <th className="p-4">Film</th>
                      <th className="p-4">Popülerlik</th>
                      <th className="p-4">Ort. Puan</th>
                      <th className="p-4">IMDB ID</th>
                      <th className="p-4">TMDB ID</th>
                      <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {filteredMovies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-stone-400 text-xs font-bold">Katalogda film bulunamadı.</td>
                      </tr>
                    ) : (
                      filteredMovies.map((movie: any) => (
                        <tr key={movie.id} className="hover:bg-stone-50/50 text-xs">
                          <td className="p-4 flex items-center gap-3">
                            {movie.poster_url ? (
                              <img src={movie.poster_url} className="w-9 h-12 rounded-lg object-cover border border-stone-200/60 shadow-sm shrink-0" />
                            ) : (
                              <div className="w-9 h-12 rounded-lg bg-stone-100 border border-stone-200/60 flex items-center justify-center text-[10px] text-stone-400 shrink-0">Yok</div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-stone-900 truncate">{movie.title}</p>
                                {movie.is_popular === "true" && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider border border-emerald-100 shrink-0">Popüler</span>
                                )}
                                {movie.is_top_rated === "true" && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider border border-blue-100 shrink-0">Puanlı</span>
                                )}
                                {movie.is_popular === "deleted_by_admin" && (
                                  <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-700 text-[8px] font-black uppercase tracking-wider border border-red-100 shrink-0">Karaliste</span>
                                )}
                                {movie.is_popular === "false" && movie.is_top_rated !== "true" && (
                                  <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[8px] font-black uppercase tracking-wider border border-stone-200 shrink-0">Normal</span>
                                )}
                              </div>
                              <p className="text-[10px] text-stone-400 font-bold mt-0.5">{movie.year} · {movie.original_title || movie.title}</p>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-stone-500">{Number(movie.popularity || 0).toFixed(1)}</td>
                          <td className="p-4 font-bold text-stone-800">
                             {movie.imdb_rating ? (
                               <div className="text-amber-600">★ {Number(movie.imdb_rating).toFixed(1)} IMDb</div>
                             ) : (
                               <div className="text-stone-400">-</div>
                             )}
                           </td>
                          <td className="p-4 text-stone-700 font-mono font-bold">{movie.imdb_id || "-"}</td>
                          <td className="p-4 text-stone-400 font-mono">{movie.id}</td>
                          <td className="p-4 text-right">
                            {(movie.is_popular === "true" || movie.is_top_rated === "true") && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`"${movie.title}" filmini katalogdan silmek istediğine emin misin?`)) {
                                    deleteMovieMutation.mutate(movie.id);
                                  }
                                }}
                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-red-100"
                                title="Katalogdan Sil"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SERIES TAB */}
          {activeTab === "series" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase tracking-wider text-stone-400">
                    <th className="p-4">Dizi</th>
                    <th className="p-4">Popülerlik</th>
                    <th className="p-4">Ort. Puan</th>
                    <th className="p-4">İlk Yayın</th>
                    <th className="p-4 text-right">TMDB ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredSeries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-stone-400 text-xs font-bold">Katalogda dizi bulunamadı.</td>
                    </tr>
                  ) : (
                    filteredSeries.map((s: any) => (
                      <tr key={s.id} className="hover:bg-stone-50/50 text-xs">
                        <td className="p-4 flex items-center gap-3">
                          {s.poster_path ? (
                            <img src={s.poster_path} className="w-9 h-12 rounded-lg object-cover border border-stone-200/60 shadow-sm shrink-0" />
                          ) : (
                            <div className="w-9 h-12 rounded-lg bg-stone-100 border border-stone-200/60 flex items-center justify-center text-[10px] text-stone-400 shrink-0">Yok</div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate">{s.name}</p>
                            <p className="text-[10px] text-stone-400 font-bold mt-0.5">{s.original_name || s.name}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-stone-500">{Number(s.popularity || 0).toFixed(1)}</td>
                        <td className="p-4 font-bold text-stone-800">⭐ {Number(s.vote_average || 0).toFixed(1)}</td>
                        <td className="p-4 text-stone-500 font-mono">{s.first_air_date || "-"}</td>
                        <td className="p-4 text-right text-stone-400 font-mono">{s.id}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MATCHES TAB */}
          {activeTab === "matches" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase tracking-wider text-stone-400">
                    <th className="p-4">Karşılaşma</th>
                    <th className="p-4">Lig / Turnuva</th>
                    <th className="p-4">Spor</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 text-right">Başlangıç</th>
                    <th className="p-4 w-10 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredMatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-stone-400 text-xs font-bold">Katalogda maç bulunamadı.</td>
                    </tr>
                  ) : (
                    filteredMatches.map((match) => (
                      <tr key={match.id} className="hover:bg-stone-50/50 text-xs">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 shrink-0">
                              {match.home_logo && <img src={match.home_logo} className="w-5 h-5 object-contain" />}
                              <span className="font-bold text-stone-900">{match.home}</span>
                            </div>
                            <span className="text-stone-400 font-mono font-bold">
                              {match.home_score !== null && match.away_score !== null
                                ? `${match.home_score} - ${match.away_score}`
                                : "vs"
                              }
                            </span>
                            <div className="flex items-center gap-1.5">
                              {match.away_logo && <img src={match.away_logo} className="w-5 h-5 object-contain" />}
                              <span className="font-bold text-stone-900">{match.away}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-600 uppercase tracking-wide">
                            {match.competition_tr}
                          </span>
                        </td>
                        <td className="p-4 text-stone-500 font-bold capitalize">{match.sport}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${match.state === "live"
                              ? "bg-red-500 text-white animate-pulse"
                              : match.state === "upcoming"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : "bg-stone-100 text-stone-400"
                            }`}>
                            {match.state === "live" ? `CANLI ${match.clock ? `· ${match.clock}` : ""}` : match.status_text}
                          </span>
                        </td>
                        <td className="p-4 text-right text-stone-400 font-mono">
                          {new Date(match.start_at).toLocaleString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm("Bu maçı silmek istediğinize emin misiniz?")) {
                                deleteMatchMutation.mutate(match.id);
                              }
                            }}
                            disabled={deleteMatchMutation.isPending}
                            className="p-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                            title="Maçı Katalogdan Sil"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CONTRIBUTIONS TAB */}
          {activeTab === "contributions" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase tracking-wider text-stone-400">
                    <th className="p-4">Tarif Adı</th>
                    <th className="p-4">Katkıda Bulunan</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4">Tarih</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {isContribsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-stone-400 text-xs font-bold animate-pulse">Yükleniyor...</td>
                    </tr>
                  ) : !contribs || contribs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-stone-400 text-xs font-bold">Herhangi bir topluluk katkısı bulunamadı.</td>
                    </tr>
                  ) : (
                    contribs
                      .filter((c: any) => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.contributorName.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((c: any) => (
                        <tr key={c.id} className="hover:bg-stone-50/50 text-xs">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {c.imageUrl ? (
                                <img src={c.imageUrl} className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 font-bold border border-orange-100 flex items-center justify-center text-xs shrink-0 select-none">
                                  🍳
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-stone-900 block">{c.title}</span>
                                <span className="text-[10px] text-stone-400 font-medium">Tarif Detayları: {(c.data?.ingredients?.length || 0)} Malzeme, {(c.data?.instructions?.length || 0)} Adım</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-stone-800">
                              {c.contributorName || "Topluluk Üyesi"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-stone-50 border border-stone-200 text-[10px] font-bold text-stone-500">
                              {c.data?.category || "Diğer"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              c.approved
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse"
                            }`}>
                              {c.approved ? "Onaylandı" : "Onay Bekliyor"}
                            </span>
                          </td>
                          <td className="p-4 text-stone-500 font-mono">
                            {new Date(c.createdAt).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="p-4 text-right space-x-1.5 shrink-0">
                            {!c.approved ? (
                              <>
                                <button
                                  onClick={() => approveContribMutation.mutate({ id: c.id, approved: true })}
                                  disabled={approveContribMutation.isPending}
                                  className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white w-7 h-7 rounded-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                                  title="Katkıyı Onayla"
                                >
                                  <Check size={14} weight="bold" />
                                </button>
                                <button
                                  onClick={() => approveContribMutation.mutate({ id: c.id, approved: false })}
                                  disabled={approveContribMutation.isPending}
                                  className="inline-flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 w-7 h-7 rounded-lg active:scale-95 transition-all cursor-pointer border border-red-100 disabled:opacity-50"
                                  title="Reddet ve Sil"
                                >
                                  <X size={14} weight="bold" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => approveContribMutation.mutate({ id: c.id, approved: false })}
                                disabled={approveContribMutation.isPending}
                                className="inline-flex items-center justify-center bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 w-7 h-7 rounded-lg active:scale-95 transition-all cursor-pointer border border-stone-200 hover:border-red-200 disabled:opacity-50"
                                title="Kataloğu Kaldır"
                              >
                                <Trash size={14} weight="bold" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TMDB Arama ve Ekleme Modalı */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-stone-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-black text-stone-900 tracking-tight text-sm">Yeni Önerilen Film Ekle</h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setMovieQuery(""); setSearchResults([]); }}
                className="text-stone-400 hover:text-stone-700 font-bold text-xs"
              >
                Kapat
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="TMDB'de film ara..."
                  value={movieQuery}
                  onChange={(e) => setMovieQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchTmdb()}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-500 text-xs bg-white text-stone-900 placeholder-stone-400"
                />
                <button
                  onClick={handleSearchTmdb}
                  disabled={isSearching}
                  className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {isSearching ? "Arıyor..." : "Ara"}
                </button>
              </div>

              {/* Search Results */}
              <div className="space-y-3 pt-2">
                {searchResults.length === 0 ? (
                  <p className="text-stone-400 text-center py-8 text-xs font-bold">Arama sonucu yok.</p>
                ) : (
                  searchResults.map((movie) => (
                    <div key={movie.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:bg-stone-50/50 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {movie.posterUrl ? (
                          <img src={movie.posterUrl} className="w-8 h-11 rounded object-cover border shrink-0" />
                        ) : (
                          <div className="w-8 h-11 rounded bg-stone-100 flex items-center justify-center text-[8px] text-stone-400 shrink-0">Yok</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-stone-900 truncate">{movie.title}</p>
                          <p className="text-[9px] text-stone-400 font-bold mt-0.5">{movie.year}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => promoteMovieMutation.mutate(movie.id)}
                        disabled={promoteMovieMutation.isPending}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer border border-emerald-100 shrink-0"
                      >
                        Önerilenlere Ekle
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
