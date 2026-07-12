"use client";

import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import type { gaming_hub } from "@/lib/client";
import HorizontalScrollRow from "./HorizontalScrollRow";
import DiscoverItemCard from "./DiscoverItemCard";

const PREVIEW_LIMIT = 10;

export default function DiscoverScrollSection({
  title,
  icon: Icon,
  category,
  items,
  aspect = "square",
  emptyMessage = "Henüz oyun yok",
}: {
  title: string;
  icon: Icon;
  category: gaming_hub.DiscoverCategory;
  items: gaming_hub.DiscoverItem[];
  aspect?: "square" | "poster";
  emptyMessage?: string;
}) {
  const preview = items.slice(0, PREVIEW_LIMIT);
  const seeAllHref = `/apps/gaming-hub/discover/all?category=${category}`;

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={14} className="text-gray-400 shrink-0" weight="duotone" />
          <h3 className="text-xs font-bold text-gray-400 truncate">
            {title}
          </h3>
        </div>
        {items.length > 0 && (
          <Link
            href={seeAllHref}
            className="shrink-0 text-xs font-semibold text-gray-400 active:opacity-70"
          >
            Tümünü Gör
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <HorizontalScrollRow>
          {preview.map((item) => (
            <DiscoverItemCard key={item.id} item={item} aspect={aspect} />
          ))}
        </HorizontalScrollRow>
      )}
    </section>
  );
}
