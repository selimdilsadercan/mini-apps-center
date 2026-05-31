import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

let client: ReturnType<typeof createSupabaseClient> | null = null;

export function getAssistantSupabase() {
  if (!client) {
    client = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
  }
  return client;
}
