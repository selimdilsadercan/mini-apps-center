import {
  requireString,
  optionalString,
  optionalBoolean,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { tasket } from "~encore/clients";

export const tasketAssistant: AppAssistantModule = {
  appId: "tasket",
  name: "Tasket",
  description: "Notları ve görevleri (task) yönetir. Kullanıcılar listeler oluşturabilir.",
  schema: "tasket",
  tools: [
    {
      name: "get_data",
      description: "Kullanıcının tüm listelerini, notlarını ve görevlerini getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_list",
      description: "Yeni bir liste oluşturur (örn: Alışveriş, İş, Kişisel).",
      permission: "create",
      parameters: {
        name: { type: "string", description: "Liste adı", required: true },
        color: { type: "string", description: "Renk (hex kodu)" },
        icon: { type: "string", description: "Emoji veya ikon adı" },
      },
    },
    {
      name: "add_item",
      description: "Bir listeye veya genel kutuya yeni bir not veya görev ekler.",
      permission: "create",
      parameters: {
        title: { type: "string", description: "Başlık", required: true },
        content: { type: "string", description: "Detaylı içerik" },
        listId: { type: "string", description: "Eklenecek listenin ID'si (opsiyonel)" },
        itemType: { type: "string", description: "note | task", required: true },
        color: { type: "string", description: "Renk" },
        reminderAt: { type: "string", description: "Hatırlatıcı zamanı (ISO format)" },
      },
    },
    {
      name: "update_item",
      description: "Var olan bir notu veya görevi günceller (tamamlandı işaretleme dahil).",
      permission: "update",
      parameters: {
        id: { type: "string", description: "Öğe ID'si", required: true },
        title: { type: "string", description: "Yeni başlık" },
        content: { type: "string", description: "Yeni içerik" },
        isCompleted: { type: "boolean", description: "Tamamlandı mı?" },
      },
    },
  ],
  executors: {
    get_data: async ({ userId }) => {
      return await tasket.getData({ userId });
    },
    create_list: async ({ userId, args }) => {
      const res = await tasket.upsertList({
        userId,
        name: requireString(args, "name"),
        content: args.content,
        color: optionalString(args, "color") ?? undefined,
        icon: optionalString(args, "icon") ?? undefined,
      });
      return res.list;
    },
    add_item: async ({ userId, args }) => {
      const res = await tasket.upsertItem({
        userId,
        title: requireString(args, "title"),
        content: optionalString(args, "content") ?? undefined,
        listId: optionalString(args, "listId") ?? undefined,
        itemType: (optionalString(args, "itemType") as any) ?? "task",
        color: optionalString(args, "color") ?? undefined,
        reminderAt: optionalString(args, "reminderAt") ?? undefined,
      });
      return res.item;
    },
    update_item: async ({ userId, args }) => {
      const res = await tasket.upsertItem({
        userId,
        id: requireString(args, "id"),
        title: optionalString(args, "title") ?? undefined,
        content: optionalString(args, "content") ?? undefined,
        isCompleted: optionalBoolean(args, "isCompleted") ?? undefined,
      });
      return res.item;
    },
  },
};
