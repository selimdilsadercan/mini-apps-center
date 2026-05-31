import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface DbConversation {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  created_at: string;
  updated_at: string;
}

function mapConversation(row: DbConversation): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: row.messages ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface GetConversationsRequest {
  userId: string;
}

interface GetConversationsResponse {
  conversations: Conversation[];
}

interface UpsertConversationRequest {
  userId: string;
  id: string;
  title: string;
  messages: StoredChatMessage[];
  createdAt?: string;
}

interface UpsertConversationResponse {
  conversation: Conversation;
}

interface DeleteConversationRequest {
  userId: string;
  id: string;
}

interface DeleteConversationResponse {
  success: boolean;
}

export const getConversations = api(
  { expose: true, method: "GET", path: "/ai-assistant/conversations/:userId" },
  async ({ userId }: GetConversationsRequest): Promise<GetConversationsResponse> => {
    const { data, error } = await supabase.schema("ai_assistant").rpc("get_conversations", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getConversations error:", error);
      throw APIError.internal(`Failed to load conversations: ${error.message}`);
    }

    const conversations = (data as DbConversation[] | null)?.map(mapConversation) ?? [];
    return { conversations };
  },
);

export const upsertConversation = api(
  { expose: true, method: "POST", path: "/ai-assistant/conversations/upsert" },
  async ({
    userId,
    id,
    title,
    messages,
    createdAt,
  }: UpsertConversationRequest): Promise<UpsertConversationResponse> => {
    const { data, error } = await supabase.schema("ai_assistant").rpc("upsert_conversation", {
      clerk_id_param: userId,
      conversation_id_param: id,
      title_param: title,
      messages_param: messages,
      created_at_param: createdAt ?? null,
    });

    if (error) {
      console.error("upsertConversation error:", error);
      throw APIError.internal(`Failed to save conversation: ${error.message}`);
    }

    if (!data) {
      throw APIError.internal("Failed to save conversation");
    }

    return { conversation: mapConversation(data as DbConversation) };
  },
);

export const deleteConversation = api(
  { expose: true, method: "DELETE", path: "/ai-assistant/conversations/:id/:userId" },
  async ({ id, userId }: DeleteConversationRequest): Promise<DeleteConversationResponse> => {
    const { data, error } = await supabase.schema("ai_assistant").rpc("delete_conversation", {
      clerk_id_param: userId,
      conversation_id_param: id,
    });

    if (error) {
      console.error("deleteConversation error:", error);
      throw APIError.internal(`Failed to delete conversation: ${error.message}`);
    }

    return { success: !!data };
  },
);
