"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/api";
import type { lib } from "@/lib/client";

export const PROFILE_STALE_TIME = 5 * 60 * 1000;

export const profileUserKey = (userId: string) => ["user", "profile", userId] as const;

const client = createBrowserClient();

export async function fetchProfileUser(userId: string): Promise<lib.User | null> {
  const res = await client.users.getUserByClerkId(userId);
  return res.user ?? null;
}

export function upsertProfileUserInCache(
  queryClient: QueryClient,
  userId: string,
  user: lib.User | null
) {
  queryClient.setQueryData(profileUserKey(userId), user);
}

export function invalidateProfileUser(queryClient: QueryClient, userId: string) {
  void queryClient.invalidateQueries({ queryKey: profileUserKey(userId) });
}

export function useProfileUser() {
  const { user, isLoaded } = useUser();
  const { backendUser } = useAuthContext();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  useEffect(() => {
    if (!userId || !backendUser) return;
    const key = profileUserKey(userId);
    if (!queryClient.getQueryData(key)) {
      queryClient.setQueryData(key, backendUser);
    }
  }, [userId, backendUser, queryClient]);

  const query = useQuery({
    queryKey: profileUserKey(userId || "guest"),
    queryFn: () => fetchProfileUser(userId),
    enabled: isLoaded && !!userId,
    staleTime: PROFILE_STALE_TIME,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous ?? backendUser ?? undefined,
  });

  const dbUser = query.data ?? backendUser ?? null;
  const isInitialLoading = !isLoaded || (query.isLoading && !dbUser);

  return {
    dbUser,
    isInitialLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    refetch: query.refetch,
  };
}
