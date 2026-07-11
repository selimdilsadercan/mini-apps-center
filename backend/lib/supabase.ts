import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Type definitions
export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
  key?: string;
  optional?: boolean;
  defaultOn?: boolean;
  label?: string;
}

export interface Instruction {
  step: number;
  text: string;
  requires?: string[];
}

export interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
  created_user_id: string;
  ingredients: Ingredient[] | null;
  instructions: Instruction[] | null;
}

export interface RecipeSummary {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role?: string | null;
  created_at: string;
}


// Factory function to create Supabase client (called from services with secrets)
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey);
}
