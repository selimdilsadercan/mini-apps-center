"use client";

import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { getOutdoorCategory } from "../../lib/outdoor-categories";

interface VenueOutdoorSectionProps {
  categoryId: string;
  websiteUrl?: string | null;
  backHref?: string;
}

export default function VenueOutdoorSection({
  categoryId,
  websiteUrl,
}: VenueOutdoorSectionProps) {
  const category = getOutdoorCategory(categoryId);
  const CatIcon = category?.icon;

  return (
    <article className="bg-app-surface rounded-2xl border border-app-border p-4 shadow-sm space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-app-muted">Aktivite</p>

      <div className="flex items-start gap-4">
        {CatIcon && (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${category?.color ?? "#0F766E"}14`,
              borderColor: `${category?.color ?? "#0F766E"}33`,
            }}
          >
            <CatIcon size={24} style={{ color: category?.color ?? "#0F766E" }} />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-lg font-black text-app-text tracking-tight">
            {category?.actionLabel ?? category?.name ?? "Açık Hava Aktivitesi"}
          </p>
          <p className="text-sm text-app-muted font-medium">
            {category?.name ?? categoryId}
          </p>
        </div>
      </div>

      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F766E]/10 hover:bg-[#0F766E]/15 text-[#0F766E] border border-[#0F766E]/20 font-bold rounded-xl transition-all text-xs no-underline"
        >
          <ArrowSquareOut size={14} weight="bold" />
          Detay / Web Sitesi
        </a>
      )}

      <Link
        href="/apps/outdoor-activities"
        className="inline-flex text-[11px] font-bold text-app-muted hover:text-[#0F766E] transition-colors no-underline"
      >
        Aktiviteler uygulamasında keşfet →
      </Link>
    </article>
  );
}
