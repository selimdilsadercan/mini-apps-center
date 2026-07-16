"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import {
  Plus,
  Trash,
  YoutubeLogo,
  CircleNotch,
  CaretDown,
  CaretUp,
  PencilSimple,
  ArrowUpRight,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import YTDBShell from "../components/YTDBShell";
import PromoteVideoSheet from "../components/PromoteVideoSheet";
import SeriesPlaylistImport from "../components/SeriesPlaylistImport";
import PlaylistImportProgress from "../components/PlaylistImportProgress";
import { sortEpisodesByDate } from "../lib/format";
import {
  createAndImportPlaylist,
  importPlaylistToSeries,
  type PlaylistImportJob,
} from "../lib/playlistImport";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  CATEGORY_LABELS,
  CONTEXT_LABELS,
  type Category,
  type Context,
  type Series,
  type SeriesStatus,
  type AttentionLevel,
} from "../lib/types";
import {
  fetchSeries,
  fetchRawSources,
  fetchSeriesById,
  resolveYouTubeUrl,
  promoteSource,
  upsertSeries,
  deleteSeries,
  deleteEpisode,
  type YouTubeSourcePreview,
} from "../lib/api";

const ACCENT = "#EF4444";

const SOURCE_LABELS = {
  video: "Video",
  playlist: "Oynatma listesi",
  channel: "Kanal",
} as const;

function episodeThumbnailUrl(ep: { youtubeId: string; thumbnail?: string }) {
  return ep.thumbnail || `https://img.youtube.com/vi/${ep.youtubeId}/hqdefault.jpg`;
}

