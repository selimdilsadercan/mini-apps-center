"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  MagnifyingGlass, 
  Trash, 
  PencilSimple, 
  Video, 
  SquaresFour, 
  Users, 
  Star, 
  X, 
  PlusCircle, 
  YoutubeLogo, 
  FloppyDisk, 
  CaretRight, 
  Clock, 
  CircleNotch, 
  Play 
} from "@phosphor-icons/react";
import { CATEGORY_LABELS, type Series, type Category, type Episode } from "../lib/types";
import { fetchSeries, createSeries, deleteSeries as apiDeleteSeries, fetchVideos, createVideo, deleteVideo, linkVideoToSeries } from "../lib/api";

export default function AdminPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [unlinkedVideos, setUnlinkedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Seri modalı
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false); // Video modalı
  const [isEditing, setIsEditing] = useState(false);

  // Video Form State
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Series>>({
    title: "",
    creator: "",
    youtubeId: "",
    description: "",
    category: "eglence",
    status: "devam-ediyor",
    emoji: "📺",
    year: new Date().getFullYear(),
    tags: [],
    episodes: []
  });

  // Verileri Çek
  const loadSeries = async () => {
    try {
      setLoading(true);
      const [sData, vData] = await Promise.all([fetchSeries(), fetchVideos()]);
      setSeriesList(sData);
      setUnlinkedVideos(vData.filter((v: any) => !v.series_id));
    } catch (err) {
      console.error("Yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const filteredSeries = seriesList.filter(
    (s: Series) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm("Bu seriyi silmek istediğinize emin misiniz?")) {
      try {
        await apiDeleteSeries(id);
        setSeriesList(seriesList.filter((s) => s.id !== id));
      } catch (err) {
        alert("Silme işlemi başarısız oldu.");
      }
    }
  };

  const handleEdit = (series: Series) => {
    setFormData(series);
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await createSeries(formData);
      } else {
        await createSeries(formData);
      }

      await loadSeries();
      setIsAddModalOpen(false);
      setIsEditing(false);

      setFormData({
        title: "",
        creator: "",
        youtubeId: "",
        description: "",
        category: "eglence",
        status: "devam-ediyor",
        emoji: "📺",
        year: new Date().getFullYear(),
        tags: [],
        episodes: []
      });
      alert(isEditing ? "Seri güncellendi!" : "Seri başarıyla eklendi!");
    } catch (err) {
      alert("İşlem sırasında bir hata oluştu.");
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    setAddingVideo(true);
    try {
      const video = await createVideo({ url: videoUrl });
      alert(`Video eklendi: ${video.title}\n\nŞimdi bu videoyu bir seriye bağlayabilirsiniz.`);
      setVideoUrl("");
      setIsVideoModalOpen(false);
      await loadSeries();
    } catch (err) {
      alert("Hata: " + err);
    } finally {
      setAddingVideo(false);
    }
  };

  const handleLinkVideo = async (videoId: number, seriesId: string) => {
    try {
      await linkVideoToSeries(videoId, seriesId, 1);
      await loadSeries();
      alert("Video seriye başarıyla bağlandı!");
    } catch (err) {
      alert("Hata: " + err);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!confirm("Bu videoyu silmek istiyor musunuz?")) return;
    try {
      await deleteVideo(id);
      await loadSeries();
    } catch (err) {
      alert("Hata: " + err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Yönetim Paneli</h1>
          <p className="mt-3 text-lg text-zinc-400">Video ekle ve serilerle bağla.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex h-fit items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
          >
            Seri Oluştur
          </button>
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="flex h-fit items-center gap-3 rounded-2xl bg-red-500 px-10 py-5 text-base font-bold text-white shadow-xl shadow-red-500/25 transition-all hover:bg-red-600 hover:scale-105 active:scale-95"
          >
            <YoutubeLogo className="h-6 w-6" />
            Video Ekle (URL)
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Toplam Seri", value: seriesList.length, icon: Video, color: "text-blue-500", bg: "bg-blue-500/10" },
          {
            label: "Toplam Bölüm",
            value: seriesList.reduce((acc: number, s: Series) => acc + s.episodeCount, 0),
            icon: SquaresFour,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
          },
          {
            label: "Aktif Yapımcılar",
            value: new Set(seriesList.map((s: Series) => s.creator)).size,
            icon: Users,
            color: "text-green-500",
            bg: "bg-green-500/10"
          },
          {
            label: "Ort. Puan",
            value: seriesList.length > 0 ? (seriesList.reduce((acc: number, s: Series) => acc + s.avgRating, 0) / seriesList.length).toFixed(1) : "0.0",
            icon: Star,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10"
          }
        ].map((stat, i) => (
          <div
            key={i}
            className="group rounded-2xl border border-white/5 bg-white/[0.04] p-5 backdrop-blur-md transition-all hover:bg-white/[0.07] hover:border-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-black text-white lg:text-3xl">{stat.value}</p>
              </div>
              <div
                className={`${stat.bg} ${stat.color} flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 lg:h-12 lg:w-12 lg:rounded-2xl`}
              >
                <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & List */}
      <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="border-b border-white/5 bg-white/[0.02] p-10">
          <div className="relative max-w-xl">
            <MagnifyingGlass className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Seri veya üretici ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[1.5rem] border border-white/10 bg-black/40 py-5 pl-14 pr-8 text-base text-white placeholder-zinc-500 outline-none transition-all focus:border-red-500/50 focus:ring-8 focus:ring-red-500/5"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                <th className="px-10 py-6">Seri</th>
                <th className="px-10 py-6 text-center">Kategori</th>
                <th className="px-10 py-6 text-center">Durum</th>
                <th className="px-10 py-6 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSeries.map((series: Series) => (
                <React.Fragment key={series.id}>
                  <tr className="group hover:bg-white/[0.04] transition-colors">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-6">
                        <div
                          className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${series.gradient} text-3xl shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-2`}
                        >
                          {series.emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-white text-lg tracking-tight">{series.title}</p>
                          <p className="truncate text-sm font-bold text-zinc-500">{series.creator}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className="inline-flex items-center rounded-xl bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-300">
                        {CATEGORY_LABELS[series.category]}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span
                        className={`inline-flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider ${
                          series.status === "devam-ediyor" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${series.status === "devam-ediyor" ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]" : "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]"}`}
                        />
                        {series.status === "devam-ediyor" ? "Yayında" : "Bitti"}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setSelectedSeriesId(selectedSeriesId === series.id ? null : series.id)}
                          className={`rounded-2xl p-4 transition-all shadow-lg ${selectedSeriesId === series.id ? "bg-red-500 text-white shadow-red-500/20" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}
                          title="Bölümleri Gör"
                        >
                          <Video className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(series)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <PencilSimple className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(series.id)}
                          className="rounded-2xl bg-white/5 p-4 text-zinc-400 transition-all hover:bg-white/10 hover:text-red-500 shadow-lg"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selectedSeriesId === series.id && (
                    <tr className="bg-white/[0.01]">
                      <td colSpan={4} className="px-10 py-12 border-t border-white/5">
                        <div className="rounded-[2rem] border border-white/10 bg-black/40 p-10 shadow-2xl">
                          <h4 className="mb-8 text-xl font-black text-white flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                              <YoutubeLogo className="h-7 w-7 text-red-500" />
                            </div>
                            Bölüm Listesi ({(series.episodes || []).length})
                          </h4>
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {series.episodes && series.episodes.length > 0 ? (
                              series.episodes.map((ep: Episode) => (
                                <div
                                  key={ep.id}
                                  className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:border-white/20 hover:bg-white/10"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="rounded-lg bg-red-500/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-red-400 uppercase">
                                      BÖLÜM {ep.episodeNumber}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500">
                                      <Clock className="h-3.5 w-3.5" />
                                      {ep.duration}
                                    </div>
                                  </div>
                                  <h5 className="font-bold text-base text-white line-clamp-2 leading-snug">{ep.title}</h5>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full py-16 text-center">
                                <p className="text-zinc-500 font-bold italic opacity-50">Henüz bölüm eklenmemiş.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unlinked Videos Section */}
      {unlinkedVideos.length > 0 && (
        <div className="mt-20 space-y-10">
          <div className="flex items-center gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-yellow-500/10 text-yellow-500 shadow-lg shadow-yellow-500/5">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Bağlanmamış Videolar</h2>
              <p className="mt-1 text-zinc-500 font-medium">Kütüphaneye eklenen ancak bir seriye atanmayı bekleyen videolar.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {unlinkedVideos.map((video) => (
              <div
                key={video.id}
                className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.05] hover:shadow-2xl"
              >
                <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => setPlayingVideo(video)}>
                  <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                  {/* Play Butonu */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/90 text-white shadow-2xl shadow-red-500/40 transition-all group-hover:scale-110 group-hover:bg-red-500">
                      <Play className="h-7 w-7 fill-white ml-1" />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(video.id);
                    }}
                    className="absolute right-4 top-4 rounded-2xl bg-black/60 p-3 text-zinc-400 opacity-0 transition-all hover:text-red-500 backdrop-blur-md group-hover:opacity-100"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <h3 className="line-clamp-2 min-h-[3rem] text-lg font-black text-white leading-tight tracking-tight">{video.title}</h3>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Seriye Atama</label>
                      <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Beklemede</span>
                    </div>

                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <select
                          onChange={(e) => handleLinkVideo(video.id, e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-white/10 bg-black/40 py-4 pl-5 pr-10 text-xs font-bold text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Seri seçin...
                          </option>
                          {seriesList.map((s) => (
                            <option key={s.id} value={s.id} className="bg-zinc-900">
                              {s.title}
                            </option>
                          ))}
                        </select>
                        <CaretRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 p-10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h3 className="text-lg font-bold text-white">{isEditing ? "Seriyi Düzenle" : "Yeni Seri Ekle"}</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditing(false);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Seri Adı</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5"
                    placeholder="Ör: Buneamk"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">İçerik Üretici</label>
                  <input
                    required
                    type="text"
                    value={formData.creator}
                    onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5"
                    placeholder="Ör: Berkcan Güven"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">YouTube Video ID</label>
                  <div className="relative">
                    <YoutubeLogo className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                    <input
                      type="text"
                      value={formData.youtubeId}
                      onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5"
                      placeholder="vB-Wk5V80Xw"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Emoji</label>
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 text-center text-xl"
                    placeholder="🎤"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Açıklama</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 resize-none"
                  placeholder="Seri hakkında kısa bilgi..."
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 appearance-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-zinc-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Yayın Yılı</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditing(false);
                  }}
                  className="rounded-xl bg-white/5 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-red-600 active:scale-95"
                >
                  <FloppyDisk className="h-4 w-4" />
                  {isEditing ? "Değişiklikleri Kaydet" : "Seriyi Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/80" onClick={() => setIsVideoModalOpen(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 p-10 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white px-2">Video Ekle</h2>
              <button onClick={() => setIsVideoModalOpen(false)} className="rounded-xl bg-white/5 p-2 text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">YouTube Video URL</label>
                <div className="relative">
                  <YoutubeLogo className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                  <input
                    required
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white outline-none focus:border-red-500/50"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <p className="text-[10px] text-zinc-500 italic px-1">URL'yi yapıştırın, video bilgileri otomatik olarak veritabanına kaydedilecektir.</p>
              </div>

              <button
                type="submit"
                disabled={addingVideo}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-500 py-5 text-base font-black text-white shadow-xl shadow-red-500/20 hover:bg-red-600 disabled:opacity-50"
              >
                {addingVideo ? <CircleNotch className="h-5 w-5 animate-spin" /> : <FloppyDisk className="h-5 w-5" />}
                VİDEOYU KAYDET
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-2xl" onClick={() => setPlayingVideo(null)}>
          <div className="absolute inset-0 bg-black/90" />
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute -top-12 right-0 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/20"
            >
              <X className="h-4 w-4" />
              Kapat
            </button>
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${playingVideo.youtube_id}?autoplay=1&rel=0`}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="mt-6 px-2">
              <h3 className="text-xl font-black text-white tracking-tight">{playingVideo.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{playingVideo.duration && `Süre: ${playingVideo.duration}`}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
