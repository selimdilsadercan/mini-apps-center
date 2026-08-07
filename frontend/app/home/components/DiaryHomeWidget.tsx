"use client";

import Link from "next/link";
import { BookmarkSimple, Plus, Sparkle } from "@phosphor-icons/react";
import { HomeSummaryCard } from "./common/HomeSummaryCard";

interface DiaryHomeWidgetProps {
  summary: {
    totalCount: number;
    badge: string;
    badgeEmoji: string;
    categoryCounts: { category: string; count: number }[];
  } | null;
  loading?: boolean;
  onHideToday?: () => void;
  onHidePermanent?: () => void;
  isTodayHidden?: boolean;
  isPermanentlyHidden?: boolean;
  onRestore?: () => void;
}

export function DiaryHomeWidget({
  summary,
  loading = false,
  onHideToday,
  onHidePermanent,
  isTodayHidden,
  isPermanentlyHidden,
  onRestore,
}: DiaryHomeWidgetProps) {
  const hasContent = !!summary && summary.totalCount > 0;

  return (
    <HomeSummaryCard
      href="/apps/diary"
      icon={BookmarkSimple}
      color="#F43F5E"
      title="Diary Günlük"
      subtitle="Aylık özet ve anıların"
      loading={loading}
      emptyText="Bu ay henüz aktivite kaydetmedin"
      hasContent={hasContent}
      onHideToday={onHideToday}
      onHidePermanent={onHidePermanent}
      isTodayHidden={isTodayHidden}
      isPermanentlyHidden={isPermanentlyHidden}
      onRestore={onRestore}
      emptyFooter={
        <div className="px-4 py-3 border-t border-app-border">
          <Link
            href="/apps/diary"
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-app-muted hover:text-app-text transition-colors"
          >
            <Plus size={12} weight="bold" />
            İlk anını kaydet
          </Link>
        </div>
      }
      footerAction={
        hasContent ? (
          <Link
            href="/apps/diary"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-app-muted hover:text-app-text transition-colors"
          >
            <Plus size={12} weight="bold" />
            Yeni Kayıt Ekle
          </Link>
        ) : undefined
      }
    >
      {summary && (
        <div className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold leading-tight text-app-text">
              Bu ay <span className="text-rose-500 font-extrabold">{summary.totalCount}</span> aktivite kaydettin!
            </p>
            <p className="text-[10px] text-app-muted flex items-center gap-1">
              <span>Derecen:</span>
              <span className="font-extrabold text-rose-500">{summary.badgeEmoji} {summary.badge}</span>
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center bg-rose-500/10 text-rose-500 w-10 h-10 rounded-xl">
            <Sparkle size={18} weight="fill" className="animate-pulse" />
          </div>
        </div>
      )}
    </HomeSummaryCard>
  );
}
