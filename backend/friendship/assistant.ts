import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { friendship } from "~encore/clients";

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
  executors: {
    list_friends: async ({ userId }) => {
      const res = await friendship.getFriends({ userId });
      return res.friends;
    },
    list_pending_requests: async ({ userId }) => {
      const res = await friendship.getPendingRequests({ userId });
      return res.requests;
    },
    send_friend_request: async ({ userId, args }) => {
      const res = await friendship.sendRequest({
        senderId: userId,
        receiverId: requireString(args, "targetClerkId"),
      });
      return res;
    },
    accept_friend_request: async ({ userId, args }) => {
      const res = await friendship.acceptRequest({
        userId,
        friendId: requireString(args, "friendClerkId"),
      });
      return res;
    },
    reject_friend_request: async ({ userId, args }) => {
      const res = await friendship.rejectRequest({
        userId,
        friendId: requireString(args, "friendClerkId"),
      });
      return res;
    },
    remove_friend: async ({ userId, args }) => {
      const res = await friendship.removeFriend({
        userId,
        friendId: requireString(args, "friendClerkId"),
      });
      return res;
    },
  },
};
