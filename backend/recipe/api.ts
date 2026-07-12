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
  category?: string | null;
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

export interface MealPlanMeal {
  id: string;
  title: string;
  recipeId?: string;
  mealType: "breakfast" | "lunch" | "dinner";
}

type MealPlanData = Record<string, MealPlanMeal[]>;

interface GetMealPlanRequest {
  userId: string;
}

interface GetMealPlanResponse {
  plan: MealPlanData;
}

interface SetMealPlanRequest {
  userId: string;
  plan: MealPlanData;
}

interface SetMealPlanResponse {
  success: boolean;
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
  async ({ title, userId, ingredients, instructions, category }: CreateRecipeRequest): Promise<CreateRecipeResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("create", {
      title_param: title,
      p_user_id: userId,
      ingredients_param: ingredients || [],
      instructions_param: instructions || [],
      category_param: category || null,
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
        category: row.category,
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
        category: row.category,
        created_at: row.created_at,
        created_user_id: row.created_user_id,
        ingredients: row.ingredients,
        instructions: row.instructions,
      } : null 
    };
  }
);

/**
 * Kullanıcının yemek planını getirir
 * GET /recipe/plan/:userId
 */
export const getMealPlan = api(
  { expose: true, method: "GET", path: "/recipe/plan/:userId" },
  async ({ userId }: GetMealPlanRequest): Promise<GetMealPlanResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("get_plan", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getMealPlan error:", error);
      throw APIError.internal("Yemek plani yuklenemedi");
    }

    const rows = (data ?? []) as Array<{
      id: string;
      day_key: string;
      title: string;
      meal_type: string | null;
      recipe_id: string | null;
    }>;

    const plan: MealPlanData = {};
    for (const row of rows) {
      const dayMeals = plan[row.day_key] ?? [];
      dayMeals.push({
        id: row.id,
        title: row.title,
        mealType:
          row.meal_type === "breakfast" || row.meal_type === "lunch" || row.meal_type === "dinner"
            ? row.meal_type
            : "dinner",
        recipeId: row.recipe_id ?? undefined,
      });
      plan[row.day_key] = dayMeals;
    }

    return { plan };
  }
);

/**
 * Bugünün yemek planını getirir
 */
export const getTodayMeals = api(
  { expose: true, method: "GET", path: "/recipe/today/:userId" },
  async ({ userId }: { userId: string }): Promise<{ meals: MealPlanMeal[] }> => {
    const { plan } = await getMealPlan({ userId });
    
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const todayKey = `${y}-${m}-${d}`;
    
    return { meals: plan[todayKey] ?? [] };
  }
);

/**
 * Kullanıcının yemek planını tam olarak günceller
 * PUT /recipe/plan/:userId
 */
export const setMealPlan = api(
  { expose: true, method: "PUT", path: "/recipe/plan/:userId" },
  async ({ userId, plan }: SetMealPlanRequest): Promise<SetMealPlanResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("set_plan", {
      p_user_id: userId,
      plan_data: plan ?? {},
    });

    if (error) {
      console.error("setMealPlan error:", error);
      throw APIError.internal("Yemek plani kaydedilemedi");
    }

    return { success: Boolean(data) };
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
  category?: string | null;
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
  async ({ recipeId, userId, title, ingredients, instructions, category }: UpdateRecipeRequest): Promise<UpdateRecipeResponse> => {
    const { data, error } = await supabase.schema("recipe").rpc("update", {
      recipe_id_param: recipeId,
      p_user_id: userId,
      title_param: title,
      ingredients_param: ingredients || [],
      instructions_param: instructions || [],
      category_param: category || null,
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
        category: row.category,
        created_at: row.created_at,
        created_user_id: row.created_user_id,
        ingredients: row.ingredients,
        instructions: row.instructions,
      }
    };
  }
);
