import {
  requireString,
  optionalString,
  requireNumber,
  optionalBoolean,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { store } from "~encore/clients";

export const storeAssistant: AppAssistantModule = {
  appId: "store",
  name: "Store",
  description: "Mağaza profili oluşturma ve ürün yönetimi işlemlerini gerçekleştirir.",
  schema: "store",
  tools: [
    {
      name: "get_my_store",
      description: "Kullanıcının kendi mağaza profilini getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_store",
      description: "Yeni bir mağaza profili oluşturur.",
      permission: "create",
      parameters: {
        name: { type: "string", description: "Mağaza adı", required: true },
        description: { type: "string", description: "Mağaza açıklaması" },
        contactWhatsapp: { type: "string", description: "İletişim için WhatsApp numarası (örn. +90555...)" },
        contactInstagram: { type: "string", description: "İletişim için Instagram kullanıcı adı (örn. @butik)" },
        contactEmail: { type: "string", description: "İletişim için e-posta adresi" },
      },
    },
    {
      name: "update_store",
      description: "Mevcut mağaza profilini günceller.",
      permission: "update",
      parameters: {
        storeId: { type: "string", description: "Mağaza ID'si", required: true },
        name: { type: "string", description: "Mağaza adı", required: true },
        description: { type: "string", description: "Mağaza açıklaması" },
        contactWhatsapp: { type: "string", description: "WhatsApp numarası" },
        contactInstagram: { type: "string", description: "Instagram kullanıcı adı" },
        contactEmail: { type: "string", description: "E-posta adresi" },
      },
    },
    {
      name: "list_store_products",
      description: "Belirli bir mağazanın tüm ürünlerini listeler.",
      permission: "read",
      parameters: {
        storeId: { type: "string", description: "Mağaza ID'si", required: true },
      },
    },
    {
      name: "create_product",
      description: "Mağazaya yeni bir ürün ekler.",
      permission: "create",
      parameters: {
        storeId: { type: "string", description: "Mağaza ID'si", required: true },
        name: { type: "string", description: "Ürün adı", required: true },
        description: { type: "string", description: "Ürün açıklaması" },
        price: { type: "number", description: "Ürün fiyatı", required: true },
        category: { type: "string", description: "Ürün kategorisi (örn. Oyuncak, Hırka, Çanta)", required: true },
      },
    },
    {
      name: "delete_product",
      description: "Mağazadan bir ürünü siler.",
      permission: "delete",
      parameters: {
        productId: { type: "string", description: "Ürün ID'si", required: true },
      },
    },
  ],
  executors: {
    get_my_store: async ({ userId }) => {
      const res = await store.getStoreByUserId({ userId });
      return res.store ? [res.store] : [];
    },
    create_store: async ({ userId, args }) => {
      const res = await store.createStore({
        userId,
        name: requireString(args, "name"),
        description: optionalString(args, "description"),
        contactWhatsapp: optionalString(args, "contactWhatsapp"),
        contactInstagram: optionalString(args, "contactInstagram"),
        contactEmail: optionalString(args, "contactEmail"),
      });
      return res.store ? [res.store] : [];
    },
    update_store: async ({ userId, args }) => {
      const res = await store.updateStore({
        storeId: requireString(args, "storeId"),
        userId,
        name: requireString(args, "name"),
        description: optionalString(args, "description"),
        contactWhatsapp: optionalString(args, "contactWhatsapp"),
        contactInstagram: optionalString(args, "contactInstagram"),
        contactEmail: optionalString(args, "contactEmail"),
      });
      return res.store ? [res.store] : [];
    },
    list_store_products: async ({ args }) => {
      const res = await store.getStoreProducts({
        storeId: requireString(args, "storeId"),
      });
      return res.products;
    },
    create_product: async ({ userId, args }) => {
      const res = await store.createProduct({
        userId,
        storeId: requireString(args, "storeId"),
        name: requireString(args, "name"),
        description: optionalString(args, "description"),
        price: requireNumber(args, "price"),
        category: requireString(args, "category"),
      });
      return res.product ? [res.product] : [];
    },
    delete_product: async ({ userId, args }) => {
      const res = await store.deleteProduct({
        productId: requireString(args, "productId"),
        userId,
      });
      return res;
    },
  },
};
