import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient, Recipe, RecipeSummary, Ingredient, Instruction } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetUserRecipesRequest {
  userId: string;
}

interface GetUserRecipesResponse {
  recipes: RecipeSummary[];
}

interface CreateRecipeRequest {
  title: string;
  userId: string;
  ingredients?: Ingredient[] | null;
  instructions?: Instruction[] | null;
}

interface CreateRecipeResponse {
  recipe: Recipe | null;
}

interface GetRecipeByIdRequest {
  recipeId: string;
}

interface GetRecipeByIdResponse {
  recipe: Recipe | null;
}

// ==================== API ENDPOINTS ====================

/**
 * Belirli kullanıcının tariflerini getirir
 * GET /recipe/user/:userId
 */
export const getUserRecipes = api(
  { expose: true, method: "GET", path: "/recipe/user/:userId" },
  async ({ userId }: GetUserRecipesRequest): Promise<GetUserRecipesResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("get_user_recipes", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getUserRecipes error:", error);
      throw APIError.internal("Tarifler yüklenemedi");
    }

    return { recipes: data || [] };
  }
);

/**
 * Yeni tarif oluşturur
 * POST /recipe/create
 */
export const createRecipe = api(
  { expose: true, method: "POST", path: "/recipe/create" },
  async ({ title, userId, ingredients, instructions }: CreateRecipeRequest): Promise<CreateRecipeResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("create", {
      title_param: title,
      p_user_id: userId,
      ingredients_param: ingredients || [],
      instructions_param: instructions || [],
    });

    if (error) {
      console.error("createRecipe error:", error);
      throw APIError.internal("Tarif oluşturulamadı");
    }

    const row = data as any;
    return { 
      recipe: row ? {
        id: row.id,
        title: row.title,
        image_url: row.image_url,
        created_at: row.created_at,
        created_user_id: row.created_user_id,
        ingredients: row.ingredients,
        instructions: row.instructions,
      } : null 
    };
  }
);

/**
 * Tek bir tarifin tüm detaylarını getirir
 * GET /recipe/:recipeId
 */
export const getRecipeById = api(
  { expose: true, method: "GET", path: "/recipe/:recipeId" },
  async ({ recipeId }: GetRecipeByIdRequest): Promise<GetRecipeByIdResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("get", {
      recipe_id_param: recipeId,
    });

    if (error) {
      console.error("getRecipeById error:", error);
      return { recipe: null };
    }

    const row = (data as any[])?.[0];
    return { 
      recipe: row ? {
        id: row.id,
        title: row.title,
        image_url: row.image_url,
        created_at: row.created_at,
        created_user_id: row.created_user_id,
        ingredients: row.ingredients,
        instructions: row.instructions,
      } : null 
    };
  }
);

// ==================== DELETE RECIPE ====================

interface DeleteRecipeRequest {
  recipeId: string;
  userId: string;
}

interface DeleteRecipeResponse {
  success: boolean;
}

/**
 * Tarif siler
 * DELETE /recipe/:recipeId
 */
export const deleteRecipe = api(
  { expose: true, method: "DELETE", path: "/recipe/:recipeId" },
  async ({ recipeId, userId }: DeleteRecipeRequest): Promise<DeleteRecipeResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("delete", {
      recipe_id_param: recipeId,
      p_user_id: userId,
    });

    if (error) {
      console.error("deleteRecipe error:", error);
      throw APIError.internal("Tarif silinemedi");
    }

    if (!data) {
      throw APIError.permissionDenied("Bu tarifi silme yetkiniz yok");
    }

    return { success: true };
  }
);

// ==================== UPDATE RECIPE ====================

interface UpdateRecipeRequest {
  recipeId: string;
  userId: string;
  title: string;
  ingredients: Ingredient[] | null;
  instructions: Instruction[] | null;
}

interface UpdateRecipeResponse {
  recipe: Recipe | null;
}

/**
 * Tarifi günceller
 * PUT /recipe/:recipeId
 */
export const updateRecipe = api(
  { expose: true, method: "PUT", path: "/recipe/:recipeId" },
  async ({ recipeId, userId, title, ingredients, instructions }: UpdateRecipeRequest): Promise<UpdateRecipeResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("update", {
      recipe_id_param: recipeId,
      p_user_id: userId,
      title_param: title,
      ingredients_param: ingredients || [],
      instructions_param: instructions || [],
    });

    if (error) {
      console.error("updateRecipe error:", error);
      throw APIError.internal("Tarif güncellenemedi");
    }

    const row = data as any;
    if (!row) {
      throw APIError.permissionDenied("Bu tarifi güncelleme yetkiniz yok");
    }

    return { 
      recipe: {
        id: row.id,
        title: row.title,
        image_url: row.image_url,
        created_at: row.created_at,
        created_user_id: row.created_user_id,
        ingredients: row.ingredients,
        instructions: row.instructions,
      }
    };
  }
);
