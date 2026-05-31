import type { AppAssistantDefinition } from "../lib/assistant-types";

export const kilerAssistantDefinition: AppAssistantDefinition = {
  appId: "kiler",
  name: "Kiler",
  description: "Evdeki stokları yönetir.",
  schema: "kiler",
  tools: [
    {
      name: "list_items",
      description: "Kullanıcının kilerindeki ürünleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "add_item",
      description: "Kilere yeni ürün ekler.",
      permission: "create",
      parameters: {
        name: { type: "string", description: "Ürün adı", required: true },
        amount: { type: "number", description: "Miktar", required: true },
        unit: { type: "string", description: "Birim (adet, kg, L...)", required: true },
        storageType: {
          type: "string",
          description: "fridge | freezer | pantry",
          required: true,
        },
        purchaseDate: { type: "string", description: "YYYY-MM-DD", required: true },
        expiryDate: { type: "string", description: "YYYY-MM-DD" },
      },
    },
    {
      name: "delete_item",
      description: "Kilerden ürün siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", description: "Ürün id", required: true },
      },
    },
  ],
};
