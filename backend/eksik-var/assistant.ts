import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { eksik_var } from "~encore/clients";

export const eksikVarAssistant: AppAssistantModule = {
  appId: "eksik-var",
  name: "Eksik Var!",
  description: "Alışveriş listenizi ve evinizin eksiklerini yönetir.",
  schema: "eksik_var",
  tools: [
    {
      name: "list_items",
      description: "Kullanıcının alışveriş listesindeki eksik ürünleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_item",
      description: "Alışveriş listesine eksik yeni bir ürün ekler.",
      permission: "create",
      parameters: {
        name: { type: "string", description: "Ürün adı (örn: Süt, Yumurta)", required: true },
      },
    },
    {
      name: "delete_item",
      description: "Alışveriş listesinden veya eksiklerden bir ürünü siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", description: "Ürün id", required: true },
      },
    },
  ],
  executors: {
    list_items: async ({ userId }) => {
      const res = await eksik_var.getItems({ userId });
      return res.items;
    },
    add_item: async ({ userId, args }) => {
      const res = await eksik_var.addItem({
        userId,
        name: requireString(args, "name"),
      });
      return res.item ? [res.item] : [];
    },
    delete_item: async ({ userId, args }) => {
      const res = await eksik_var.deleteItem({
        id: requireString(args, "id"),
        userId,
      });
      return res;
    },
  },
};
