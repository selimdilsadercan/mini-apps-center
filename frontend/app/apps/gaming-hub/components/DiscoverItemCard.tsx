"use client";

import type { gaming_hub } from "@/lib/client";
import GameCover from "./GameCover";

export default function DiscoverItemCard({
  item,
  aspect = "square",
}: {
  item: gaming_hub.DiscoverItem;
  aspect?: "square" | "poster";
}) {
  const inner = (
    <>
      {aspect === "poster" ? (
        <GameCover
          coverUrl={item.coverUrl}
          title={item.title}
          className="w-full aspect-[3/4] rounded-none"
        />
      ) : (
        <GameCover
          coverUrl={item.coverUrl}
          title={item.title}
          className="w-full aspect-square rounded-none"
        />
      )}
      <div className="p-1.5">
        <p className="text-[10px] font-bold text-gray-700 line-clamp-2 leading-snug">{item.title}</p>
      </div>
    </>
  );

  const className =
    "shrink-0 w-[7.25rem] bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col active:scale-[0.98] transition-transform";

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function DiscoverItemGridCard({
  item,
  imagePadding = "none",
}: {
  item: gaming_hub.DiscoverItem;
  imagePadding?: "none" | "relaxed";
}) {
  const imagePaddingClass = imagePadding === "relaxed" ? "p-2 sm:p-3" : "p-0";

  const inner = (
    <>
      <div
        className={`aspect-square w-full bg-gray-50 flex items-center justify-center overflow-hidden ${imagePaddingClass}`}
      >
        <GameCover
          coverUrl={item.coverUrl}
          title={item.title}
          fit="contain"
          className="w-full h-full max-w-full max-h-full"
        />
      </div>
      <div className="px-1 pb-1.5 pt-0.5 sm:px-1.5">
        <p className="text-[8px] sm:text-[9px] font-semibold text-gray-600 line-clamp-2 leading-tight text-center">
          {item.title}
        </p>
      </div>
    </>
  );

  const className =
    "min-w-0 bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm flex flex-col";

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}
