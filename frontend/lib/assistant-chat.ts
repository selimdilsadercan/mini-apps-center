import { createBrowserClient } from "@/lib/api";
import type { AssistantCard, AssistantChatResult } from "@/lib/assistant-cards";

const client = createBrowserClient();

export async function sendAssistantChat(params: {
  userId: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AssistantChatResult> {
  const response = await client.assistant.chat({
    userId: params.userId ?? undefined,
    messages: params.messages,
  });
  return {
    content: response.content,
    cards: response.cards as AssistantCard[] | undefined,
  };
}
