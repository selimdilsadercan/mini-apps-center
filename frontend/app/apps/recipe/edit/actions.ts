/**
 * Edit Recipe API Service
 * Client-side API calls for recipe editing operations
 */

import { createBrowserClient } from "@/lib/api";
import { isUnauthenticatedError, getErrorMessage } from "@/lib/api-error-handler";
import type { lib } from "@/lib/client";
import { toApiIngredients, toApiInstructions } from "../recipe-api-map";

// Standardized response format
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
 * Tarifi günceller
 */
export async function updateRecipeAction(
  recipeId: string,
  userId: string,
  title: string,
  ingredients: Parameters<typeof toApiIngredients>[0] | lib.Ingredient[] | null,
  instructions: Parameters<typeof toApiInstructions>[0] | lib.Instruction[] | null,
  category?: string | null
): Promise<ActionResponse<lib.Recipe>> {
  try {
    const client = createBrowserClient();
    
    const response = await client.recipe.updateRecipe(recipeId, {
      userId,
      title,
      ingredients: ingredients ? toApiIngredients(ingredients) : null,
      instructions: instructions ? toApiInstructions(instructions) : null,
      category: category || null,
    });
    
    return {
      data: response.recipe,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to update recipe:", error);
    return {
      data: null,
      error: getErrorMessage(error)
    };
  }
}
