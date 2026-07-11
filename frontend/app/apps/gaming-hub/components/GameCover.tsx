"use client";

import { useEffect, useState } from "react";
import { GameController } from "@phosphor-icons/react";
import { searchGamesAction } from "../actions";

export default function GameCover({
  coverUrl,
  title,
  igdbId,
  className,
}: {
  coverUrl: string | null | undefined;
  title: string;
  igdbId?: string | null;
  className?: string;
}) {
  const [resolvedUrl, setResolvedUrl] = useState(coverUrl ?? null);

  useEffect(() => {
    if (coverUrl) {
      setResolvedUrl(coverUrl);
      return;
    }

    let cancelled = false;

    void (async () => {
      const res = await searchGamesAction(title, 3);
      if (cancelled || !res.data?.length) return;

      const normalized = title.trim().toLowerCase();
      const match =
        res.data.find((g) => g.title.trim().toLowerCase() === normalized) ?? res.data[0];

      if (match?.coverUrl) {
        setResolvedUrl(match.coverUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coverUrl, title, igdbId]);

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={title}
        className={`object-cover bg-gray-100 shrink-0 ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      className={`bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 ${className ?? ""}`}
    >
      <GameController size={22} weight="fill" className="text-violet-600" />
    </div>
  );
}
