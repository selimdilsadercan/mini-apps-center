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
const db = supabase.schema("hobby_center");

export const hobbyCenterAssistant: AppAssistantModule = {
  appId: "hobby-center",
  name: "Hobby Center",
  description: "Hobi ilerlemesini günceller.",
  schema: "hobby_center",
  tools: [
    {
      name: "list_hobbies",
      description: "Kullanıcının hobi kayıtlarını listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "update_hobby",
      description: "Hobi durumunu ve notları günceller.",
      permission: "update",
      parameters: {
        hobbyId: { type: "string", required: true, description: "Hobi id" },
        status: {
          type: "string",
          required: true,
          description: "interested | in_progress | learned",
        },
        notes: { type: "string", required: true, description: "Notlar" },
        completedSteps: {
          type: "array",
          required: true,
          description: "Tamamlanan adım numaraları",
        },
      },
    },
  ],
  executors: {
    list_hobbies: async ({ userId }) => {
      return runRpc("list_hobbies", async () =>
        await db.rpc("get_user_hobbies", { clerk_id_param: userId }),
      );
    },
    update_hobby: async ({ userId, args }) => {
      return runRpc("update_hobby", async () =>
        await db.rpc("update_user_hobby", {
          clerk_id_param: userId,
          hobby_id_param: requireString(args, "hobbyId"),
          status_param: requireString(args, "status"),
          notes_param: requireString(args, "notes"),
          completed_steps_param: args.completedSteps ?? [],
        }),
      );
    },
  },
};
