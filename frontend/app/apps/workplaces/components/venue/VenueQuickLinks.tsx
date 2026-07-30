"use client";

import Link from "next/link";
import { CalendarBlank, ChefHat, CaretRight } from "@phosphor-icons/react";
import type { campus_events } from "@/lib/client";

interface VenueQuickLinksProps {
  businessId: string;
  businessName?: string;
  events?: campus_events.CampusEvent[];
  hasMenu?: boolean;
}

export default function VenueQuickLinks({
  businessId,
  businessName,
  events = [],
  hasMenu,
}: VenueQuickLinksProps) {
  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  if (!hasMenu && upcomingEvents.length === 0) return null;

  return (
    <div className="space-y-3">
      {hasMenu && (
        <Link
          href={`/apps/digital-menu?biz=${encodeURIComponent(businessId)}`}
          className="flex items-center justify-between p-4 bg-app-surface hover:bg-neutral-50 dark:hover:bg-zinc-800/60 border border-app-border rounded-[1.4rem] transition-colors no-underline group shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-[1.05rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <ChefHat size={24} weight="fill" className="text-red-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[14px] font-black text-app-text block leading-tight">Menü</span>
              <span className="text-[11px] font-bold text-app-muted block mt-0.5 truncate">
                {businessName ? `${businessName} menüsünü gör` : "Dijital menüyü aç"}
              </span>
            </div>
          </div>
          <CaretRight size={18} className="text-app-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {upcomingEvents.length > 0 && (
        <article className="bg-app-surface rounded-[1.4rem] border border-app-border p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <CalendarBlank size={18} weight="fill" className="text-sky-500" />
              </div>
              <span className="text-sm font-black text-app-text">Etkinlikler</span>
            </div>
            <Link
              href={`/apps/campus-events/venue?id=${encodeURIComponent(businessId)}`}
              className="text-[10px] font-black uppercase tracking-wider text-sky-600 hover:underline no-underline"
            >
              Tümü
            </Link>
          </div>

          <ul className="space-y-2">
            {upcomingEvents.map((event) => {
              const date = new Date(event.event_date);
              return (
                <li key={event.id}>
                  <Link
                    href={`/apps/campus-events/event?id=${encodeURIComponent(event.id)}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-100 dark:border-zinc-700 hover:border-sky-200 dark:hover:border-sky-800 transition-colors no-underline"
                  >
                    <div className="text-center shrink-0 w-10">
                      <p className="text-sm font-black text-app-text leading-none">{date.getDate()}</p>
                      <p className="text-[9px] font-bold text-app-muted uppercase">
                        {date.toLocaleDateString("tr-TR", { month: "short" })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-app-text truncate">{event.title}</p>
                      {event.location && (
                        <p className="text-[10px] text-app-muted truncate">{event.location}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>
      )}
    </div>
  );
}
