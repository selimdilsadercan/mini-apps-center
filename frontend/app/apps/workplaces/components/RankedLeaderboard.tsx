"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Trophy } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import { useTranslations } from "@/contexts/LanguageContext";
import { DEFAULT_VENUE_CITY } from "../lib/venue-types";
import { RankedPlaceThumb } from "./venue/VenueRankedSection";

export default function RankedLeaderboard() {
  const t = useTranslations("workplaces");
  const client = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const listIdFromUrl = searchParams.get("listId");

  const [lists, setLists] = useState<workplaces.RankList[]>([]);
  const [selectedListId, setSelectedListId] = useState(listIdFromUrl ?? "kahve");
  const [entries, setEntries] = useState<workplaces.LeaderboardEntry[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(true);

  const selectedList = useMemo(
    () => lists.find((l) => l.id === selectedListId),
    [lists, selectedListId],
  );

  useEffect(() => {
    if (listIdFromUrl) {
      setSelectedListId(listIdFromUrl);
    }
  }, [listIdFromUrl]);

  useEffect(() => {
    client.workplaces
      .getRankLists()
      .then((res) => setLists(res.lists ?? []))
      .catch((err) => console.error("getRankLists error:", err))
      .finally(() => setLoadingLists(false));
  }, [client]);

  const loadLeaderboard = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const res = await client.workplaces.getLeaderboard({
        listId: selectedListId,
        city: DEFAULT_VENUE_CITY,
        limit: 50,
      });
      setEntries(res.entries ?? []);
    } catch (err) {
      console.error("getLeaderboard error:", err);
      setEntries([]);
    } finally {
      setLoadingBoard(false);
    }
  }, [client, selectedListId]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {loadingLists ? (
          <>
            <div className="h-8 w-20 rounded-full bg-neutral-100 dark:bg-zinc-800 animate-pulse shrink-0" />
            <div className="h-8 w-24 rounded-full bg-neutral-100 dark:bg-zinc-800 animate-pulse shrink-0" />
          </>
        ) : (
          lists.map((list) => {
            const active = list.id === selectedListId;
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => setSelectedListId(list.id)}
                className={`shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                  active
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-app-surface text-app-text border-app-border"
                }`}
              >
                {list.emoji} {list.label}
              </button>
            );
          })
        )}
      </div>

      {selectedList && (
        <p className="text-sm font-bold text-app-text -mt-1">{selectedList.label}</p>
      )}

      {loadingBoard ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-neutral-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 px-6 bg-app-surface rounded-2xl border border-app-border">
          <Trophy size={36} className="text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-app-text">{t("ranked.emptyTitle")}</p>
          <p className="text-xs text-app-muted mt-1">{t("ranked.emptyHint")}</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.placeId}>
              <Link
                href={`/apps/workplaces/place?placeId=${encodeURIComponent(entry.placeId)}`}
                className="flex items-center gap-3 p-3 bg-app-surface rounded-2xl border border-app-border hover:border-amber-300 transition-colors no-underline"
              >
                <span
                  className={`w-7 text-center text-sm font-black tabular-nums shrink-0 ${
                    entry.rank <= 3 ? "text-amber-600" : "text-app-muted"
                  }`}
                >
                  {entry.rank}
                </span>
                <RankedPlaceThumb imageUrl={entry.imageUrl} name={entry.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-app-text leading-tight line-clamp-2">{entry.name}</p>
                  {entry.district && (
                    <p className="text-[11px] text-app-muted truncate">{entry.district}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-app-text tabular-nums">
                    {entry.voteCount > 0 ? entry.averageRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-[10px] text-app-muted">
                    {entry.voteCount > 0 ? t("ranked.votes", { count: entry.voteCount }) : "Oy yok"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
