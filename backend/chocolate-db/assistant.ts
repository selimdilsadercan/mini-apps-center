import {
  optionalString,
  requireNumber,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { chocolate_db } from "~encore/clients";

export const chocolateDbAssistant: AppAssistantModule = {
  appId: "chocolate-db",
  name: "ChocolateDB",
  description: "Çikolata puanları ve kullanıcı durumlarını yönetir.",
  schema: "chocolate_db",
  tools: [
    {
      name: "list_chocolates",
      description: "Çikolata kataloğunu listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "set_user_state",
      description: "Çikolata için kullanıcı durumu ayarlar (tried, wishlist, dislike).",
      permission: "update",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata slug/id" },
        state: {
          type: "string",
          description: "tried | wishlist | dislike | boş string ile temizle",
        },
      },
    },
    {
      name: "add_review",
      description: "Çikolataya yorum ekler.",
      permission: "create",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata id" },
        rating: { type: "number", required: true, description: "1-5" },
        comment: { type: "string", description: "Yorum" },
        reviewerName: { type: "string", description: "İsim" },
      },
    },
    {
      name: "delete_review",
      description: "Kullanıcının çikolata yorumunu siler.",
      permission: "delete",
      parameters: {
        chocolateId: { type: "string", required: true, description: "Çikolata id" },
      },
    },
  ],
  executors: {
    list_chocolates: async ({ userId }) => {
      const res = await chocolate_db.listChocolates({ userId: userId || undefined });
      return res.chocolates;
    },
    set_user_state: async ({ userId, args }) => {
      const res = await chocolate_db.setUserState({
        userId,
        chocolateId: requireString(args, "chocolateId"),
        state: (optionalString(args, "state") as any) ?? "",
      });
      return res;
    },
    add_review: async ({ userId, args }) => {
      const res = await chocolate_db.addReview({
        chocolate_id: requireString(args, "chocolateId"),
        rating: requireNumber(args, "rating"),
        comment: optionalString(args, "comment") ?? undefined,
        reviewer_name: optionalString(args, "reviewerName") ?? "Anonim",
        userId,
      });
      return res;
    },
    delete_review: async ({ userId, args }) => {
      const res = await chocolate_db.deleteReview({
        chocolate_id: requireString(args, "chocolateId"),
        userId,
      });
      return res;
    },
  },
};
