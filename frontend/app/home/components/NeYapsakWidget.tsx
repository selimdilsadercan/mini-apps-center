"use client";

import Link from "next/link";
import { Check, Plus, Question, Sparkle, Users, X } from "@phosphor-icons/react";
import { NeYapsakSuggestionRow } from "@/app/apps/kim-gelir/components/NeYapsakSuggestionRow";
import { NE_YAPSAK_ACCENT } from "@/app/apps/kim-gelir/lib/theme";
import type { NeYapsakSuggestion } from "@/app/apps/kim-gelir/lib/maras-sources";
import { HomeSummaryCard, WidgetActionButton } from "./common/HomeSummaryCard";

interface NeYapsakWidgetProps {
  suggestions: NeYapsakSuggestion[];
  suggestionsLoading?: boolean;
  activities: any[];
  userId?: string;
  actionLoading: string | null;
  onRespond: (activityId: string, status: string) => Promise<void>;
  onHideToday?: () => void;
  onHidePermanent?: () => void;
  isTodayHidden?: boolean;
  isPermanentlyHidden?: boolean;
  onRestore?: () => void;
}

export function NeYapsakWidget({
  suggestions,
  suggestionsLoading = false,
  activities,
  userId,
  actionLoading,
  onRespond,
  onHideToday,
  onHidePermanent,
  isTodayHidden,
  isPermanentlyHidden,
  onRestore,
}: NeYapsakWidgetProps) {
  const invited = activities.filter((a) => a.creatorId !== userId).slice(0, 2);
  const hasContent = suggestions.length > 0 || invited.length > 0;

  return (
    <HomeSummaryCard
      href="/apps/kim-gelir"
      icon={Sparkle}
      color={NE_YAPSAK_ACCENT}
      title="Ne Yapsak?"
      subtitle="Maraş · sinema, mekan, etkinlik"
      loading={suggestionsLoading}
      emptyText="Öneri yok — yine de plan oluşturabilirsin"
      hasContent={hasContent}
      onHideToday={onHideToday}
      onHidePermanent={onHidePermanent}
      isTodayHidden={isTodayHidden}
      isPermanentlyHidden={isPermanentlyHidden}
      onRestore={onRestore}
      footerAction={
        <Link
          href="/apps/kim-gelir/create"
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-app-muted hover:text-app-text transition-colors"
        >
          <Plus size={12} weight="bold" style={{ color: NE_YAPSAK_ACCENT }} />
          Plan Oluştur
        </Link>
      }
    >
      {suggestions.length > 0 && (
        <div className="px-3 py-2 border-t border-app-border space-y-1.5">
          <p className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-app-muted">
            Bugün için fikirler
          </p>
          {suggestions.map((s) => (
            <NeYapsakSuggestionRow key={s.id} suggestion={s} compact />
          ))}
        </div>
      )}

      {invited.length > 0 && (
        <div className="border-t border-app-border">
          <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.16em] text-app-muted">
            Gelen davetler
          </p>
          {invited.map((activity: any) => {
            const myResponse = activity.responses.find((r: any) => r.userId === userId)?.status;
            return (
              <div key={activity.id} className="px-4 py-3 border-t border-app-border/70 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${NE_YAPSAK_ACCENT}12`,
                      borderColor: `${NE_YAPSAK_ACCENT}25`,
                      color: NE_YAPSAK_ACCENT,
                    }}
                  >
                    <Users size={16} weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-app-text truncate">{activity.title}</p>
                    <p className="text-[9px] text-app-muted font-bold truncate">
                      {activity.location || "Konum belirtilmedi"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <WidgetActionButton
                    onClick={() => onRespond(activity.id, "gelirim")}
                    loading={actionLoading === `activity-${activity.id}-gelirim`}
                    icon={Check}
                    selected={myResponse === "gelirim"}
                  >
                    Gelirim
                  </WidgetActionButton>
                  <WidgetActionButton
                    onClick={() => onRespond(activity.id, "belki")}
                    loading={actionLoading === `activity-${activity.id}-belki`}
                    icon={Question}
                    selected={myResponse === "belki"}
                  >
                    Belki
                  </WidgetActionButton>
                  <WidgetActionButton
                    onClick={() => onRespond(activity.id, "gelemem")}
                    icon={X}
                    selected={myResponse === "gelemem"}
                  >
                    Gelemiyorum
                  </WidgetActionButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </HomeSummaryCard>
  );
}
