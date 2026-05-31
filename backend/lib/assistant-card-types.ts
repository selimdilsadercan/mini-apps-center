export type AssistantCardType =
  | "subcenter"
  | "kiler"
  | "recipe"
  | "concert"
  | "hobby"
  | "chocolate"
  | "memedex"
  | "tournament"
  | "iskambil"
  | "itu-dish"
  | "movie"
  | "friend"
  | "help";

export interface AssistantCard {
  type: AssistantCardType;
  data: Record<string, unknown>;
}

export interface AssistantChatReply {
  content: string;
  cards?: AssistantCard[];
}
