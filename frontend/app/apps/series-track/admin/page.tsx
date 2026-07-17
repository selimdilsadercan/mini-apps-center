"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, CircleNotch, MagnifyingGlass, Television } from "@phosphor-icons/react";
import toast, { Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { series_track } from "@/lib/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  CHANNEL_SLOT_TIMES,
  getChannelSlotPrograms,
  getProgramForSlot,
} from "../constants";

const client = createBrowserClient();

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export default function SeriesTrackAdminPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [channels, setChannels] = useState<series_track.TvChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("19:00");

  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelColor, setChannelColor] = useState("#EC4899");
  const [savingChannel, setSavingChannel] = useState(false);

  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [selectedSeriesTitle, setSelectedSeriesTitle] = useState("");
  const [selectedSeriesPoster, setSelectedSeriesPoster] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [seriesDetails, setSeriesDetails] = useState<any>(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [scheduleType, setScheduleType] = useState("daily");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);

  const [calendarEvents, setCalendarEvents] = useState<series_track.TvCalendarEvent[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) ?? null,
    [channels, selectedChannelId],
  );

  const slotProgram = useMemo(() => {
    if (!selectedChannel) return null;
    return getProgramForSlot<series_track.TvProgramSummary>(selectedChannel, selectedSlotTime);
  }, [selectedChannel, selectedSlotTime]);

  const channelProgramIds = useMemo(() => {
    if (!selectedChannel) return [];
    return getChannelSlotPrograms(selectedChannel).map((p) => p.id);
  }, [selectedChannel]);

  const channelCalendarEvents = useMemo(() => {
    if (!channelProgramIds.length) return calendarEvents;
    return calendarEvents.filter((ev) => channelProgramIds.includes(ev.program_id));
  }, [calendarEvents, channelProgramIds]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.replace("/apps/series-track");
    }
  }, [adminLoading, isAdmin, router]);

  const loadChannels = useCallback(async () => {
    try {
      setChannelsLoading(true);
      const res = await client.series_track.getTvChannels();
      const list = res.channels || [];
      setChannels(list);
      setSelectedChannelId((prev) => prev ?? list[0]?.id ?? null);
    } catch (err) {
      console.error(err);
      toast.error("Kanallar yüklenemedi");
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      setLoadingCalendar(true);
      const res = await client.series_track.getTvCalendarEvents();
      setCalendarEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCalendar(false);
    }
  }, []);

  const loadSeriesDetails = useCallback(async (id: number) => {
    try {
      setLoadingDetails(true);
      const details = await client.series_track.getSeriesDetails(id);
      setSeriesDetails(details);
    } catch (err) {
      console.error(err);
      toast.error("Dizi detayları yüklenemedi");
      setSeriesDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadChannels();
      void loadCalendar();
    }
  }, [isAdmin, loadChannels, loadCalendar]);

  useEffect(() => {
    if (!selectedChannel) return;

    setChannelName(selectedChannel.name);
    setChannelDescription(selectedChannel.description);
    setChannelColor(selectedChannel.color);

    const program = slotProgram;
    if (program) {
      if (program.tmdb_id) setTmdbId(program.tmdb_id);
      setSelectedSeriesTitle(program.title);
      setSelectedSeriesPoster(program.cover_image || null);
      if (program.season_number) setSeasonNumber(program.season_number);
      if (program.start_date) setStartDate(program.start_date.split("T")[0]);
      if (program.schedule_type) setScheduleType(program.schedule_type);

      void client.series_track
        .getTvProgramDetails(program.id, { userId: "" })
        .then((prog) => {
          const released = prog.episodes?.filter((e) => e.is_released) ?? [];
          const onAir =
            prog.episodes?.find((e) => e.is_released && !e.watched) ??
            released[released.length - 1] ??
            prog.episodes?.[0];
          if (onAir) setEpisodeNumber(onAir.episode_number);
        })
        .catch(console.error);
    } else {
      setTmdbId(null);
      setSelectedSeriesTitle("");
      setSelectedSeriesPoster(null);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [selectedChannel?.id, selectedSlotTime, slotProgram?.id]);

  useEffect(() => {
    if (tmdbId) void loadSeriesDetails(tmdbId);
    else setSeriesDetails(null);
  }, [tmdbId, loadSeriesDetails]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await client.series_track.searchSeries({ query: searchQuery.trim() });
      setSearchResults(res.results || []);
    } catch (err) {
      console.error(err);
      toast.error("Dizi araması yapılamadı");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSeries = (result: {
    id: number;
    name: string;
    poster_path?: string | null;
  }) => {
    setTmdbId(result.id);
    setSelectedSeriesTitle(result.name);
    setSelectedSeriesPoster(result.poster_path ? `https://image.tmdb.org/t/p/w200${result.poster_path}` : null);
    setSearchResults([]);
    setSearchQuery("");
  };

  useEffect(() => {
    if (seriesDetails?.seasons?.length) {
      const hasSeason = seriesDetails.seasons.some((s: any) => s.season_number === seasonNumber);
      if (!hasSeason) {
        setSeasonNumber(seriesDetails.seasons[0].season_number);
        setEpisodeNumber(1);
      }
    }
  }, [seriesDetails, seasonNumber]);

  const handleSaveChannel = async () => {
    if (!selectedChannelId) return;
    try {
      setSavingChannel(true);
      await client.series_track.updateTvChannel(selectedChannelId, {
        name: channelName.trim(),
        description: channelDescription.trim(),
        color: channelColor,
      });
      toast.success("Kanal güncellendi");
      await loadChannels();
    } catch (err) {
      console.error(err);
      toast.error("Kanal kaydedilemedi");
    } finally {
      setSavingChannel(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!selectedChannel || !tmdbId) return;
    try {
      setSavingProgram(true);
      const payload = {
        tmdbId,
        seasonNumber,
        episodeNumber,
        startDate: new Date(startDate).toISOString(),
        scheduleType,
      };

      if (slotProgram?.id) {
        await client.series_track.changeTvProgramSeasonEpisode({
          programId: slotProgram.id,
          ...payload,
        });
      } else {
        await client.series_track.createTvProgramForChannel({
          channelId: selectedChannel.id,
          slotTime: selectedSlotTime,
          ...payload,
        });
      }

      toast.success("Yayın programı güncellendi");
      await loadChannels();
      await loadCalendar();
    } catch (err) {
      console.error(err);
      toast.error("Yayın programı kaydedilemedi");
    } finally {
      setSavingProgram(false);
    }
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center text-app-muted text-xs font-bold uppercase tracking-widest">
        <CircleNotch size={20} className="animate-spin mr-2" />
        Yükleniyor...
      </div>
    );
  }

  const seasonEpisodeCount =
    seriesDetails?.seasons?.find((s: any) => s.season_number === seasonNumber)?.episode_count || 0;

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <Toaster position="top-center" />
      <header className="sticky top-0 z-30 app-chrome-top border-b border-app-border">
        <div className="px-4 py-3 max-w-xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/apps/series-track";
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-muted hover:text-app-text hover:bg-app-surface-muted/40 transition-colors"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black uppercase tracking-wide truncate">Episode Club Yönetimi</h1>
            <p className="text-[10px] text-app-muted font-bold uppercase tracking-wider">
              Kanallar · Renkler · Yayın takvimi
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-xl mx-auto space-y-5 pb-10">
        {/* Channel picker */}
        <section className="space-y-2">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-app-muted">Kanallar</h2>
          {channelsLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="w-[88px] h-[72px] rounded-xl bg-app-surface-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {channels.map((chan) => {
                const isActive = chan.id === selectedChannelId;
                return (
                  <button
                    key={chan.id}
                    type="button"
                    onClick={() => setSelectedChannelId(chan.id)}
                    className={`shrink-0 w-[88px] min-h-[72px] flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95 ${
                      isActive ? "shadow-sm" : "border-app-border bg-app-surface/60 hover:bg-app-surface-muted/40"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: `${chan.color}12`, borderColor: `${chan.color}55` }
                        : undefined
                    }
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${chan.color}20`, color: chan.color }}
                    >
                      <Television size={14} weight={isActive ? "fill" : "regular"} />
                    </div>
                    <span className="text-[8px] font-black uppercase text-center leading-tight line-clamp-2">
                      {chan.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedChannel && (
          <>
            {/* Channel settings */}
            <section className="bg-app-surface border border-app-border rounded-2xl p-4 space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wide">Kanal Ayarları</h2>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Kanal Adı</label>
                <input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-app-surface-muted border border-app-border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-app-border/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Açıklama</label>
                <textarea
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-app-surface-muted border border-app-border rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-app-border/50 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Kanal Rengi</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={channelColor}
                    onChange={(e) => setChannelColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-app-border bg-app-surface cursor-pointer"
                  />
                  <input
                    value={channelColor}
                    onChange={(e) => setChannelColor(e.target.value)}
                    className="flex-1 bg-app-surface-muted border border-app-border rounded-xl px-3 py-2.5 text-xs font-mono outline-none"
                  />
                  <div
                    className="w-10 h-10 rounded-xl border border-app-border shrink-0"
                    style={{ backgroundColor: channelColor }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={savingChannel}
                onClick={() => void handleSaveChannel()}
                className="w-full py-3 bg-app-text text-app-bg hover:opacity-90 disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                {savingChannel ? "Kaydediliyor..." : "Kanalı Kaydet"}
              </button>
            </section>

            {/* Program schedule */}
            <section className="bg-app-surface border border-app-border rounded-2xl p-4 space-y-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wide">Yayın Programı</h2>
                <p className="text-[10px] text-app-muted mt-1">
                  Her kanal için 3 saat dilimine dizi atayın.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {CHANNEL_SLOT_TIMES.map((slot) => {
                  const prog = selectedChannel
                    ? getProgramForSlot<series_track.TvProgramSummary>(selectedChannel, slot)
                    : null;
                  const isActive = selectedSlotTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95 ${
                        isActive ? "shadow-sm" : "border-app-border bg-app-surface-muted/50"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: `${selectedChannel?.color ?? "#888"}12`,
                              borderColor: `${selectedChannel?.color ?? "#888"}55`,
                            }
                          : undefined
                      }
                    >
                      <span className="text-[10px] font-black text-app-text">{slot}</span>
                      <span className="text-[8px] font-bold text-app-muted text-center line-clamp-2 leading-tight">
                        {prog?.title ?? "Boş"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-app-muted">
                {slotProgram
                  ? `${selectedSlotTime} slotu: ${slotProgram.title}`
                  : `${selectedSlotTime} slotu boş — yeni dizi atayın.`}
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Dizi Ara</label>
                <form onSubmit={handleSearch} className="relative">
                  <MagnifyingGlass
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="TMDB üzerinden dizi ara..."
                    className="w-full bg-app-surface-muted border border-app-border rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-app-border/50"
                  />
                </form>

                {searching && (
                  <div className="flex items-center justify-center py-4 text-app-muted text-xs">
                    <CircleNotch size={16} className="animate-spin mr-2" />
                    Aranıyor...
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelectSeries(result)}
                        className="w-full flex gap-3 p-2.5 bg-app-surface-muted border border-app-border rounded-xl text-left hover:bg-app-tab-track transition-colors active:scale-[0.99]"
                      >
                        <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-app-tab-track border border-app-border">
                          {result.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${result.poster_path}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-xs font-black text-app-text truncate">{result.name}</p>
                          <p className="text-[10px] text-app-muted line-clamp-2 mt-0.5">
                            {result.overview || "Açıklama yok"}
                          </p>
                          {result.first_air_date && (
                            <p className="text-[9px] text-app-muted font-bold mt-1">
                              {result.first_air_date.split("-")[0]}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {tmdbId && selectedSeriesTitle && (
                  <div className="flex items-center gap-3 p-2.5 bg-app-tab-active border border-app-border rounded-xl">
                    {selectedSeriesPoster ? (
                      <img
                        src={selectedSeriesPoster}
                        alt=""
                        className="w-10 h-14 rounded-lg object-cover shrink-0 border border-app-border"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-app-surface-muted shrink-0 border border-app-border" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Seçili Dizi</p>
                      <p className="text-xs font-black text-app-text truncate">{selectedSeriesTitle}</p>
                    </div>
                  </div>
                )}
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8 text-app-muted text-xs">
                  <CircleNotch size={18} className="animate-spin mr-2" />
                  Dizi detayları yükleniyor...
                </div>
              ) : seriesDetails ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider block">Sezon</label>
                    <select
                      value={seasonNumber}
                      onChange={(e) => {
                        setSeasonNumber(Number(e.target.value));
                        setEpisodeNumber(1);
                      }}
                      className="w-full bg-app-surface-muted border border-app-border text-xs font-bold rounded-xl px-3 py-2.5 outline-none"
                    >
                      {seriesDetails.seasons?.map((s: any) => (
                        <option key={s.season_number} value={s.season_number}>
                          Sezon {s.season_number} ({s.episode_count} bölüm)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider block">
                      Yayındaki Bölüm
                    </label>
                    <select
                      value={episodeNumber}
                      onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                      className="w-full bg-app-surface-muted border border-app-border text-xs font-bold rounded-xl px-3 py-2.5 outline-none font-mono"
                    >
                      {Array.from({ length: seasonEpisodeCount }).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          Bölüm {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider block">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-app-surface-muted border border-app-border text-xs font-bold rounded-xl px-3 py-2.5 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider block">
                      Tekrar Sıklığı
                    </label>
                    <select
                      value={scheduleType}
                      onChange={(e) => setScheduleType(e.target.value)}
                      className="w-full bg-app-surface-muted border border-app-border text-xs font-bold rounded-xl px-3 py-2.5 outline-none"
                    >
                      <option value="daily">Günlük</option>
                      <option value="weekly">Haftalık</option>
                    </select>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                disabled={savingProgram || loadingDetails || !seriesDetails || !tmdbId}
                onClick={() => void handleSaveProgram()}
                className="w-full py-3 bg-app-text text-app-bg hover:opacity-90 disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
              >
                {savingProgram ? "Kaydediliyor..." : "Yayın Akışını Kaydet"}
              </button>
            </section>

            {/* Calendar preview */}
            <section className="bg-app-surface border border-app-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wide">Yayın Takvimi</h2>
                <span className="text-[9px] font-mono text-app-muted">28 gün</span>
              </div>

              {loadingCalendar ? (
                <div className="flex justify-center py-6">
                  <CircleNotch size={20} className="animate-spin text-app-muted" />
                </div>
              ) : channelCalendarEvents.length > 0 ? (
                <div className="grid grid-cols-7 gap-1.5 p-2 bg-app-surface-muted border border-app-border rounded-xl max-h-64 overflow-y-auto">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                    <div key={d} className="text-center text-[8px] font-black text-app-muted uppercase py-1">
                      {d}
                    </div>
                  ))}
                  {(() => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    const dayDiff = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1;
                    startOfWeek.setDate(startOfWeek.getDate() - dayDiff);

                    return Array.from({ length: 28 }).map((_, idx) => {
                      const cellDate = new Date(startOfWeek);
                      cellDate.setDate(cellDate.getDate() + idx);
                      const isToday = cellDate.toDateString() === today.toDateString();
                      const dayEvents = channelCalendarEvents.filter((ev) => {
                        const evDate = new Date(ev.release_date);
                        return evDate.toDateString() === cellDate.toDateString();
                      });

                      return (
                        <div
                          key={idx}
                          className={`min-h-[52px] p-1 rounded-lg border flex flex-col ${
                            isToday ? "bg-app-tab-active border-app-border" : "bg-app-surface border-app-border"
                          }`}
                        >
                          <span className={`text-[8px] font-mono font-bold ${isToday ? "text-app-text" : "text-app-muted"}`}>
                            {cellDate.getDate()}
                          </span>
                          <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                            {dayEvents.map((ev) => (
                              <div
                                key={ev.id}
                                title={`S${ev.season_number}E${ev.episode_number}: ${ev.title}`}
                                className="text-[7px] font-black px-1 py-0.5 rounded truncate leading-tight"
                                style={{
                                  backgroundColor: `${selectedChannel.color}20`,
                                  color: selectedChannel.color,
                                }}
                              >
                                E{ev.episode_number}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-xs text-app-muted py-2">Bu kanal için planlanmış bölüm yok.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
