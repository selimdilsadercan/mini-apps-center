import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { digital_menu } from "~encore/clients";

export const digitalMenuAssistant: AppAssistantModule = {
  appId: "digital-menu",
  name: "Digital Menu",
  description: "Dijital QR Menü uygulamasını yönetir. Kategorileri, yemek menülerini, garson çağırma taleplerini ve işletmeleri yönetir.",
  schema: "digital_menu",
  tools: [
    {
      name: "get_restaurant_menu",
      description: "Belirtilen işletmenin (restoran/kafe) tüm kategorilerini ve yemek/içecek menüsünü getirir.",
      permission: "read",
      parameters: {
        businessId: { type: "string", description: "İşletmenin benzersiz ID'si", required: true },
      },
    },
    {
      name: "call_waiter_from_table",
      description: "Restorandaki belirli bir masadan garson çağrısı oluşturur.",
      permission: "update",
      parameters: {
        businessId: { type: "string", description: "İşletmenin benzersiz ID'si", required: true },
        tableNumber: { type: "string", description: "Masa numarası veya adı", required: true },
      },
    },
    {
      name: "toggle_menu_item_status",
      description: "Bir menü elemanının bulunabilirlik (mevcut / bitti) durumunu değiştirir.",
      permission: "update",
      parameters: {
        itemId: { type: "string", description: "Menü elemanının benzersiz ID'si", required: true },
      },
    },
  ],
  executors: {
    get_restaurant_menu: async ({ args }) => {
      const res = await digital_menu.getMenuData({
        businessId: requireString(args, "businessId"),
      });
      return res;
    },
    call_waiter_from_table: async ({ args }) => {
      const res = await digital_menu.callWaiter({
        businessId: requireString(args, "businessId"),
        tableNumber: requireString(args, "tableNumber"),
      });
      return res;
    },
    toggle_menu_item_status: async ({ args }) => {
      const res = await digital_menu.toggleAvailability({
        itemId: requireString(args, "itemId"),
      });
      return res;
    },
  },
};
