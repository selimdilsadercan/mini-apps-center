/**
 * Recipe API Service
 * Client-side API calls for recipe operations
 * (Static export compatible - no server actions)
 */

import { createBrowserClient } from "@/lib/api";
import {
  getErrorMessage,
  isNotFoundError,
  isUnauthenticatedError,
} from "@/lib/api-error-handler";
import type { lib, contributions } from "@/lib/client";

// Standardized response format
interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

export type PlanMealInput = {
  id: string;
  title: string;
  recipeId?: string;
  mealType: "breakfast" | "lunch" | "dinner";
};

export type PlanDataInput = Record<string, PlanMealInput[]>;

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
 * Kullanıcının tariflerini getirir
 */
export async function getUserRecipesAction(
  userId: string
): Promise<ActionResponse<lib.RecipeSummary[]>> {
  try {
    const client = createBrowserClient();

    const response = await client.recipe.getUserRecipes(userId);

    return {
      data: response.recipes ?? [],
      error: null,
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to fetch user recipes:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Recipe ID ile tarif detayını getirir
 */
export async function getRecipeByIdAction(
  recipeId: string
): Promise<ActionResponse<lib.Recipe>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.recipe.getRecipeById(recipeId);
    
    return {
      data: response.recipe,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to fetch recipe:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Tarifi siler (sadece tarifi oluşturan kullanıcı silebilir)
 */
export async function deleteRecipeAction(
  recipeId: string,
  userId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.recipe.deleteRecipe(recipeId, { userId });
    
    return {
      data: response.success,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to delete recipe:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Kullanıcının yemek planını getirir
 */
export async function getMealPlanAction(
  userId: string
): Promise<ActionResponse<PlanDataInput>> {
  try {
    const client = createBrowserClient();
    const response = await client.recipe.getMealPlan(userId);
    return {
      data: response.plan ?? {},
      error: null,
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    if (isNotFoundError(error)) {
      return { data: null, error: "ENDPOINT_NOT_FOUND" };
    }
    console.error("Failed to fetch meal plan:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Kullanıcının yemek planını kaydeder
 */
export async function setMealPlanAction(
  userId: string,
  plan: PlanDataInput
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.recipe.setMealPlan(userId, { plan });
    return {
      data: response.success,
      error: null,
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    if (isNotFoundError(error)) {
      return { data: null, error: "ENDPOINT_NOT_FOUND" };
    }
    console.error("Failed to save meal plan:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Topluluktaki tüm tarifleri (recipe katkılarını) getirir
 */
export async function getCommunityRecipesAction(): Promise<ActionResponse<contributions.ContributionItem[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.contributions.getContributions("recipe", { onlyApproved: true });
    return {
      data: response.contributions ?? [],
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch community contributions:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

/**
 * ID ile tek bir topluluk katkısını getirir
 */
export async function getContributionByIdAction(
  id: string
): Promise<ActionResponse<contributions.ContributionItem>> {
  try {
    const client = createBrowserClient();
    const response = await client.contributions.getContributionById(id);
    if (response.contribution) {
      return {
        data: response.contribution,
        error: null,
      };
    }
    return {
      data: null,
      error: "Katkı bulunamadı",
    };
  } catch (error) {
    console.error("Failed to fetch contribution by ID:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Tüm topluluk katkılarını (onay bekleyenler dahil) getirir - Admin Paneli için
 */
export async function getAdminContributionsAction(
  contentType: string
): Promise<ActionResponse<contributions.ContributionItem[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.contributions.getContributions(contentType, { onlyApproved: false });
    return {
      data: response.contributions ?? [],
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch admin contributions:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Bir topluluk katkısını onaylar veya siler - Admin Paneli için
 */
export async function approveContributionAction(
  id: string,
  approved: boolean
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.contributions.approveContribution({ id, approved });
    return {
      data: response.success,
      error: null,
    };
  } catch (error) {
    console.error("Failed to approve contribution:", error);
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
