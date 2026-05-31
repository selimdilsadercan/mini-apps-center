import {
  optionalNumber,
  optionalString,
  requireNumber,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { subcenter } from "~encore/clients";

export const subcenterAssistant: AppAssistantModule = {
  appId: "subcenter",
  name: "Subscription Center",
  description: "Abonelikleri yönetir.",
  schema: "subcenter",
  tools: [
    {
      name: "list_subscriptions",
      description: "Kullanıcının aboneliklerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_subscription",
      description: "Yeni abonelik ekler.",
      permission: "create",
      parameters: {
        name: { type: "string", required: true, description: "Servis adı" },
        price: { type: "number", required: true, description: "Fiyat" },
        currency: { type: "string", required: true, description: "Para birimi" },
        cycle: { type: "string", required: true, description: "monthly | yearly" },
        category: { type: "string", required: true, description: "Kategori" },
        color: { type: "string", required: true, description: "Renk" },
        icon: { type: "string", required: true, description: "İkon adı" },
        startDate: { type: "string", required: true, description: "YYYY-MM-DD" },
        planName: { type: "string", description: "Plan adı" },
        region: { type: "string", description: "Bölge" },
        trialDuration: { type: "number", description: "Deneme süresi (gün)" },
        website: { type: "string", description: "Web sitesi" },
      },
    },
    {
      name: "update_subscription",
      description: "Aboneliği günceller.",
      permission: "update",
      parameters: {
        id: { type: "string", required: true, description: "Abonelik id" },
        name: { type: "string", required: true, description: "Servis adı" },
        price: { type: "number", required: true, description: "Fiyat" },
        currency: { type: "string", required: true, description: "Para birimi" },
        cycle: { type: "string", required: true, description: "monthly | yearly" },
        category: { type: "string", required: true, description: "Kategori" },
        color: { type: "string", required: true, description: "Renk" },
        icon: { type: "string", required: true, description: "İkon adı" },
        startDate: { type: "string", required: true, description: "YYYY-MM-DD" },
        planName: { type: "string", description: "Plan adı" },
        region: { type: "string", description: "Bölge" },
        trialDuration: { type: "number", description: "Deneme süresi" },
        website: { type: "string", description: "Web sitesi" },
      },
    },
    {
      name: "delete_subscription",
      description: "Aboneliği siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", required: true, description: "Abonelik id" },
      },
    },
  ],
  executors: {
    list_subscriptions: async ({ userId }) => {
      const res = await subcenter.getUserSubscriptions({ userId });
      return res.subscriptions;
    },
    create_subscription: async ({ userId, args }) => {
      const trialDuration = optionalNumber(args, "trialDuration");
      const res = await subcenter.createSubscription({
        userId,
        name: requireString(args, "name"),
        planName: optionalString(args, "planName") ?? undefined,
        region: optionalString(args, "region") ?? undefined,
        price: requireNumber(args, "price"),
        currency: requireString(args, "currency"),
        cycle: requireString(args, "cycle"),
        category: requireString(args, "category"),
        color: requireString(args, "color"),
        icon: requireString(args, "icon"),
        startDate: requireString(args, "startDate"),
        trialDuration: trialDuration !== null ? String(trialDuration) : undefined,
        website: optionalString(args, "website") ?? undefined,
      });
      return res.subscription ? [res.subscription] : [];
    },
    update_subscription: async ({ userId, args }) => {
      const trialDuration = optionalNumber(args, "trialDuration");
      const res = await subcenter.updateSubscription({
        id: requireString(args, "id"),
        userId,
        name: requireString(args, "name"),
        planName: requireString(args, "planName"),
        region: requireString(args, "region"),
        price: requireNumber(args, "price"),
        currency: requireString(args, "currency"),
        cycle: requireString(args, "cycle"),
        category: requireString(args, "category"),
        color: requireString(args, "color"),
        icon: requireString(args, "icon"),
        startDate: requireString(args, "startDate"),
        trialDuration: trialDuration !== null ? String(trialDuration) : undefined,
        website: optionalString(args, "website") ?? undefined,
      });
      return res.subscription ? [res.subscription] : [];
    },
    delete_subscription: async ({ userId, args }) => {
      const res = await subcenter.deleteSubscription({
        id: requireString(args, "id"),
        userId,
      });
      return res;
    },
  },
};
