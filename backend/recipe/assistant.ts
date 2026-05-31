import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { recipe } from "~encore/clients";

export const recipeAssistant: AppAssistantModule = {
  appId: "recipe",
  name: "Meal Planner",
  description: "Tarifleri oluşturur ve düzenler.",
  schema: "recipe",
  tools: [
    {
      name: "list_recipes",
      description: "Kullanıcının tariflerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_recipe",
      description: "Yeni tarif oluşturur.",
      permission: "create",
      parameters: {
        title: { type: "string", description: "Tarif adı", required: true },
        ingredients: { type: "array", description: "Malzemeler listesi" },
        instructions: { type: "array", description: "Yapılış adımları" },
      },
    },
    {
      name: "update_recipe",
      description: "Tarifi günceller.",
      permission: "update",
      parameters: {
        id: { type: "string", description: "Tarif id", required: true },
        title: { type: "string", description: "Tarif adı", required: true },
        ingredients: { type: "array", description: "Malzemeler listesi" },
        instructions: { type: "array", description: "Yapılış adımları" },
      },
    },
    {
      name: "delete_recipe",
      description: "Tarifi siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", description: "Tarif id", required: true },
      },
    },
  ],
  executors: {
    list_recipes: async ({ userId }) => {
      const res = await recipe.getUserRecipes({ userId });
      return res.recipes;
    },
    create_recipe: async ({ userId, args }) => {
      const res = await recipe.createRecipe({
        userId,
        title: requireString(args, "title"),
        ingredients: (args.ingredients as any) ?? undefined,
        instructions: (args.instructions as any) ?? undefined,
      });
      return res.recipe ? [res.recipe] : [];
    },
    update_recipe: async ({ userId, args }) => {
      const res = await recipe.updateRecipe({
        recipeId: requireString(args, "id"),
        userId,
        title: requireString(args, "title"),
        ingredients: (args.ingredients as any) ?? null,
        instructions: (args.instructions as any) ?? null,
      });
      return res.recipe ? [res.recipe] : [];
    },
    delete_recipe: async ({ userId, args }) => {
      const res = await recipe.deleteRecipe({
        recipeId: requireString(args, "id"),
        userId,
      });
      return res;
    },
  },
};
