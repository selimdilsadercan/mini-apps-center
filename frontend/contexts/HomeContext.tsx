"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { getUserPreferencesAction, updateUserPreferencesAction } from "@/app/home/actions";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

interface HomeContextType {
  pinnedIds: string[];
  lastUsed: Record<string, number>;
  usageCounts: Record<string, number>;
  isDataLoaded: boolean;
  hasBusinesses: boolean;
  updateAppUsage: (appId: string) => Promise<void>;
  togglePin: (appId: string) => Promise<void>;
  refreshSessionData: () => Promise<void>;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser();
  
  // These states represent the "Session" view - they don't change after initial load
  // unless explicitly refreshed, ensuring a stable UI during the session.
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [lastUsed, setLastUsed] = useState<Record<string, number>>({});
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasBusinesses, setHasBusinesses] = useState(false);

  const loadData = useCallback(async () => {
    if (!isLoaded) return;

    try {
      if (user?.id) {
        // Fetch preferences and business ownership in parallel
        const [prefsRes, bizRes] = await Promise.all([
          getUserPreferencesAction(user.id),
          client.business.getOwnedBusinesses(user.id)
        ]);

        const { data } = prefsRes;
        if (data) {
          if (data.pinnedApps) setPinnedIds(data.pinnedApps);
          if (data.usageCounts) setUsageCounts(data.usageCounts);
          if (data.lastUsedApps) {
            const lastUsedMap: Record<string, number> = {};
            Object.entries(data.lastUsedApps).forEach(([id, time]) => {
              lastUsedMap[id] = new Date(time).getTime();
            });
            setLastUsed(lastUsedMap);
          }
        }

        setHasBusinesses((bizRes.businesses || []).length > 0);
      } else {
        const savedPinned = localStorage.getItem(`pinned_apps_guest`);
        if (savedPinned) setPinnedIds(JSON.parse(savedPinned));

        const savedLastUsed = localStorage.getItem(`last_used_apps_guest`);
        if (savedLastUsed) setLastUsed(JSON.parse(savedLastUsed));

        const savedUsageCounts = localStorage.getItem(`usage_counts_guest`);
        if (savedUsageCounts) setUsageCounts(JSON.parse(savedUsageCounts));
      }
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsDataLoaded(true);
    }
  }, [user?.id, isLoaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateAppUsage = async (appId: string) => {
    const now = Date.now();
    
    // We calculate the NEW values but we DON'T update the local state 
    // that drives the UI sorting (pinnedIds, lastUsed, usageCounts).
    // This ensures the home page order remains stable during the session.
    
    const currentCount = usageCounts[appId] || 0;
    const newCount = currentCount + 1;
    
    // We update the persistent storage in the background
    if (user?.id) {
      // Prepare the full lastUsed map for the backend
      const updatedLastUsedMap = { ...lastUsed, [appId]: now };
      const lastUsedIso: Record<string, string> = {};
      Object.entries(updatedLastUsedMap).forEach(([id, time]) => {
        lastUsedIso[id] = new Date(time).toISOString();
      });

      const updatedUsageCounts = { ...usageCounts, [appId]: newCount };

      // Background update
      updateUserPreferencesAction(user.id, { 
        lastUsedApps: lastUsedIso,
        usageCounts: updatedUsageCounts
      });
    } else {
      const updatedLastUsedMap = { ...lastUsed, [appId]: now };
      const updatedUsageCounts = { ...usageCounts, [appId]: newCount };
      
      localStorage.setItem(`last_used_apps_guest`, JSON.stringify(updatedLastUsedMap));
      localStorage.setItem(`usage_counts_guest`, JSON.stringify(updatedUsageCounts));
    }
  };

  const togglePin = async (appId: string) => {
    const newPinned = pinnedIds.includes(appId)
      ? pinnedIds.filter(id => id !== appId)
      : [...pinnedIds, appId];
    
    // For pinning, we DO update the state immediately because the user
    // expects immediate visual feedback when they click the pin button.
    setPinnedIds(newPinned);
    
    if (user?.id) {
      await updateUserPreferencesAction(user.id, { pinnedApps: newPinned });
    } else {
      localStorage.setItem(`pinned_apps_guest`, JSON.stringify(newPinned));
    }
  };

  const refreshSessionData = async () => {
    await loadData();
  };

  return (
    <HomeContext.Provider value={{ 
      pinnedIds, 
      lastUsed, 
      usageCounts, 
      isDataLoaded, 
      hasBusinesses,
      updateAppUsage, 
      togglePin,
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
