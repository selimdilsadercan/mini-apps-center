/**
 * Kaydedilenler API Service
 * Client-side API calls for saved items operations
 */

import { createBrowserClient } from "@/lib/api";
import {
  getErrorMessage,
  isUnauthenticatedError,
} from "@/lib/api-error-handler";
import type { lib, kaydedilenler } from "@/lib/client";

interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Clerk ID ile Supabase user'ı getirir veya oluşturur
 */
export async function getOrCreateUserAction(
  clerkId: string
): Promise<ActionResponse<lib.User & { isNewUser?: boolean }>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.getOrCreateUser({ clerkId });
    
    if (response.user) {
      return {
        data: { ...response.user, isNewUser: response.isNewUser },
        error: null
      };
    }
    
    return {
      data: null,
      error: "Kullanıcı oluşturulamadı"
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to get or create user:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Kullanıcının tüm kaydedilenlerini getirir
 */
export async function getUserBookmarksAction(
  userId: string
): Promise<ActionResponse<kaydedilenler.Bookmark[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.kaydedilenler.getUserBookmarks(userId);
    return {
      data: response.bookmarks ?? [],
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to fetch bookmarks:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Yeni kaydedilen içerik oluşturur
 */
export async function createBookmarkAction(params: {
  userId: string;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  category: string;
  instagramUsername?: string | null;
  city?: string | null;
  district?: string | null;
  rating?: number | null;
  isVisited?: boolean | null;
  isFavorite?: boolean | null;
}): Promise<ActionResponse<kaydedilenler.Bookmark>> {
  try {
    const client = createBrowserClient();
    const response = await client.kaydedilenler.createBookmark(params);
    return {
      data: response.bookmark,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to create bookmark:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Kaydedilen içeriği günceller
 */
export async function updateBookmarkAction(params: {
  bookmarkId: string;
  userId: string;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  category: string;
  instagramUsername?: string | null;
  city?: string | null;
  district?: string | null;
  rating?: number | null;
  isVisited: boolean;
  isFavorite: boolean;
}): Promise<ActionResponse<kaydedilenler.Bookmark>> {
  try {
    const client = createBrowserClient();
    const { bookmarkId, ...rest } = params;
    const response = await client.kaydedilenler.updateBookmark(bookmarkId, rest);
    return {
      data: response.bookmark,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to update bookmark:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Kaydedilen içeriği siler
 */
export async function deleteBookmarkAction(
  bookmarkId: string,
  userId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.kaydedilenler.deleteBookmark(bookmarkId, { userId });
    return {
      data: response.success,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to delete bookmark:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}
