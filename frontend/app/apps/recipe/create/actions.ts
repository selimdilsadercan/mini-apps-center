/**
 * Create Recipe API Service
 * Client-side API calls for recipe creation
 * (Static export compatible - no server actions)
 */

import { createBrowserClient } from "@/lib/api";
import { isUnauthenticatedError, getErrorMessage } from "@/lib/api-error-handler";
import type { lib } from "@/lib/client";
import {
  toApiIngredients,
  toApiInstructions,
  type RecipeIngredientInput,
  type RecipeInstructionInput,
} from "../recipe-api-map";

// Standardized response format
interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Yeni tarif oluşturur
 */
export async function createRecipe(
  title: string,
  userId: string,
  ingredients?: RecipeIngredientInput[] | null,
  instructions?: RecipeInstructionInput[] | null
): Promise<ActionResponse<lib.Recipe>> {
  try {
    const client = createBrowserClient();

    const response = await client.recipe.createRecipe({
      title,
      userId,
      ingredients: ingredients ? toApiIngredients(ingredients) : null,
      instructions: instructions ? toApiInstructions(instructions) : null,
    });
    
    return {
      data: response.recipe,
      error: null
    };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    console.error("Failed to create recipe:", error);
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
