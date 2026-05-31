import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
const db = supabase.schema("map_tracker");

export const mapTrackerAssistant: AppAssistantModule = {
  appId: "map-tracker",
  name: "Harita Takip",
  description: "Harita listelerini ve ziyaret durumunu yönetir.",
  schema: "map_tracker",
  tools: [
    {
      name: "get_data",
      description: "Tüm listeleri ve mekanları getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "import_items",
      description: "Yeni liste ve mekanları içe aktarır.",
      permission: "create",
      parameters: {
        listName: { type: "string", required: true, description: "Liste adı" },
        items: { type: "array", required: true, description: "Mekanlar" },
      },
    },
    {
      name: "toggle_visited",
      description: "Mekanın ziyaret edildi durumunu değiştirir.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Mekan id" },
      },
    },
  ],
  executors: {
    get_data: async () => {
      return runRpc("get_data", async () => await db.rpc("get_data"));
    },
    import_items: async ({ args }) => {
      return runRpc("import_items", async () =>
        await db.rpc("import_items", {
          p_list_name: requireString(args, "listName"),
          p_items: args.items,
        }),
      );
    },
    toggle_visited: async ({ args }) => {
      return runRpc("toggle_visited", async () =>
        await db.rpc("toggle_visited", { p_id: requireString(args, "id") }),
      );
    },
  },
};
