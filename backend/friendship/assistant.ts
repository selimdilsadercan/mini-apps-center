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

export const friendshipAssistant: AppAssistantModule = {
  appId: "friendship",
  name: "Friends",
  description: "Arkadaşlık isteklerini ve arkadaş listesini yönetir.",
  schema: "friendship",
  tools: [
    {
      name: "list_friends",
      description: "Arkadaş listesini getirir.",
      permission: "read",
      parameters: {},
      execute: async ({ userId }) => {
        return runRpc("list_friends", async () =>
          await supabase.rpc("get_friends", { clerk_id_param: userId }),
        );
      },
    },
    {
      name: "list_pending_requests",
      description: "Bekleyen arkadaşlık isteklerini getirir.",
      permission: "read",
      parameters: {},
      execute: async ({ userId }) => {
        return runRpc("list_pending_requests", async () =>
          await supabase.rpc("get_pending_requests", { clerk_id_param: userId }),
        );
      },
    },
    {
      name: "send_friend_request",
      description: "Arkadaşlık isteği gönderir.",
      permission: "create",
      parameters: {
        targetClerkId: { type: "string", required: true, description: "Hedef kullanıcı clerk id" },
      },
      execute: async ({ userId, args }) => {
        return runRpc("send_friend_request", async () =>
          await supabase.rpc("send_friend_request", {
            sender_clerk_id: userId,
            receiver_clerk_id: requireString(args, "targetClerkId"),
          }),
        );
      },
    },
    {
      name: "accept_friend_request",
      description: "Arkadaşlık isteğini kabul eder.",
      permission: "update",
      parameters: {
        friendClerkId: { type: "string", required: true, description: "İsteği gönderen clerk id" },
      },
      execute: async ({ userId, args }) => {
        return runRpc("accept_friend_request", async () =>
          await supabase.rpc("accept_friend_request", {
            receiver_clerk_id: userId,
            sender_clerk_id: requireString(args, "friendClerkId"),
          }),
        );
      },
    },
    {
      name: "reject_friend_request",
      description: "Arkadaşlık isteğini reddeder.",
      permission: "update",
      parameters: {
        friendClerkId: { type: "string", required: true, description: "İsteği gönderen clerk id" },
      },
      execute: async ({ userId, args }) => {
        return runRpc("reject_friend_request", async () =>
          await supabase.rpc("reject_friend_request", {
            receiver_clerk_id: userId,
            sender_clerk_id: requireString(args, "friendClerkId"),
          }),
        );
      },
    },
    {
      name: "remove_friend",
      description: "Arkadaşlığı kaldırır.",
      permission: "delete",
      parameters: {
        friendClerkId: { type: "string", required: true, description: "Arkadaş clerk id" },
      },
      execute: async ({ userId, args }) => {
        return runRpc("remove_friend", async () =>
          await supabase.rpc("remove_friend", {
            user_clerk_id: userId,
            friend_clerk_id: requireString(args, "friendClerkId"),
          }),
        );
      },
    },
  ],
};
