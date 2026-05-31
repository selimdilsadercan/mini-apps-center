import type { AppAssistantDefinition } from "../lib/assistant-types";

export const friendshipAssistantDefinition: AppAssistantDefinition = {
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
    },
    {
      name: "list_pending_requests",
      description: "Bekleyen arkadaşlık isteklerini getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "send_friend_request",
      description: "Arkadaşlık isteği gönderir.",
      permission: "create",
      parameters: {
        targetClerkId: { type: "string", required: true, description: "Hedef kullanıcı clerk id" },
      },
    },
    {
      name: "accept_friend_request",
      description: "Arkadaşlık isteğini kabul eder.",
      permission: "update",
      parameters: {
        friendClerkId: { type: "string", required: true, description: "İsteği gönderen clerk id" },
      },
    },
    {
      name: "reject_friend_request",
      description: "Arkadaşlık isteğini reddeder.",
      permission: "update",
      parameters: {
        friendClerkId: { type: "string", required: true, description: "İsteği gönderen clerk id" },
      },
    },
    {
      name: "remove_friend",
      description: "Arkadaşlığı kaldırır.",
      permission: "delete",
      parameters: {
        friendClerkId: { type: "string", required: true, description: "Arkadaş clerk id" },
      },
    },
  ],
};
