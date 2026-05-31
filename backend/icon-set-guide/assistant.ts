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
const db = supabase.schema("icon_set_guide");

export const iconSetGuideAssistant: AppAssistantModule = {
  appId: "icon-set-guide",
  name: "Icon Set Guide",
  description: "İkon seti favorilerini yönetir.",
  schema: "icon_set_guide",
  tools: [
    {
      name: "list_icon_sets",
      description: "İkon setlerini listeler.",
      permission: "read",
      parameters: {},
      execute: async ({ userId }) => {
        return runRpc("list_icon_sets", async () =>
          await db.rpc("get_icon_sets", { clerk_id_param: userId }),
        );
      },
    },
    {
      name: "toggle_favorite",
      description: "İkon setini favorilere ekler/çıkarır.",
      permission: "update",
      parameters: {
        iconSetId: { type: "string", required: true, description: "İkon seti id" },
      },
      execute: async ({ userId, args }) => {
        return runRpc("toggle_favorite", async () =>
          await db.rpc("toggle_favorite", {
            clerk_id_param: userId,
            icon_set_id_param: requireString(args, "iconSetId"),
          }),
        );
      },
    },
  ],
};
