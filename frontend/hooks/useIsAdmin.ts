"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";

const STORAGE_KEY = "everything_is_admin";

type AdminCacheEntry = {
  userId: string;
  isAdmin: boolean;
};

const memoryCache = new Map<string, boolean>();
const inflightRequests = new Map<string, Promise<boolean>>();

function readAdminCache(userId: string): boolean | null {
  if (memoryCache.has(userId)) {
    return memoryCache.get(userId)!;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminCacheEntry;
    if (parsed.userId !== userId) return null;
    memoryCache.set(userId, parsed.isAdmin);
    return parsed.isAdmin;
  } catch {
    return null;
  }
}

function writeAdminCache(userId: string, isAdmin: boolean) {
  memoryCache.set(userId, isAdmin);
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ userId, isAdmin } satisfies AdminCacheEntry)
    );
  } catch {
    // ignore quota / private mode errors
  }
}

export function clearAdminCache() {
  memoryCache.clear();
  inflightRequests.clear();
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function fetchAdminStatus(userId: string): Promise<boolean> {
  const existing = inflightRequests.get(userId);
  if (existing) return existing;

  const request = createBrowserClient()
    .users.checkAdmin(userId)
    .then((res) => {
      writeAdminCache(userId, res.isAdmin);
      return res.isAdmin;
    })
    .catch((err) => {
      console.error("Failed to check admin status:", err);
      return readAdminCache(userId) ?? false;
    })
    .finally(() => {
      inflightRequests.delete(userId);
    });

  inflightRequests.set(userId, request);
  return request;
}

export function useIsAdmin() {
  const { isLoaded, user } = useUser();
  const userId = user?.id;

  const cached = userId ? readAdminCache(userId) : null;
  const [resolvedAdmin, setResolvedAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      setResolvedAdmin(false);
      setLoading(false);
      return;
    }

    const fromCache = readAdminCache(userId);
    if (fromCache !== null) {
      setResolvedAdmin(fromCache);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let cancelled = false;

    fetchAdminStatus(userId).then((isAdmin) => {
      if (!cancelled) {
        setResolvedAdmin(isAdmin);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  const isAdmin = resolvedAdmin ?? cached ?? false;

  return { isAdmin, loading: loading && cached === null && resolvedAdmin === null };
}
