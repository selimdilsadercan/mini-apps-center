"use client";

import { Calendar, MapPin, Microphone, Ticket } from "@phosphor-icons/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { standups } from "@/lib/client";

const ACCENT = "#FF9800";

export type ShowWithMeta = standups.Show & {
  comedian_name?: string;
  comedian_image?: string | null;
};

export default function ShowListItem({ show }: { show: ShowWithMeta }) {
  const comedianName =
    show.comedian_name ?? show.comedian?.name ?? "Komedyen";
  const comedianImage = show.comedian_image ?? show.comedian?.image_url ?? null;

  return (
    <article className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-4 flex gap-4 active:scale-[0.99] transition-transform">
      <div className="w-[72px] h-[88px] rounded-xl bg-app-surface-muted border border-app-border overflow-hidden shrink-0">
        {comedianImage ? (
          <img src={comedianImage} alt={comedianName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-app-muted">
            <Microphone size={28} weight="fill" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="text-[15px] font-black text-app-text leading-tight truncate">{show.title}</h3>
          <p className="text-[10px] font-black uppercase tracking-wider mt-1" style={{ color: ACCENT }}>
            {comedianName}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-app-muted">
            <Calendar size={13} weight="bold" className="shrink-0" />
            <span className="text-[11px] font-bold truncate">
              {format(new Date(show.show_date), "d MMMM EEEE, HH:mm", { locale: tr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-app-muted">
            <MapPin size={13} weight="bold" className="shrink-0" />
            <span className="text-[11px] font-bold truncate">
              {show.venue_name || "Mekan belirtilmedi"}
            </span>
          </div>
        </div>
      </div>

      {show.ticket_url && (
        <div className="flex items-center shrink-0">
          <a
            href={show.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform"
            style={{ backgroundColor: ACCENT }}
            aria-label="Bilet al"
          >
            <Ticket size={22} weight="fill" />
          </a>
        </div>
      )}
    </article>
  );
}
