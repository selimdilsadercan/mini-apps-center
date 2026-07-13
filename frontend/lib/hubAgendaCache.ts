import type { QueryClient } from "@tanstack/react-query";
import type { rutinler } from "@/lib/client";

export const discoverQueryKey = (userId: string) => ["hub", "discover", userId] as const;

type DiscoverWidgetsData = {
  todayAgenda?: rutinler.RoutineEntry[];
  [key: string]: unknown;
};

function patchTodayAgenda(
  queryClient: QueryClient,
  userId: string,
  updater: (entries: rutinler.RoutineEntry[]) => rutinler.RoutineEntry[]
) {
  queryClient.setQueryData(discoverQueryKey(userId), (prev: unknown) => {
    if (!prev || typeof prev !== "object") return prev;
    const data = prev as DiscoverWidgetsData;
    if (!Array.isArray(data.todayAgenda)) return prev;
    return {
      ...data,
      todayAgenda: updater(data.todayAgenda),
    };
  });
}

export function syncAgendaCompletionInCache(
  queryClient: QueryClient,
  userId: string,
  entry: rutinler.RoutineEntry,
  completed: boolean
) {
  patchTodayAgenda(queryClient, userId, (items) => {
    const idx = items.findIndex((item) => item.id === entry.id);

    if (completed && entry.period_type === "once") {
      return items.filter((item) => item.id !== entry.id);
    }

    if (idx >= 0) {
      return items.map((item) =>
        item.id === entry.id ? { ...item, is_completed: completed } : item
      );
    }

    if (!completed && entry.period_type === "once") {
      return [...items, { ...entry, is_completed: false }];
    }

    return items;
  });
}

export function removeAgendaEntryFromCache(
  queryClient: QueryClient,
  userId: string,
  entryId: string
) {
  patchTodayAgenda(queryClient, userId, (items) =>
    items.filter((item) => item.id !== entryId)
  );
}

export function invalidateDiscoverWidgets(queryClient: QueryClient, userId: string) {
  void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
}
