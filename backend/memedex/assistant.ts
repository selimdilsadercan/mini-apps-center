import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import {
  optionalString,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
const db = supabase.schema("memedex");

export const memedexAssistant: AppAssistantModule = {
  appId: "memedex",
  name: "Memedex",
  description: "Meme kayıtlarını yönetir.",
  schema: "memedex",
  tools: [
    {
      name: "list_memes",
      description: "Meme listesini getirir.",
      permission: "read",
      parameters: {
        search: { type: "string", description: "Arama metni" },
      },
    },
    {
      name: "create_meme",
      description: "Yeni meme ekler.",
      permission: "create",
      parameters: {
        title: { type: "string", required: true, description: "Başlık" },
        description: { type: "string", description: "Açıklama" },
        context: { type: "string", description: "Bağlam" },
        example: { type: "string", description: "Örnek kullanım" },
        trendStatus: { type: "string", description: "Trend durumu" },
        mediaUrl: { type: "string", description: "Medya URL" },
        tags: { type: "array", description: "Etiketler" },
      },
    },
    {
      name: "update_meme",
      description: "Meme günceller.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
        title: { type: "string", required: true, description: "Başlık" },
        trendStatus: { type: "string", required: true, description: "Trend" },
        mediaUrl: { type: "string", required: true, description: "Medya URL" },
      },
    },
    {
      name: "delete_meme",
      description: "Meme siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
      },
    },
    {
      name: "like_meme",
      description: "Meme beğenir.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
      },
    },
  ],
  executors: {
    list_memes: async ({ args }) => {
      return runRpc("list_memes", async () =>
        await db.rpc("get_memes", {
          search_param: optionalString(args, "search") ?? "",
          tag_param: "",
          trend_param: "",
          parent_id_param: null,
          only_parents_param: true,
          limit_param: 32,
          offset_param: 0,
        }),
      );
    },
    create_meme: async ({ userId, args }) => {
      return runRpc("create_meme", async () =>
        await db.rpc("create_meme", {
          title_param: requireString(args, "title"),
          description_param: optionalString(args, "description") ?? "",
          context_param: optionalString(args, "context") ?? "",
          example_param: optionalString(args, "example") ?? "",
          trend_status_param: optionalString(args, "trendStatus") ?? "stable",
          media_url_param: optionalString(args, "mediaUrl") ?? "",
          tags_param: args.tags ?? [],
          created_by_param: userId,
          parent_id_param: null,
        }),
      );
    },
    update_meme: async ({ args }) => {
      return runRpc("update_meme", async () =>
        await db.rpc("update_meme", {
          id_param: requireString(args, "id"),
          title_param: requireString(args, "title"),
          trend_status_param: requireString(args, "trendStatus"),
          media_url_param: requireString(args, "mediaUrl"),
        }),
      );
    },
    delete_meme: async ({ args }) => {
      return runRpc("delete_meme", async () =>
        await db.rpc("delete_meme", { id_param: requireString(args, "id") }),
      );
    },
    like_meme: async ({ args }) => {
      return runRpc("like_meme", async () =>
        await db.rpc("like_meme", { id_param: requireString(args, "id") }),
      );
    },
  },
};
