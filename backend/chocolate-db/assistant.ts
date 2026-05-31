import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import {
  optionalString,
  requireNumber,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
const db = supabase.schema("chocolate_db");

export const chocolateDbAssistant: AppAssistantModule = {
  appId: "chocolate-db",
  name: "ChocolateDB",
  description: "Çikolata puanları ve kullanıcı durumlarını yönetir.",
  schema: "chocolate_db",
  tools: [
    {
      name: "list_chocolates",
      description: "Çikolata kataloğunu listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "set_user_state",
      description: "Çikolata için kullanıcı durumu ayarlar (tried, wishlist, dislike).",
      permission: "update",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata slug/id" },
        state: {
          type: "string",
          description: "tried | wishlist | dislike | boş string ile temizle",
        },
      },
    },
    {
      name: "add_review",
      description: "Çikolataya yorum ekler.",
      permission: "create",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata id" },
        rating: { type: "number", required: true, description: "1-5" },
        comment: { type: "string", description: "Yorum" },
        reviewerName: { type: "string", description: "İsim" },
      },
    },
    {
      name: "delete_review",
      description: "Kullanıcının çikolata yorumunu siler.",
      permission: "delete",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata id" },
      },
    },
  ],
  executors: {
    list_chocolates: async ({ userId }) => {
      return runRpc("list_chocolates", async () =>
        await db.rpc("get_chocolates", { p_clerk_id: userId }),
      );
    },
    set_user_state: async ({ userId, args }) => {
      return runRpc("set_user_state", async () =>
        await db.rpc("set_user_state", {
          p_clerk_id: userId,
          p_chocolate_id: requireString(args, "chocolateId"),
          p_state: optionalString(args, "state"),
        }),
      );
    },
    add_review: async ({ userId, args }) => {
      return runRpc("add_review", async () =>
        await db.rpc("add_review", {
          p_chocolate_id: requireString(args, "chocolateId"),
          p_rating: requireNumber(args, "rating"),
          p_comment: optionalString(args, "comment"),
          p_reviewer_name: optionalString(args, "reviewerName") ?? "Anonim",
          p_clerk_id: userId,
        }),
      );
    },
    delete_review: async ({ userId, args }) => {
      return runRpc("delete_review", async () =>
        await db.rpc("delete_review", {
          p_chocolate_id: requireString(args, "chocolateId"),
          p_clerk_id: userId,
        }),
      );
    },
  },
};
