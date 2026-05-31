import {
  optionalString,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { memedex } from "~encore/clients";

export const memedexAssistant: AppAssistantModule = {
  appId: "memedex",
  name: "Memedex",
  description: "Meme kayıtlarını yönetir.",
  schema: "memedex",
  tools: [
    {
      name: "list_memes",
      description: "Meme listesini getirir.",
      permission: "read",
      parameters: {
        search: { type: "string", description: "Arama metni" },
      },
    },
    {
      name: "create_meme",
      description: "Yeni meme ekler.",
      permission: "create",
      parameters: {
        title: { type: "string", required: true, description: "Başlık" },
        description: { type: "string", description: "Açıklama" },
        context: { type: "string", description: "Bağlam" },
        example: { type: "string", description: "Örnek kullanım" },
        trendStatus: { type: "string", description: "Trend durumu" },
        mediaUrl: { type: "string", description: "Medya URL" },
        tags: { type: "array", description: "Etiketler" },
      },
    },
    {
      name: "update_meme",
      description: "Meme günceller.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
        title: { type: "string", required: true, description: "Başlık" },
        trendStatus: { type: "string", required: true, description: "Trend" },
        mediaUrl: { type: "string", required: true, description: "Medya URL" },
      },
    },
    {
      name: "delete_meme",
      description: "Meme siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
      },
    },
    {
      name: "like_meme",
      description: "Meme beğenir.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Meme id" },
      },
    },
  ],
  executors: {
    list_memes: async ({ args }) => {
      const res = await memedex.getMemes({
        search: optionalString(args, "search") ?? "",
        tag: "",
        trend: "",
        parentId: undefined,
        onlyParents: true,
        limit: 32,
        offset: 0,
      });
      return res.memes;
    },
    create_meme: async ({ userId, args }) => {
      const res = await memedex.createMeme({
        title: requireString(args, "title"),
        description: optionalString(args, "description") ?? "",
        context: optionalString(args, "context") ?? "",
        example: optionalString(args, "example") ?? "",
        trendStatus: (optionalString(args, "trendStatus") as any) ?? "stable",
        mediaUrl: optionalString(args, "mediaUrl") ?? "",
        tags: (args.tags as any) ?? [],
        createdBy: userId,
        parentId: undefined,
      });
      return res.meme ? [res.meme] : [];
    },
    update_meme: async ({ args }) => {
      const res = await memedex.updateMeme({
        id: requireString(args, "id"),
        title: requireString(args, "title"),
        trendStatus: requireString(args, "trendStatus") as any,
        mediaUrl: requireString(args, "mediaUrl"),
      });
      return res.meme ? [res.meme] : [];
    },
    delete_meme: async ({ args }) => {
      const res = await memedex.deleteMeme({
        id: requireString(args, "id"),
      });
      return res;
    },
    like_meme: async ({ args }) => {
      const res = await memedex.likeMeme({
        id: requireString(args, "id"),
      });
      return res;
    },
  },
};
