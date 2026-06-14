import {
  requireNumber,
  requireString,
  optionalString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { birikim } from "~encore/clients";

export const birikimAssistant: AppAssistantModule = {
  appId: "birikim",
  name: "Birikim",
  description: "Birikim hedeflerini, hesaplarını ve birikim hareketlerini yönetir.",
  schema: "birikim",
  tools: [
    {
      name: "get_savings_data",
      description: "Kullanıcının tüm birikim hesaplarını, hedeflerini ve geçmiş hareketlerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_account",
      description: "Yeni bir birikim hesabı veya varlığı ekler ya da günceller.",
      permission: "create",
      parameters: {
        id: { type: "string", description: "Güncelleme için hesap ID'si (opsiyonel)" },
        name: { type: "string", description: "Hesap adı (örn. Garanti TL, Yastık altı USD, Altın Hesabı)", required: true },
        type: { type: "string", description: "Hesap türü (cash | bank_account | gold | foreign_currency | other)", required: true },
        balance: { type: "number", description: "Mevcut bakiye/miktar", required: true },
        currency: { type: "string", description: "Para birimi (TRY, USD, EUR, veya Altın için GOLD vb.)", required: true },
      },
    },
    {
      name: "add_target",
      description: "Yeni bir birikim hedefi (goal) ekler ya da günceller.",
      permission: "create",
      parameters: {
        id: { type: "string", description: "Güncelleme için hedef ID'si (opsiyonel)" },
        title: { type: "string", description: "Hedef başlığı (örn. Yeni Telefon, Araba Peşinatı)", required: true },
        targetAmount: { type: "number", description: "Hedeflenen miktar", required: true },
        currentAmount: { type: "number", description: "Başlangıç/mevcut miktar", required: true },
        currency: { type: "string", description: "Para birimi (TRY, USD, EUR, GOLD)", required: true },
        targetDate: { type: "string", description: "Hedef tarihi (YYYY-MM-DD formatında, opsiyonel)" },
      },
    },
    {
      name: "log_transaction",
      description: "Birikim hesaplarına para ekleme/çıkarma veya birikimi bir hedefe aktarma işlemi yapar.",
      permission: "create",
      parameters: {
        accountId: { type: "string", description: "İlgili hesap ID'si (opsiyonel)" },
        targetId: { type: "string", description: "İlgili hedef ID'si (opsiyonel)" },
        amount: { type: "number", description: "İşlem miktarı", required: true },
        type: { type: "string", description: "İşlem tipi (deposit | withdraw | target_allocation | target_refund)", required: true },
        description: { type: "string", description: "İşlem açıklaması (opsiyonel)" },
      },
    },
  ],
  executors: {
    get_savings_data: async ({ userId }) => {
      const res = await birikim.getBirikimData({ userId });
      return res;
    },
    add_account: async ({ userId, args }) => {
      const res = await birikim.upsertAccount({
        id: optionalString(args, "id") ?? undefined,
        userId,
        name: requireString(args, "name"),
        type: requireString(args, "type"),
        balance: requireNumber(args, "balance"),
        currency: requireString(args, "currency"),
      });
      return res;
    },
    add_target: async ({ userId, args }) => {
      const res = await birikim.upsertTarget({
        id: optionalString(args, "id") ?? undefined,
        userId,
        title: requireString(args, "title"),
        targetAmount: requireNumber(args, "targetAmount"),
        currentAmount: requireNumber(args, "currentAmount"),
        currency: requireString(args, "currency"),
        targetDate: optionalString(args, "targetDate") ?? undefined,
      });
      return res;
    },
    log_transaction: async ({ userId, args }) => {
      const res = await birikim.addTransaction({
        userId,
        accountId: optionalString(args, "accountId") ?? undefined,
        targetId: optionalString(args, "targetId") ?? undefined,
        amount: requireNumber(args, "amount"),
        type: requireString(args, "type"),
        description: optionalString(args, "description") ?? undefined,
      });
      return res;
    },
  },
};