function formatEpisodeDate(publishedAt?: string) {
  if (!publishedAt) return null;
  return new Date(publishedAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EpisodeThumbnail({ ep }: { ep: { youtubeId: string; thumbnail?: string } }) {
  return (
    <div className="w-[120px] aspect-video rounded-xl overflow-hidden shrink-0 border border-app-border bg-app-surface-muted">
      <img
        src={episodeThumbnailUrl(ep)}
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function SeriesCover({ youtubeId }: { youtubeId?: string }) {
  return (
    <div className="w-[96px] aspect-video rounded-xl overflow-hidden shrink-0 border border-app-border bg-app-surface-muted">
      {youtubeId ? (
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-app-muted">
          <YoutubeLogo size={22} weight="fill" style={{ color: ACCENT }} />
        </div>
      )}
    </div>
  );
}

function EpisodeInfo({
  episodeNumber,
  publishedAt,
  title,
}: {
  episodeNumber: number;
  publishedAt?: string;
  title: string;
}) {
  const dateLabel = formatEpisodeDate(publishedAt);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[10px] font-black text-red-500">#{episodeNumber}</span>
        {dateLabel && <span className="text-[8px] font-medium text-app-muted">{dateLabel}</span>}
      </div>
      <p className="text-[12px] font-bold text-app-text line-clamp-2 leading-snug">{title}</p>
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  creator: "",
  description: "",
  youtubeId: "",
  category: "talk-show" as Category,
  status: "devam-ediyor" as SeriesStatus,
  year: new Date().getFullYear(),
  contexts: ["yemek"] as Context[],
  attentionLevel: "light" as AttentionLevel,
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [rawSources, setRawSources] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Series | null>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  const [quickUrl, setQuickUrl] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickPreview, setQuickPreview] = useState<YouTubeSourcePreview | null>(null);

  const [addEpisodeUrl, setAddEpisodeUrl] = useState("");
  const [addEpisodeLoading, setAddEpisodeLoading] = useState(false);
  const [importJob, setImportJob] = useState<PlaylistImportJob | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [promoteTarget, setPromoteTarget] = useState<Series | null>(null);
  const [promoteLoading, setPromoteLoading] = useState(false);

  const userId = user?.id || "";

  useEffect(() => {
    if (!isLoaded || adminLoading) return;
    if (!isAdmin) {
      router.replace("/apps/youtube-discover/kesfet");
    }
  }, [isLoaded, adminLoading, isAdmin, router]);

  async function loadAll() {
    if (!userId) return;
    setLoading(true);
    try {
      const [series, raw] = await Promise.all([fetchSeries(), fetchRawSources(userId)]);
      setSeriesList(series);
      setRawSources(raw);
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin && userId) loadAll();
  }, [isAdmin, userId]);

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedSeries(null);
      return;
    }

    setExpandedId(id);
    setExpandedLoading(true);
    try {
      const data = await fetchSeriesById(id);
      setExpandedSeries(data);
    } catch {
      toast.error("Bölümler yüklenemedi");
    } finally {
      setExpandedLoading(false);
    }
  }

  async function handleQuickPreview() {
    if (!quickUrl.trim() || !userId) return;
    setQuickLoading(true);
    try {
      const preview = await resolveYouTubeUrl(userId, quickUrl.trim());
      setQuickPreview(preview);
    } catch (err: any) {
      toast.error(err?.message || "URL çözümlenemedi");
      setQuickPreview(null);
    } finally {
      setQuickLoading(false);
    }
  }

  async function refreshListsQuietly() {
    if (!userId) return;
    const [series, raw] = await Promise.all([fetchSeries(), fetchRawSources(userId)]);
    setSeriesList(series);
    setRawSources(raw);
  }

  async function refreshExpandedSeries(id: string) {
    const data = await fetchSeriesById(id);
    if (data) setExpandedSeries(data);
    await refreshListsQuietly();
  }

  function patchImportJob(patch: Partial<PlaylistImportJob>) {
    setImportJob((prev) => ({
      seriesId: prev?.seriesId || "",
      seriesTitle: prev?.seriesTitle || "",
      total: prev?.total || 0,
      done: prev?.done || 0,
      skipped: prev?.skipped || 0,
      phase: prev?.phase || "resolving",
      ...prev,
      ...patch,
    }));
  }

  async function handleQuickCreate() {
    if (!userId || !quickUrl.trim()) return;
    setQuickLoading(true);
    patchImportJob({
      seriesId: "",
      seriesTitle: "",
      total: 0,
      done: 0,
      skipped: 0,
      phase: "resolving",
      error: undefined,
    });

    try {
      const result = await createAndImportPlaylist({
        userId,
        url: quickUrl.trim(),
        onUpdate: patchImportJob,
        onSeriesCreated: async (seriesId) => {
          await loadAll();
          setExpandedId(seriesId);
          const data = await fetchSeriesById(seriesId);
          setExpandedSeries(data);
        },
        onEpisodeAdded: (id) => refreshExpandedSeries(id),
        category: "talk-show",
        contexts: ["yemek"],
      });

      if (result.series.id) {
        setExpandedId(result.series.id);
        await refreshExpandedSeries(result.series.id);
      }

      toast.success(
        result.imported > 1
          ? result.skipped > 0
            ? `${result.imported} video kaydedildi, ${result.skipped} atlandı`
            : `${result.imported} video ham kaynak olarak kaydedildi`
          : "Ham kaynak kaydedildi"
      );
      setQuickUrl("");
      setQuickPreview(null);
      patchImportJob({ phase: "done" });
      setTimeout(() => setImportJob(null), 2500);
    } catch (err: any) {
      patchImportJob({ phase: "error", error: err?.message || "İçe aktarılamadı" });
      toast.error(err?.message || "İçe aktarılamadı");
    } finally {
      setQuickLoading(false);
    }
  }

  function isSingleVideoSource(source: Series) {
    return source.sourceType === "video" || (source.episodeCount === 1 && source.sourceType !== "playlist" && source.sourceType !== "channel");
  }

  function handlePromoteClick(source: Series) {
    if (isSingleVideoSource(source)) {
      setPromoteTarget(source);
      return;
    }
    void handlePromote(source.id);
  }

  async function handlePromote(id: string, title?: string) {
    if (!userId) return;
    setPromoteLoading(true);
    try {
      await promoteSource(userId, id, {
        category: "talk-show",
        contexts: ["yemek"],
        title,
      });
      toast.success("Keşfet'e seri olarak eklendi");
      setPromoteTarget(null);
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedSeries(null);
      }
      await loadAll();
    } catch (err: any) {
      toast.error(err?.message || "Seriye dönüştürülemedi");
    } finally {
      setPromoteLoading(false);
    }
  }

  async function handleAddEpisode(seriesId: string, seriesTitle: string) {
    if (!userId || !addEpisodeUrl.trim()) return;
    setAddEpisodeLoading(true);

    const startEpisodeNumber = (expandedSeries?.episodes?.length || 0) + 1;
    patchImportJob({
      seriesId,
      seriesTitle,
      total: 0,
      done: 0,
      skipped: 0,
      phase: "resolving",
      error: undefined,
    });

    try {
      const result = await importPlaylistToSeries({
        userId,
        seriesId,
        url: addEpisodeUrl.trim(),
        seriesTitle,
        startEpisodeNumber,
        onUpdate: patchImportJob,
        onEpisodeAdded: (id) => refreshExpandedSeries(id),
      });

      toast.success(
        result.imported > 1
          ? result.skipped > 0
            ? `${result.imported} bölüm eklendi, ${result.skipped} zaten vardı`
            : `${result.imported} bölüm eklendi`
          : result.skipped > 0
            ? "Video zaten seride vardı"
            : "Bölüm eklendi"
      );
      setAddEpisodeUrl("");
      await refreshExpandedSeries(seriesId);
      patchImportJob({ phase: "done" });
      setTimeout(() => setImportJob(null), 2500);
    } catch (err: any) {
      patchImportJob({ phase: "error", error: err?.message || "Bölüm eklenemedi" });
      toast.error(err?.message || "Bölüm eklenemedi");
    } finally {
      setAddEpisodeLoading(false);
    }
  }

  async function handleDeleteSeries(id: string) {
    if (!userId || !confirm("Silmek istediğine emin misin?")) return;
    try {
      await deleteSeries(userId, id);
      toast.success("Silindi");
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedSeries(null);
      }
      await loadAll();
    } catch {
      toast.error("Seri silinemedi");
    }
  }

  async function handleDeleteEpisode(episodeId: string, seriesId: string) {
    if (!userId || !confirm("Bu bölümü silmek istediğine emin misin?")) return;
    try {
      await deleteEpisode(userId, episodeId);
      toast.success("Bölüm silindi");
      const data = await fetchSeriesById(seriesId);
      setExpandedSeries(data);
      await loadAll();
    } catch {
      toast.error("Bölüm silinemedi");
    }
  }

  function openEdit(series: Series) {
    setEditingId(series.id);
    setForm({
      title: series.title,
      creator: series.creator,
      description: series.description,
      youtubeId: series.youtubeId,
      category: series.category,
      status: series.status,
      year: series.year,
      contexts: series.contexts || ["yemek"],
      attentionLevel: series.attentionLevel || "light",
    });
    setShowForm(true);
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      await upsertSeries(userId, {
        id: editingId || undefined,
        ...form,
      });
      toast.success(editingId ? "Seri güncellendi" : "Seri eklendi");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadAll();
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  function toggleContext(ctx: Context) {
    setForm((prev) => ({
      ...prev,
      contexts: prev.contexts.includes(ctx)
        ? prev.contexts.filter((c) => c !== ctx)
        : [...prev.contexts, ctx],
    }));
  }

  if (!isLoaded || adminLoading || !isAdmin) {
    return (
      <YTDBShell detailTitle="Yönetim">
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </YTDBShell>
    );
  }

  return (
    <YTDBShell detailTitle="Yönetim">
      <div className="space-y-5">
        {importJob && importJob.phase !== "done" && (
          <PlaylistImportProgress job={importJob} />
        )}

        {/* Quick add from URL */}
        <section className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <YoutubeLogo size={18} weight="fill" style={{ color: ACCENT }} />
            <h2 className="text-[13px] font-black text-app-text">Video, kanal veya oynatma listesi</h2>
          </div>
          <p className="text-[11px] font-medium text-app-muted">
            URL ile eklenen her şey önce ham kaynak olarak saklanır. Keşfet&apos;e &quot;Seri&quot; ile alırsın.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={quickUrl}
              onChange={(e) => {
                setQuickUrl(e.target.value);
                setQuickPreview(null);
              }}
              placeholder="Video, playlist veya @kanal URL..."
              className="flex-1 h-10 px-3 bg-app-surface border border-app-border rounded-xl text-sm font-medium text-app-text placeholder:text-app-muted outline-none focus:border-red-500/30"
            />
            <button
              type="button"
              onClick={handleQuickPreview}
              disabled={quickLoading || !quickUrl.trim()}
              className="h-10 px-3 rounded-xl border border-app-border bg-app-surface-muted text-[10px] font-black uppercase tracking-wide text-app-text disabled:opacity-50 active:scale-95"
            >
              {quickLoading ? <CircleNotch size={16} className="animate-spin" /> : "Önizle"}
            </button>
          </div>

          {quickPreview && (
            <div className="rounded-xl border border-app-border bg-app-surface-muted p-3 space-y-2">
              <div className="flex gap-3">
                <img
                  src={quickPreview.thumbnailUrl}
                  alt=""
                  className="w-20 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-white mb-1" style={{ backgroundColor: ACCENT }}>
                    {SOURCE_LABELS[quickPreview.type]}
                  </span>
                  <p className="text-[12px] font-black text-app-text line-clamp-2">
                    {quickPreview.title}
                  </p>
                  <p className="text-[10px] font-bold text-app-muted mt-0.5">
                    {quickPreview.author} · {quickPreview.videoCount} video
                  </p>
                </div>
              </div>
              {quickPreview.videos.length > 1 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {quickPreview.videos.slice(0, 5).map((v) => (
                    <div key={v.youtubeId} className="flex items-center gap-2">
                      <img
                        src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                        alt=""
                        className="w-12 h-9 rounded-md object-cover shrink-0 border border-app-border"
                      />
                      <p className="text-[10px] font-medium text-app-muted truncate">{v.title}</p>
                    </div>
                  ))}
                  {quickPreview.videos.length > 5 && (
                    <p className="text-[10px] font-bold text-app-muted">
                      +{quickPreview.videos.length - 5} video daha
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleQuickCreate}
            disabled={quickLoading || !quickUrl.trim()}
            className="w-full h-10 rounded-xl text-white text-[11px] font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98]"
            style={{ backgroundColor: ACCENT }}
          >
            {quickLoading
              ? "İçe aktarılıyor..."
              : quickPreview
                ? quickPreview.videoCount > 1
                  ? `${quickPreview.videoCount} Videoyu Ham Kaydet`
                  : "Ham Kaydet"
                : "Ham Kaydet"}
          </button>
        </section>

        {/* Manual series form toggle */}
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setShowForm((v) => !v);
          }}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-app-border bg-app-surface text-[11px] font-black uppercase tracking-wider text-app-text active:scale-[0.98]"
        >
          <Plus size={14} weight="bold" />
          {showForm ? "Formu Gizle" : "Manuel Seri Ekle / Düzenle"}
        </button>

        {showForm && (
          <form
            onSubmit={handleSaveForm}
            className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-4 space-y-3"
          >
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Seri adı"
              className="w-full h-10 px-3 border border-app-border rounded-xl text-sm font-bold"
            />
            <input
              required
              value={form.creator}
              onChange={(e) => setForm({ ...form, creator: e.target.value })}
              placeholder="Kanal / üretici"
              className="w-full h-10 px-3 border border-app-border rounded-xl text-sm font-bold"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Açıklama"
              rows={2}
              className="w-full px-3 py-2 border border-app-border rounded-xl text-sm font-medium resize-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="h-10 px-3 border border-app-border rounded-xl text-[11px] font-black uppercase"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as SeriesStatus })}
                className="h-10 px-3 border border-app-border rounded-xl text-[11px] font-black uppercase"
              >
                <option value="devam-ediyor">Yayında</option>
                <option value="tamamlandi">Tamamlandı</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CONTEXT_LABELS) as Context[]).map((ctx) => (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => toggleContext(ctx)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${
                    form.contexts.includes(ctx)
                      ? "text-white border-transparent"
                      : "bg-app-surface text-app-muted border-app-border"
                  }`}
                  style={form.contexts.includes(ctx) ? { backgroundColor: ACCENT } : undefined}
                >
                  {CONTEXT_LABELS[ctx]}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full h-10 rounded-xl text-white text-[11px] font-black uppercase disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kaydet"}
            </button>
          </form>
        )}

        {/* Raw sources */}
        <section className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1">
            {loading ? "..." : `${rawSources.length} ham kaynak`}
          </p>
          {!loading && rawSources.length === 0 ? (
            <div className="text-center py-8 bg-app-surface rounded-2xl border border-dashed border-app-border">
              <p className="text-sm font-bold text-app-muted">Henüz ham kaynak yok</p>
              <p className="text-[11px] text-app-muted mt-1">Kanal veya oynatma listesi URL&apos;si ekle</p>
            </div>
          ) : (
            rawSources.map((source) => (
              <article
                key={source.id}
                className="rounded-2xl border border-app-border bg-app-surface shadow-sm overflow-hidden"
              >
                <div className="p-3 flex items-start gap-3">
                  <SeriesCover youtubeId={source.youtubeId} />
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-white mb-1" style={{ backgroundColor: ACCENT }}>
                      {source.sourceType && source.sourceType !== "manual"
                        ? SOURCE_LABELS[source.sourceType as keyof typeof SOURCE_LABELS]
                        : "Ham"}
                    </span>
                    <h3 className="text-[14px] font-black text-app-text truncate">{source.title}</h3>
                    <p className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: ACCENT }}>
                      {source.creator}
                    </p>
                    <p className="text-[10px] font-bold text-app-muted mt-1">
                      {source.episodeCount} video
                      {source.sourceUrl ? " · YouTube kaynağı" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePromoteClick(source)}
                      className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg border border-app-border bg-app-surface text-[9px] font-black uppercase tracking-wide text-app-text hover:text-red-500 active:scale-95"
                      title="Keşfet'e seri olarak ekle"
                    >
                      <ArrowUpRight size={12} weight="bold" />
                      Seri
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeries(source.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-app-border bg-app-surface text-app-muted hover:text-red-500 active:scale-95"
                      aria-label="Sil"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExpand(source.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-app-border bg-app-surface text-app-muted hover:text-app-text active:scale-95"
                      aria-label="Videoları göster"
                    >
                      {expandedId === source.id ? (
                        <CaretUp size={14} weight="bold" />
                      ) : (
                        <CaretDown size={14} weight="bold" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedId === source.id && (
                  <div className="border-t border-app-border bg-app-surface-muted/50 p-3 space-y-3">
                    {expandedLoading ? (
                      <p className="text-xs text-app-muted text-center py-4">Yükleniyor...</p>
                    ) : (
                      <>
                        <SeriesPlaylistImport
                          url={addEpisodeUrl}
                          onChange={setAddEpisodeUrl}
                          onImport={() => handleAddEpisode(source.id, source.title)}
                          loading={addEpisodeLoading}
                        />

                        {importJob?.seriesId === source.id && importJob.phase !== "done" && (
                          <PlaylistImportProgress job={importJob} />
                        )}

                        <div className="space-y-1.5">
                          {sortEpisodesByDate(expandedSeries?.episodes || []).map((ep, index) => (
                            <div
                              key={ep.id}
                              className="flex items-start gap-3 p-2.5 rounded-xl bg-app-surface border border-app-border"
                            >
                              <EpisodeThumbnail ep={ep} />
                              <EpisodeInfo
                                episodeNumber={index + 1}
                                publishedAt={ep.publishedAt}
                                title={ep.title}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteEpisode(ep.id, source.id)}
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-app-muted hover:text-red-500 active:scale-95 mt-0.5"
                                aria-label="Videoyu sil"
                              >
                                <Trash size={12} weight="bold" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </section>

        {/* Published series */}
        <section className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1">
            {loading ? "..." : `${seriesList.length} seri · keşfet`}
          </p>

          {loading ? (
            <div className="text-center py-12 text-app-muted text-xs font-bold uppercase animate-pulse">
              Yükleniyor...
            </div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-12 bg-app-surface rounded-2xl border border-app-border">
              <p className="text-sm font-bold text-app-muted">Henüz seri yok</p>
            </div>
          ) : (
            seriesList.map((series) => (
              <article
                key={series.id}
                className="rounded-2xl border border-app-border bg-app-surface shadow-sm overflow-hidden"
              >
                <div className="p-3 flex items-start gap-3">
                  <SeriesCover youtubeId={series.youtubeId} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-black text-app-text truncate">
                      {series.title}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: ACCENT }}>
                      {series.creator}
                    </p>
                    <p className="text-[10px] font-bold text-app-muted mt-1">
                      {series.episodeCount} bölüm · {CATEGORY_LABELS[series.category]}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(series)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-app-border bg-app-surface text-app-muted hover:text-app-text active:scale-95"
                      aria-label="Düzenle"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeries(series.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-app-border bg-app-surface text-app-muted hover:text-red-500 active:scale-95"
                      aria-label="Sil"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExpand(series.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-app-border bg-app-surface text-app-muted hover:text-app-text active:scale-95"
                      aria-label="Bölümleri göster"
                    >
                      {expandedId === series.id ? (
                        <CaretUp size={14} weight="bold" />
                      ) : (
                        <CaretDown size={14} weight="bold" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedId === series.id && (
                  <div className="border-t border-app-border bg-app-surface-muted/50 p-3 space-y-3">
                    {expandedLoading ? (
                      <p className="text-xs text-app-muted text-center py-4">Yükleniyor...</p>
                    ) : (
                      <>
                        <SeriesPlaylistImport
                          url={addEpisodeUrl}
                          onChange={setAddEpisodeUrl}
                          onImport={() => handleAddEpisode(series.id, series.title)}
                          loading={addEpisodeLoading}
                        />

                        {importJob?.seriesId === series.id && importJob.phase !== "done" && (
                          <PlaylistImportProgress job={importJob} />
                        )}

                        <div className="space-y-1.5">
                          {sortEpisodesByDate(expandedSeries?.episodes || []).map((ep, index) => (
                            <div
                              key={ep.id}
                              className="flex items-start gap-3 p-2.5 rounded-xl bg-app-surface border border-app-border"
                            >
                              <EpisodeThumbnail ep={ep} />
                              <EpisodeInfo
                                episodeNumber={index + 1}
                                publishedAt={ep.publishedAt}
                                title={ep.title}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteEpisode(ep.id, series.id)}
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-app-muted hover:text-red-500 active:scale-95 mt-0.5"
                                aria-label="Bölümü sil"
                              >
                                <Trash size={12} weight="bold" />
                              </button>
                            </div>
                          ))}
                          {(expandedSeries?.episodes || []).length === 0 && (
                            <p className="text-xs text-app-muted text-center py-2">
                              Henüz bölüm yok
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>

      <PromoteVideoSheet
        open={!!promoteTarget}
        onOpenChange={(open) => {
          if (!open && !promoteLoading) setPromoteTarget(null);
        }}
        source={promoteTarget}
        loading={promoteLoading}
        onConfirm={(title) => {
          if (promoteTarget) void handlePromote(promoteTarget.id, title);
        }}
      />
    </YTDBShell>
  );
}
