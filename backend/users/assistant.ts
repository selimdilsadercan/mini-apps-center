import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import type { AppAssistantModule } from "../lib/assistant-types";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export const usersAssistant: AppAssistantModule = {
  appId: "users",
  name: "Users",
  description: "Kullanıcı tercihlerini (uygulama sırası) günceller.",
  schema: "public",
  tools: [
    {
      name: "get_app_order",
      description: "Kullanıcının ana ekran uygulama sırasını getirir.",
      permission: "read",
      parameters: {},
      execute: async ({ userId }) => {
        return runRpc("get_app_order", async () =>
          await supabase.rpc("get_user_preferences", { clerk_id_param: userId }),
        );
      },
    },
    {
      name: "update_app_order",
      description: "Ana ekrandaki uygulama sırasını günceller.",
      permission: "update",
      parameters: {
        appOrder: {
          type: "array",
          required: true,
          description: "Mini app id listesi",
        },
      },
      execute: async ({ userId, args }) => {
        return runRpc("update_app_order", async () =>
          await supabase.rpc("update_user_app_order", {
            clerk_id_param: userId,
            app_order_param: args.appOrder,
          }),
        );
      },
    },
  ],
};
