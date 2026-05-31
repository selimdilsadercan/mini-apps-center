import Client, { Local } from "@/lib/client";
import type { AssistantCard, AssistantChatResult } from "@/lib/assistant-cards";

const client = new Client(Local);

export async function sendAssistantChat(params: {
  userId: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AssistantChatResult> {
  const response = await client.ai_assistant.chat({
    userId: params.userId ?? undefined,
    messages: params.messages,
  });
  return {
    content: response.content,
    cards: response.cards as AssistantCard[] | undefined,
  };
}
