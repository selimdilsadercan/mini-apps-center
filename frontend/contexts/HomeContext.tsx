"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserPreferencesAction, updateUserPreferencesAction } from "@/app/home/actions";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

interface DailyWidgetStates {
  /** ISO date string (YYYY-MM-DD) the states belong to */
  date: string;
  /** Series tmdbIds / ids ignored today */
  ignoredSeriesIds?: string[];
  /** Meal keys (e.g. "breakfast", "lunch", "dinner") completed today */
  completedMealKeys?: string[];
  cardOrder?: string[];
  hiddenCardIds?: string[];
  permanentlyHiddenCardIds?: string[];
}

interface HomeContextType {
  pinnedIds: string[];
  lastUsed: Record<string, number>;
  usageCounts: Record<string, number>;
  dailyWidgetStates: DailyWidgetStates | null;
  isDataLoaded: boolean;
  hasBusinesses: boolean;
  updateAppUsage: (appId: string) => Promise<void>;
  togglePin: (appId: string) => Promise<void>;
  updateDailyWidgetStates: (patch: Partial<Omit<DailyWidgetStates, "date">>) => Promise<void>;
  refreshSessionData: () => Promise<void>;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

function getTodayDateKey(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser();
  const queryClient = useQueryClient();

  // Queries for persistent data
  const prefsQuery = useQuery({
    queryKey: ["user", "preferences", user?.id || "guest"],
    queryFn: async () => {
      if (user?.id) {
        const res = await getUserPreferencesAction(user.id);
        return res.data;
      } else {
        // Guest support from localStorage
        const savedPinned = localStorage.getItem(`pinned_apps_guest`);
        const savedLastUsed = localStorage.getItem(`last_used_apps_guest`);
        const savedUsageCounts = localStorage.getItem(`usage_counts_guest`);
        const savedDailyStates = localStorage.getItem(`daily_widget_states_guest`);
        
        return {
          pinnedApps: savedPinned ? JSON.parse(savedPinned) : [],
          lastUsedApps: savedLastUsed ? JSON.parse(savedLastUsed) : {},
          usageCounts: savedUsageCounts ? JSON.parse(savedUsageCounts) : {},
          isOnboardingFinished: true, // Guests skip onboarding
          dailyWidgetStates: savedDailyStates ? JSON.parse(savedDailyStates) : null,
        };
      }
    },
    enabled: isLoaded,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const businessQuery = useQuery({
    queryKey: ["user", "businesses", user?.id],
    queryFn: async () => {
      if (!user?.id) return { businesses: [] };
      return client.business.getOwnedBusinesses(user.id);
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 30 * 60 * 1000,
  });

  // Local state for session stability (optional, but keep it if we want stability)
  // Or we can just use derived state from queries if we want them to stay in sync.
  // The user said "loading becomes long", so using query data directly is faster.
  
  const pinnedIds = useMemo<string[]>(() => prefsQuery.data?.pinnedApps || [], [prefsQuery.data]);
  const usageCounts = useMemo<Record<string, number>>(() => (prefsQuery.data?.usageCounts as Record<string, number>) || {}, [prefsQuery.data]);
  const lastUsed = useMemo(() => {
    const map: Record<string, number> = {};
    if (prefsQuery.data?.lastUsedApps) {
      Object.entries(prefsQuery.data.lastUsedApps).forEach(([id, time]) => {
        map[id] = new Date(time as string).getTime();
      });
    }
    return map;
  }, [prefsQuery.data]);

  // Daily widget states — auto-expire if date doesn't match today, but preserve permanentlyHiddenCardIds
  const dailyWidgetStates = useMemo<DailyWidgetStates | null>(() => {
    const raw = prefsQuery.data?.dailyWidgetStates as DailyWidgetStates | null | undefined;
    if (!raw) return null;
    const today = getTodayDateKey();
    if (raw.date !== today) {
      return {
        date: today,
        permanentlyHiddenCardIds: raw.permanentlyHiddenCardIds || [],
      };
    }
    return raw;
  }, [prefsQuery.data]);

  const hasBusinesses = useMemo(() => (businessQuery.data?.businesses || []).length > 0, [businessQuery.data]);
  const isDataLoaded = !prefsQuery.isLoading && !businessQuery.isLoading;

  const updateAppUsage = async (appId: string) => {
    const now = Date.now();
    const updatedUsageCounts = { ...usageCounts, [appId]: (usageCounts[appId] || 0) + 1 };
    const updatedLastUsedMap = { ...lastUsed, [appId]: now };
    const lastUsedIso: Record<string, string> = {};
    Object.entries(updatedLastUsedMap).forEach(([id, time]) => {
      lastUsedIso[id] = new Date(time).toISOString();
    });

    // Optimistic Update
    queryClient.setQueryData(["user", "preferences", user?.id || "guest"], (prev: any) => ({
      ...prev,
      lastUsedApps: lastUsedIso,
      usageCounts: updatedUsageCounts,
    }));

    if (user?.id) {
      updateUserPreferencesAction(user.id, { 
        lastUsedApps: lastUsedIso,
        usageCounts: updatedUsageCounts
      });
    } else {
      localStorage.setItem(`last_used_apps_guest`, JSON.stringify(updatedLastUsedMap));
      localStorage.setItem(`usage_counts_guest`, JSON.stringify(updatedUsageCounts));
    }
  };

  const togglePin = async (appId: string) => {
    const newPinned = pinnedIds.includes(appId)
      ? pinnedIds.filter((id: string) => id !== appId)
      : [...pinnedIds, appId];
    
    // Optimistic Update
    queryClient.setQueryData(["user", "preferences", user?.id || "guest"], (prev: any) => ({
      ...prev,
      pinnedApps: newPinned,
    }));
    
    if (user?.id) {
      try {
        await updateUserPreferencesAction(user.id, { pinnedApps: newPinned });
      } catch (err) {
        console.error("Failed to save pinned apps:", err);
      }
    } else {
      localStorage.setItem(`pinned_apps_guest`, JSON.stringify(newPinned));
    }
  };

  const updateDailyWidgetStates = async (patch: Partial<Omit<DailyWidgetStates, "date">>) => {
    const today = getTodayDateKey();
    const current = dailyWidgetStates?.date === today
      ? dailyWidgetStates
      : { date: today, permanentlyHiddenCardIds: dailyWidgetStates?.permanentlyHiddenCardIds || [] };
    const merged: DailyWidgetStates = {
      ...current,
      ...patch,
    };

    // Optimistic update
    queryClient.setQueryData(["user", "preferences", user?.id || "guest"], (prev: any) => ({
      ...prev,
      dailyWidgetStates: merged,
    }));

    if (user?.id) {
      try {
        await updateUserPreferencesAction(user.id, {
          dailyWidgetStates: merged as unknown as Record<string, unknown>,
        });
      } catch (err) {
        console.error("Failed to save daily widget states:", err);
      }
    } else {
      localStorage.setItem("daily_widget_states_guest", JSON.stringify(merged));
    }
  };

  const refreshSessionData = async () => {
    await Promise.all([
      prefsQuery.refetch(),
      businessQuery.refetch()
    ]);
  };

  return (
    <HomeContext.Provider value={{ 
      pinnedIds, 
      lastUsed, 
      usageCounts, 
      dailyWidgetStates,
      isDataLoaded, 
      hasBusinesses,
      updateAppUsage, 
      togglePin,
      updateDailyWidgetStates,
      refreshSessionData
    }}>
      {children}
    </HomeContext.Provider>
  );
}

export function useHome() {
  const context = useContext(HomeContext);
  if (context === undefined) {
    throw new Error("useHome must be used within a HomeProvider");
  }
  return context;
}
