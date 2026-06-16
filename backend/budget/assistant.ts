import {
  requireNumber,
  requireString,
  optionalString,
  optionalNumber,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { budget } from "~encore/clients";

export const budgetAssistant: AppAssistantModule = {
  appId: "budget",
  name: "Budget",
  description: "Bireysel ve ortak bütçeleri yönetir, harcamaları bölüştürür.",
  schema: "budget",
  tools: [
    {
      name: "create_project",
      description: "Yeni bir bütçe projesi ve katılımcıları oluşturur.",
      permission: "create",
      parameters: {
        name: { type: "string", description: "Bütçe adı", required: true },
        description: { type: "string", description: "Bütçe açıklaması" },
        currency: { type: "string", description: "Para birimi (TRY, USD, EUR)", required: true },
        targetBudget: { type: "number", description: "Hedef bütçe limiti" },
        groupType: { type: "string", description: "Grup tipi (trip, home, event, other)", required: true },
        memberNames: { type: "string", description: "Katılımcı isimleri (virgülle ayrılmış)" },
      },
    },
    {
      name: "get_user_projects",
      description: "Kullanıcının üyesi veya sahibi olduğu tüm bütçe projelerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "get_project_details",
      description: "Belirli bir bütçe projesinin detaylarını (katılımcılar, harcamalar, borç durumları) getirir.",
      permission: "read",
      parameters: {
        projectId: { type: "string", description: "Proje UUID", required: true },
      },
    },
    {
      name: "add_expense",
      description: "Bütçeye yeni bir ortak veya bireysel harcama (gider) ekler.",
      permission: "create",
      parameters: {
        projectId: { type: "string", description: "Proje UUID", required: true },
        title: { type: "string", description: "Harcama başlığı", required: true },
        amount: { type: "number", description: "Harcama tutarı", required: true },
        payerMemberId: { type: "string", description: "Ödeyen katılımcının üye id'si", required: true },
        category: { type: "string", description: "Harcama kategorisi (food, transport, lodging, activity, shopping, other)", required: true },
        shares: { type: "string", description: "Bölüşüm listesi. Format: 'memberId:tutar,memberId:tutar'", required: true },
      },
    },
    {
      name: "delete_expense",
      description: "Bütçeden harcamayı siler.",
      permission: "delete",
      parameters: {
        expenseId: { type: "string", description: "Harcama UUID", required: true },
      },
    },
  ],
  executors: {
    create_project: async ({ userId, args }) => {
      const name = requireString(args, "name");
      const description = optionalString(args, "description");
      const currency = requireString(args, "currency");
      const targetBudget = optionalNumber(args, "targetBudget");
      const groupType = requireString(args, "groupType");
      const memberNamesRaw = optionalString(args, "memberNames") || "";
      const memberNames = memberNamesRaw ? memberNamesRaw.split(",").map(n => n.trim()).filter(Boolean) : [];

      const res = await budget.createProject({
        creatorClerkId: userId,
        name,
        description: description ?? undefined,
        currency,
        targetBudget: targetBudget ?? undefined,
        groupType,
        memberNames,
      });
      return { success: true, projectId: res.projectId };
    },

    get_user_projects: async ({ userId }) => {
      const res = await budget.getUserProjects({ userId });
      return res.projects;
    },

    get_project_details: async ({ args }) => {
      const projectId = requireString(args, "projectId");
      const res = await budget.getProjectDetails({ projectId });
      return res;
    },

    add_expense: async ({ args }) => {
      const projectId = requireString(args, "projectId");
      const title = requireString(args, "title");
      const amount = requireNumber(args, "amount");
      const payerMemberId = requireString(args, "payerMemberId");
      const category = requireString(args, "category");
      const sharesRaw = requireString(args, "shares");
      
      const shares = sharesRaw.split(",").map(item => {
        const [member_id, amtStr] = item.split(":");
        return { member_id, share_amount: parseFloat(amtStr) };
      });

      const res = await budget.addExpense({
        projectId,
        title,
        amount,
        payerMemberId,
        category,
        shares,
      });
      return { success: true, expenseId: res.expenseId };
    },

    delete_expense: async ({ args }) => {
      const expenseId = requireString(args, "expenseId");
      const res = await budget.deleteExpense({ expenseId });
      return { success: res.success };
    },
  },
};
