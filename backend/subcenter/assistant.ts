import type { AppAssistantDefinition } from "../lib/assistant-types";

export const subcenterAssistantDefinition: AppAssistantDefinition = {
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
};
