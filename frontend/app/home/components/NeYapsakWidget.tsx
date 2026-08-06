"use client";

import Link from "next/link";
import { Check, Plus, Question, Sparkle, X } from "@phosphor-icons/react";
import { ActivePlanRow, isActivePlan } from "@/app/apps/kim-gelir/components/ActivePlanRow";
import { NE_YAPSAK_ACCENT } from "@/app/apps/kim-gelir/lib/theme";
import type { kim_gelir } from "@/lib/client";
import { HomeSummaryCard, WidgetActionButton } from "./common/HomeSummaryCard";

interface NeYapsakWidgetProps {
  activities: kim_gelir.Activity[];
  loading?: boolean;
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
  activities,
  loading = false,
  userId,
  actionLoading,
  onRespond,
  onHideToday,
  onHidePermanent,
  isTodayHidden,
  isPermanentlyHidden,
  onRestore,
}: NeYapsakWidgetProps) {
  const activePlans = activities.filter(isActivePlan).slice(0, 3);

  return (
    <HomeSummaryCard
      href="/apps/kim-gelir"
      icon={Sparkle}
      color={NE_YAPSAK_ACCENT}
      title="Ne Yapsak?"
      subtitle="Planlar ve davetler"
      loading={loading}
      emptyText="Henüz aktif plan yok"
      hasContent={activePlans.length > 0}
      onHideToday={onHideToday}
      onHidePermanent={onHidePermanent}
      isTodayHidden={isTodayHidden}
      isPermanentlyHidden={isPermanentlyHidden}
      onRestore={onRestore}
      emptyFooter={
        <div className="px-4 py-3 border-t border-app-border">
          <Link
            href="/apps/kim-gelir/create"
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-app-muted hover:text-app-text transition-colors"
          >
            <Plus size={12} weight="bold" />
            İlk planını oluştur
          </Link>
        </div>
      }
      footerAction={
        activePlans.length > 0 ? (
          <Link
            href="/apps/kim-gelir/create"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-app-muted hover:text-app-text transition-colors"
          >
            <Plus size={12} weight="bold" />
            Plan Oluştur
          </Link>
        ) : undefined
      }
    >
      {activePlans.map((activity) => {
        const myResponse = activity.responses.find((r) => r.userId === userId)?.status;
        const needsRsvp =
          activity.creatorId !== userId && (!myResponse || myResponse === "bekliyor");

        return (
          <div key={activity.id} className="border-t border-app-border first:border-t-0">
            <ActivePlanRow activity={activity} currentUserId={userId} />
            {needsRsvp && (
              <div className="flex items-center gap-1.5 flex-wrap px-4 pb-3 pl-[3.75rem]">
                <WidgetActionButton
                  onClick={() => onRespond(activity.id, "gelirim")}
                  loading={actionLoading === `activity-${activity.id}-gelirim`}
                  icon={Check}
                >
                  Gelirim
                </WidgetActionButton>
                <WidgetActionButton
                  onClick={() => onRespond(activity.id, "belki")}
                  loading={actionLoading === `activity-${activity.id}-belki`}
                  icon={Question}
                >
                  Belki
                </WidgetActionButton>
                <WidgetActionButton
                  onClick={() => onRespond(activity.id, "gelemem")}
                  icon={X}
                >
                  Gelemiyorum
                </WidgetActionButton>
              </div>
            )}
          </div>
        );
      })}
    </HomeSummaryCard>
  );
}
