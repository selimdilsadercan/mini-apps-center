/**
 * Home API Service
 * Client-side API calls for home page operations
 * (Static export compatible - no server actions)
 */

import { createBrowserClient } from "@/lib/api";
import { isUnauthenticatedError, getErrorMessage } from "@/lib/api-error-handler";
import type { lib } from "@/lib/client";

// Standardized response format
interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Kullanıcının tariflerini getirir
 */
export async function getUserRecipesAction(
  userId: string
): Promise<ActionResponse<lib.RecipeSummary[]>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.recipe.getUserRecipes(userId);
    
    return {
      data: response.recipes || [],
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to fetch user recipes:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
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
 * Kullanıcının uygulama sıralamasını günceller
 */
export async function updateAppOrderAction(
  clerkId: string,
  appOrder: string[]
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.updateAppOrder({ clerkId, appOrder });
    
    return {
      data: response.success,
      error: null
    };
  } catch (error) {
    console.error("Failed to update app order:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

export async function getUserPreferencesAction(
  clerkId: string
): Promise<ActionResponse<{ 
  appOrder: string[] | null; 
  selectedUniversity?: string | null; 
  isOnboardingFinished?: boolean;
  pinnedApps?: string[] | null;
  lastUsedApps?: Record<string, string> | null;
  usageCounts?: Record<string, number> | null;
  dailyWidgetStates?: Record<string, unknown> | null;
}>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.getUserPreferences(clerkId);
    
    return {
      data: {
        appOrder: response.appOrder,
        selectedUniversity: response.selectedUniversity,
        isOnboardingFinished: response.isOnboardingFinished,
        pinnedApps: response.pinnedApps,
        lastUsedApps: response.lastUsedApps,
        usageCounts: response.usageCounts,
        dailyWidgetStates: response.dailyWidgetStates
      },
      error: null
    };
  } catch (error) {
    console.error("Failed to get user preferences:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Kullanıcının tercihlerini günceller (appOrder, pinnedApps, lastUsedApps, usageCounts)
 */
export async function updateUserPreferencesAction(
  clerkId: string,
  preferences: {
    appOrder?: string[];
    pinnedApps?: string[];
    lastUsedApps?: Record<string, string>;
    usageCounts?: Record<string, number>;
    dailyWidgetStates?: Record<string, unknown>;
  }
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.updateUserPreferences({
      clerkId,
      ...preferences
    });
    
    return {
      data: response.success,
      error: null
    };
  } catch (error) {
    console.error("Failed to update user preferences:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Kullanıcının onboarding durumunu günceller
 */
export async function setOnboardingFinishedAction(
  clerkId: string,
  finished: boolean
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.setOnboardingFinished({ clerkId, finished });
    
    return {
      data: response.success,
      error: null
    };
  } catch (error) {
    console.error("Failed to set onboarding status:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Kullanıcının üniversite tercihini günceller
 */
export async function updateUniversityAction(
  clerkId: string,
  university: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.updateUniversity({ clerkId, university });
    
    return {
      data: response.success,
      error: null
    };
  } catch (error) {
    console.error("Failed to update university preference:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}
