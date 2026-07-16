"use client";

import type { ReactNode } from "react";
import SeriesPosterCard from "./SeriesPosterCard";
import type { Series } from "../lib/types";

export default function DiscoverRow({
  title,
  subtitle,
  icon,
  items,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  items: Series[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-2.5">
      <div className="px-1">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[11px] font-black uppercase tracking-wider text-app-text">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-[11px] font-medium text-app-muted mt-0.5 pl-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {items.map((series) => (
          <SeriesPosterCard key={series.id} series={series} />
        ))}
      </div>
    </section>
  );
}
