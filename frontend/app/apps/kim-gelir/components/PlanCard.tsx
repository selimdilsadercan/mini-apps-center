"use client";

import Link from "next/link";
import { ArrowRight, Clock, MapPin, Users } from "@phosphor-icons/react";
import type { kim_gelir } from "@/lib/client";
import { NE_YAPSAK_ACCENT, PLAN_OPEN_LOCATION, PLAN_OPEN_TIME } from "../lib/theme";

const STATUS_LABEL: Record<string, string> = {
  gelirim: "Geliyorsun",
  belki: "Belki",
  gelemem: "Gelemiyorsun",
  bekliyor: "Cevap bekleniyor",
};

export function PlanCard({
  activity,
  currentUserId,
}: {
  activity: kim_gelir.Activity;
  currentUserId: string;
}) {
  const timeIsOpen = activity.timeOption === PLAN_OPEN_TIME;
  const locationIsOpen = activity.location === PLAN_OPEN_LOCATION;
  const isMine = activity.creatorId === currentUserId;

  const myStatus = activity.responses.find((r) => r.userId === currentUserId)?.status;
  const goingCount = activity.responses.filter((r) => r.status === "gelirim").length;
  const totalInvited = activity.responses.length;

  return (
    <Link
      href={`/apps/kim-gelir/plan/${activity.id}`}
      className="group block bg-app-surface rounded-2xl border border-app-border p-4 hover:border-[#FF5252]/25 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-black text-sm text-app-text leading-snug flex-1 min-w-0">
          {activity.title}
        </h3>
        <ArrowRight
          size={14}
          weight="bold"
          className="shrink-0 text-app-muted group-hover:text-[#FF5252] group-hover:translate-x-0.5 transition-all mt-0.5"
        />
      </div>

      <div className="space-y-1.5 mb-3">
        <div
          className={`flex items-center gap-2 text-[11px] font-bold min-w-0 ${timeIsOpen ? "text-app-muted/75 italic" : "text-app-muted"}`}
        >
          <Clock size={13} style={{ color: NE_YAPSAK_ACCENT }} className="shrink-0" />
          <span className="truncate">
            {activity.timeOption}
            {activity.customTime ? ` · ${activity.customTime}` : ""}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 text-[11px] font-bold min-w-0 ${locationIsOpen ? "text-app-muted/75 italic" : "text-app-muted"}`}
        >
          <MapPin size={13} style={{ color: NE_YAPSAK_ACCENT }} className="shrink-0" />
          <span className="truncate">{activity.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-app-border/70">
        <div className="flex items-center gap-1.5 text-[10px] text-app-muted font-bold min-w-0">
          <Users size={12} className="shrink-0" />
          <span className="truncate">
            {isMine ? "Senin planın" : activity.creatorUsername || "Arkadaşın"}
            {totalInvited > 0 && ` · ${goingCount}/${totalInvited} geliyor`}
          </span>
        </div>
        {myStatus && myStatus !== "bekliyor" && (
          <span
            className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md shrink-0 ${
              myStatus === "gelirim"
                ? "bg-emerald-500/10 text-emerald-600"
                : myStatus === "belki"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-red-500/10 text-red-500"
            }`}
          >
            {STATUS_LABEL[myStatus]}
          </span>
        )}
      </div>
    </Link>
  );
}
