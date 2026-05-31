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
  type: AssistantCardType | string;
  data: Record<string, unknown>;
}

export interface AssistantChatResult {
  content: string;
  cards?: AssistantCard[];
}
