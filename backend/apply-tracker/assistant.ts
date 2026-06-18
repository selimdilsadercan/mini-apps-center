import {
  requireString,
  optionalString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { apply_tracker } from "~encore/clients";

export const applyTrackerAssistant: AppAssistantModule = {
  appId: "apply-tracker",
  name: "Başvuru Takip",
  description: "İş başvurularını, süreç durumlarını ve ilanları yönetir.",
  schema: "apply_tracker",
  tools: [
    {
      name: "list_applications",
      description: "Kullanıcının tüm iş başvurularını listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_application",
      description: "Yeni bir iş başvurusu ekler.",
      permission: "create",
      parameters: {
        companyName: { type: "string", description: "Şirket adı (Örn: Altamira, Sezzle)", required: true },
        roleTitle: { type: "string", description: "İş rolü / pozisyon başlığı (Örn: Full-Stack Engineer)" },
        url: { type: "string", description: "İş ilanı linki" },
        status: {
          type: "string",
          description: "Süreç durumu: to_apply (başvurulacak) | applied (başvuruldu) | interviewing (mülakat) | offer (teklif) | rejected (red) | withdrawn (geri çekildi)",
          required: true,
        },
        priority: {
          type: "string",
          description: "Öncelik: low | medium | high",
          required: true,
        },
        notes: { type: "string", description: "Başvuruya ait notlar" },
      },
    },
    {
      name: "update_application",
      description: "Varolan bir iş başvurusunu günceller.",
      permission: "update",
      parameters: {
        id: { type: "string", description: "Güncellenecek başvurunun ID'si", required: true },
        companyName: { type: "string", description: "Şirket adı", required: true },
        roleTitle: { type: "string", description: "Pozisyon başlığı" },
        url: { type: "string", description: "İlan linki" },
        status: {
          type: "string",
          description: "Süreç durumu: to_apply | applied | interviewing | offer | rejected | withdrawn",
          required: true,
        },
        priority: {
          type: "string",
          description: "Öncelik: low | medium | high",
          required: true,
        },
        notes: { type: "string", description: "Notlar" },
      },
    },
    {
      name: "delete_application",
      description: "İş başvurusunu siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", description: "Silinecek başvurunun ID'si", required: true },
      },
    },
  ],
  executors: {
    list_applications: async ({ userId }) => {
      const res = await apply_tracker.getApplications({ userId });
      return res.applications;
    },
    add_application: async ({ userId, args }) => {
      const res = await apply_tracker.addApplication({
        userId,
        companyName: requireString(args, "companyName"),
        roleTitle: optionalString(args, "roleTitle") ?? undefined,
        url: optionalString(args, "url") ?? undefined,
        status: requireString(args, "status") as any,
        priority: requireString(args, "priority") as any,
        notes: optionalString(args, "notes") ?? undefined,
      });
      return res.application ? [res.application] : [];
    },
    update_application: async ({ userId, args }) => {
      const res = await apply_tracker.updateApplication({
        userId,
        id: requireString(args, "id"),
        companyName: requireString(args, "companyName"),
        roleTitle: optionalString(args, "roleTitle") ?? undefined,
        url: optionalString(args, "url") ?? undefined,
        status: requireString(args, "status") as any,
        priority: requireString(args, "priority") as any,
        notes: optionalString(args, "notes") ?? undefined,
      });
      return res.application ? [res.application] : [];
    },
    delete_application: async ({ userId, args }) => {
      const res = await apply_tracker.deleteApplication({
        id: requireString(args, "id"),
        userId,
      });
      return res;
    },
  },
};
