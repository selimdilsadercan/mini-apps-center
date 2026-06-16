import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import type { AssistantAppCapabilities } from "../lib/assistant-types";
import { AssistantToolError } from "../lib/assistant-tool-error";
import {
  executeAssistantTool,
  listAssistantCapabilities,
} from "./registry";
import { runStaticAssistantChat } from "./static-chat";

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
  user_id: string;
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
  { expose: true, method: "GET", path: "/assistant/conversations/:userId" },
  async ({ userId }: GetConversationsRequest): Promise<GetConversationsResponse> => {
    const { data, error } = await supabase.schema("assistant").rpc("get_conversations", {
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
  { expose: true, method: "POST", path: "/assistant/conversations/upsert" },
  async ({
    userId,
    id,
    title,
    messages,
    createdAt,
  }: UpsertConversationRequest): Promise<UpsertConversationResponse> => {
    const { data, error } = await supabase.schema("assistant").rpc("upsert_conversation", {
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
  { expose: true, method: "DELETE", path: "/assistant/conversations/:id/:userId" },
  async ({ id, userId }: DeleteConversationRequest): Promise<DeleteConversationResponse> => {
    const { data: rpcDeleted, error: rpcError } = await supabase
      .schema("assistant")
      .rpc("delete_conversation", {
        clerk_id_param: userId,
        conversation_id_param: id,
      });

    if (!rpcError && typeof rpcDeleted === "number" && rpcDeleted > 0) {
      return { success: true };
    }

    if (!rpcError && rpcDeleted === true) {
      return { success: true };
    }

    if (rpcError) {
      console.warn("delete_conversation RPC failed:", rpcError.message);
      throw APIError.internal(`Failed to delete conversation: ${rpcError.message}`);
    }

    if (rpcDeleted === 0 || rpcDeleted === false) {
      throw APIError.notFound("Conversation not found");
    }

    return { success: true };
  },
);

interface GetCapabilitiesResponse {
  apps: AssistantAppCapabilities[];
}

export const getCapabilities = api(
  { expose: true, method: "GET", path: "/assistant/capabilities" },
  async (): Promise<GetCapabilitiesResponse> => {
    return { apps: listAssistantCapabilities() };
  },
);

interface ExecuteToolRequest {
  userId: string;
  appId: string;
  toolName: string;
  args?: Record<string, unknown>;
}

interface ExecuteToolResponse {
  result: unknown;
}

export const executeTool = api(
  { expose: true, method: "POST", path: "/assistant/tools/execute" },
  async ({
    userId,
    appId,
    toolName,
    args,
  }: ExecuteToolRequest): Promise<ExecuteToolResponse> => {
    try {
      const result = await executeAssistantTool({
        userId,
        appId,
        toolName,
        args: args ?? {},
      });
      return { result };
    } catch (error) {
      if (error instanceof AssistantToolError) {
        throw APIError.invalidArgument(error.message);
      }
      throw error;
    }
  },
);

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  userId?: string;
  messages: ChatMessageInput[];
}

interface AssistantCardPayload {
  type: string;
  data: Record<string, unknown>;
}

interface ChatResponse {
  content: string;
  cards?: AssistantCardPayload[];
}

export const chat = api(
  { expose: true, method: "POST", path: "/assistant/chat" },
  async ({ userId, messages }: ChatRequest): Promise<ChatResponse> => {
    if (!messages?.length) {
      throw APIError.invalidArgument("En az bir mesaj gerekli");
    }

    const last = messages[messages.length - 1];
    if (last.role !== "user" || !last.content.trim()) {
      throw APIError.invalidArgument("Son mesaj kullanıcıdan olmalı");
    }

    try {
      const result = await runStaticAssistantChat({
        userId: userId?.trim() || null,
        messages,
      });
      return { content: result.content, cards: result.cards };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sohbet yanıtı oluşturulamadı";
      console.error("chat error:", error);
      throw APIError.internal(message);
    }
  },
);
