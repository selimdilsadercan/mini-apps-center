import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import {
  optionalNumber,
  optionalString,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
const db = supabase.schema("concert_list");

export const concertListAssistant: AppAssistantModule = {
  appId: "concert-list",
  name: "My Concert List",
  description: "Konser kayıtlarını yönetir.",
  schema: "concert_list",
  tools: [
    {
      name: "list_concerts",
      description: "Kullanıcının konser listesini getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_concert",
      description: "Yeni konser ekler.",
      permission: "create",
      parameters: {
        artist: { type: "string", description: "Sanatçı", required: true },
        date: { type: "string", description: "YYYY-MM-DD", required: true },
        venue: { type: "string", description: "Mekan" },
        notes: { type: "string", description: "Notlar" },
        rating: { type: "number", description: "1-5 puan" },
      },
    },
    {
      name: "delete_concert",
      description: "Konser kaydını siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", description: "Konser id", required: true },
      },
    },
  ],
  executors: {
    list_concerts: async ({ userId }) => {
      return runRpc("list_concerts", async () =>
        await db.rpc("get_concerts", { clerk_id_param: userId }),
      );
    },
    add_concert: async ({ userId, args }) => {
      return runRpc("add_concert", async () =>
        await db.rpc("add_concert", {
          clerk_id_param: userId,
          artist_param: requireString(args, "artist"),
          date_param: requireString(args, "date"),
          venue_param: optionalString(args, "venue"),
          notes_param: optionalString(args, "notes"),
          rating_param: optionalNumber(args, "rating"),
        }),
      );
    },
    delete_concert: async ({ userId, args }) => {
      return runRpc("delete_concert", async () =>
        await db.rpc("delete_concert", {
          clerk_id_param: userId,
          concert_id_param: requireString(args, "id"),
        }),
      );
    },
  },
};
