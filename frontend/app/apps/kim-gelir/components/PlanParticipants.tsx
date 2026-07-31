"use client";

import type { kim_gelir } from "@/lib/client";
import { planCardClass, sectionLabelClass } from "../lib/theme";

const STATUS_BADGE: Record<
  kim_gelir.ActivityInvite["status"],
  { label: string; dotClass: string; textClass: string }
> = {
  gelirim: {
    label: "Geliyor",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  },
  belki: {
    label: "Belki",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600",
  },
  gelemem: {
    label: "Gelmiyor",
    dotClass: "bg-red-500",
    textClass: "text-red-500",
  },
  bekliyor: {
    label: "Bekliyor",
    dotClass: "bg-app-muted",
    textClass: "text-app-muted",
  },
};

const STATUS_ORDER: Record<kim_gelir.ActivityInvite["status"], number> = {
  gelirim: 0,
  belki: 1,
  bekliyor: 2,
  gelemem: 3,
};

export function PlanParticipants({
  activity,
  currentUserId,
}: {
  activity: kim_gelir.Activity;
  currentUserId: string;
}) {
  const participants = [...activity.responses].sort((a, b) => {
    if (a.userId === activity.creatorId) return -1;
    if (b.userId === activity.creatorId) return 1;
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  });

  if (participants.length === 0) return null;

  return (
    <section className={planCardClass}>
      <label className={sectionLabelClass}>Plana dahil</label>

      <div className="flex gap-3 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 scrollbar-none">
        {participants.map((person) => {
          const isMe = person.userId === currentUserId;
          const isCreator = person.userId === activity.creatorId;
          const badge = STATUS_BADGE[person.status];
          const displayName = isMe ? "Sen" : person.username || "Anonim";

          return (
            <div
              key={person.userId}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[4.5rem]"
            >
              <div className="relative">
                <div
                  className={`w-11 h-11 rounded-xl bg-app-surface-muted border overflow-hidden flex items-center justify-center ${
                    isCreator ? "border-[#FF5252]/40" : "border-app-border"
                  }`}
                >
                  {person.avatar ? (
                    <img src={person.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-app-muted">
                      {(person.username || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-app-surface ${badge.dotClass}`}
                  title={badge.label}
                />
              </div>
              <p className="text-[10px] font-black text-app-text truncate w-full text-center">
                {displayName}
              </p>
              <p className={`text-[8px] font-bold uppercase tracking-wide truncate w-full text-center ${badge.textClass}`}>
                {badge.label}
              </p>
            </div>
          );
        })}
      </div>

      {participants.length === 1 && (
        <p className="text-[10px] text-app-muted font-medium">
          Henüz kimse davet edilmedi — arkadaşlarını plana ekleyebilirsin.
        </p>
      )}
    </section>
  );
}
