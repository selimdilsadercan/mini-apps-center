"use client";

import {
  Calendar,
  CaretRight,
  InstagramLogo,
  Play,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { standups } from "@/lib/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const ACCENT = "#FF9800";

type ComedianDetails = {
  comedian: standups.Comedian;
  shows: standups.Show[];
  videos: standups.Video[];
};

export default function ComedianDrawer({
  open,
  onClose,
  comedian,
  details,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  comedian: standups.Comedian | null;
  details: ComedianDetails | null;
  loading: boolean;
}) {
  if (!comedian) return null;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose();
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-app-bg border-app-border max-h-[90vh]">
        <DrawerHeader className="text-left px-4 pb-2">
          <DrawerTitle className="sr-only">{comedian.name}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-app-surface border border-app-border overflow-hidden shrink-0 shadow-sm">
              {comedian.image_url ? (
                <img src={comedian.image_url} alt={comedian.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-app-muted">
                  {comedian.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-app-text tracking-tight truncate">{comedian.name}</h2>
              {comedian.instagram_username && (
                <a
                  href={`https://instagram.com/${comedian.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-app-muted hover:text-pink-500 transition-colors mt-1"
                >
                  <InstagramLogo size={16} weight="fill" />
                  <span>@{comedian.instagram_username}</span>
                </a>
              )}
            </div>
          </div>

          {comedian.bio && (
            <p className="text-sm text-app-muted leading-relaxed mb-8 font-medium italic">
              &ldquo;{comedian.bio}&rdquo;
            </p>
          )}

          {loading && (
            <div className="space-y-3 animate-pulse mb-8">
              <div className="h-3 w-40 bg-app-surface-muted rounded" />
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-video rounded-xl bg-app-surface-muted" />
                <div className="aspect-video rounded-xl bg-app-surface-muted" />
              </div>
            </div>
          )}

          {!loading && details && details.videos.length > 0 && (
            <section className="mb-8">
              <h3 className="text-[11px] font-[1000] text-app-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <YoutubeLogo size={16} weight="fill" className="text-red-500" />
                Öne çıkan içerikler
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {details.videos.map((video) => (
                  <a
                    key={video.id}
                    href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group active:scale-[0.98] transition-transform"
                  >
                    <div className="aspect-video rounded-xl bg-app-surface-muted border border-app-border overflow-hidden relative mb-1.5">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title ?? ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-app-muted">
                          <Play size={28} weight="fill" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                          <Play size={18} weight="fill" className="text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-app-text line-clamp-2 leading-snug">
                      {video.title}
                    </p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {!loading && details && details.shows.length > 0 && (
            <section>
              <h3 className="text-[11px] font-[1000] text-app-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Calendar size={14} weight="bold" />
                Tüm gösteriler
              </h3>
              <div className="space-y-2">
                {details.shows.map((show) => (
                  <div
                    key={show.id}
                    className="rounded-xl border border-app-border bg-app-surface p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black text-app-text truncate">{show.title}</p>
                      <p className="text-[10px] font-bold text-app-muted mt-0.5 truncate">
                        {format(new Date(show.show_date), "d MMMM yyyy", { locale: tr })} •{" "}
                        {show.venue_name || "Mekan yok"}
                      </p>
                    </div>
                    {show.ticket_url && (
                      <a
                        href={show.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5"
                        style={{ color: ACCENT }}
                      >
                        Bilet
                        <CaretRight size={12} weight="bold" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
