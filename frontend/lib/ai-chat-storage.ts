import Client, { Local } from "@/lib/client";
import type { AssistantCard } from "@/lib/assistant-cards";

const client = new Client(Local);

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  cards?: AssistantCard[];
}

export interface SavedConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    cards?: AssistantCard[];
  }>;
  createdAt: string;
  updatedAt: string;
}

const CONVERSATIONS_KEY = "ai-assistant-conversations";
const ACTIVE_CHAT_KEY = "ai-assistant-active-id";

/** Silinen sohbetlerin persist ile tekrar oluşmasını engeller */
const recentlyDeletedIds = new Set<string>();

function markConversationDeleted(id: string): void {
  recentlyDeletedIds.add(id);
  window.setTimeout(() => recentlyDeletedIds.delete(id), 10_000);
}

export function isConversationDeleted(id: string): boolean {
  return recentlyDeletedIds.has(id);
}

export function createConversationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function hasUserMessages(messages: ChatMessage[]): boolean {
  return messages.some((m) => m.role === "user");
}

export function getConversationTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Yeni sohbet";
  const text = firstUser.content.trim();
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

function sortByCreatedAt(conversations: SavedConversation[]): SavedConversation[] {
  return [...conversations].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function loadConversationsLocal(): SavedConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = (JSON.parse(raw) as SavedConversation[]).map((c) => ({
      ...c,
      createdAt: c.createdAt ?? c.updatedAt,
    }));
    return sortByCreatedAt(parsed);
  } catch {
    return [];
  }
}

function saveConversationsLocal(conversations: SavedConversation[]): SavedConversation[] {
  const sorted = sortByCreatedAt(conversations);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(sorted));
  return sorted;
}

export function getActiveChatId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_CHAT_KEY);
}

export function setActiveChatId(id: string): void {
  sessionStorage.setItem(ACTIVE_CHAT_KEY, id);
}

export function serializeMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp.toISOString(),
    ...(m.cards?.length ? { cards: m.cards } : {}),
  }));
}

export function deserializeMessages(
  stored: SavedConversation["messages"],
): ChatMessage[] {
  return stored.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
    cards: (m as { cards?: AssistantCard[] }).cards,
  }));
}

async function loadConversationsFromApi(
  userId: string,
): Promise<SavedConversation[]> {
  const { conversations } = await client.ai_assistant.getConversations(userId);
  return sortByCreatedAt(
    conversations.map((c) => ({
      id: c.id,
      title: c.title,
      messages: c.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  );
}

export async function loadConversations(
  userId?: string | null,
): Promise<SavedConversation[]> {
  if (userId) {
    try {
      return await loadConversationsFromApi(userId);
    } catch (error) {
      console.error("loadConversations from API failed:", error);
    }
  }
  return loadConversationsLocal();
}

export async function upsertConversation(
  id: string,
  messages: ChatMessage[],
  userId?: string | null,
): Promise<SavedConversation[]> {
  if (isConversationDeleted(id)) {
    return loadConversations(userId);
  }

  if (!hasUserMessages(messages)) {
    return loadConversations(userId);
  }

  const conversations = await loadConversations(userId);
  const existing = conversations.find((c) => c.id === id);
  const serialized = serializeMessages(messages);
  const contentUnchanged =
    existing !== undefined &&
    JSON.stringify(existing.messages) === JSON.stringify(serialized);

  if (contentUnchanged) {
    return conversations;
  }

  const now = new Date().toISOString();
  const entry: SavedConversation = {
    id,
    title: getConversationTitle(messages),
    messages: serialized,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (userId) {
    try {
      await client.ai_assistant.upsertConversation({
        userId,
        id: entry.id,
        title: entry.title,
        messages: entry.messages,
        createdAt: entry.createdAt,
      });
      const next = existing
        ? conversations.map((c) => (c.id === id ? entry : c))
        : [...conversations, entry];
      return sortByCreatedAt(next);
    } catch (error) {
      console.error("upsertConversation to API failed:", error);
    }
  }

  const next = existing
    ? conversations.map((c) => (c.id === id ? entry : c))
    : [...conversations, entry];
  return saveConversationsLocal(next);
}

export async function getConversationById(
  id: string,
  userId?: string | null,
): Promise<SavedConversation | undefined> {
  const conversations = await loadConversations(userId);
  return conversations.find((c) => c.id === id);
}

export async function deleteConversation(
  id: string,
  userId?: string | null,
): Promise<SavedConversation[]> {
  markConversationDeleted(id);

  const localWithout = loadConversationsLocal().filter((c) => c.id !== id);
  saveConversationsLocal(localWithout);

  if (getActiveChatId() === id) {
    sessionStorage.removeItem(ACTIVE_CHAT_KEY);
  }

  if (userId) {
    await client.ai_assistant.deleteConversation(id, userId);
    return await loadConversationsFromApi(userId);
  }

  return localWithout;
}
