import {
  requireString,
  optionalString,
  optionalNumber,
  optionalBoolean,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { kaydedilenler } from "~encore/clients";

export const kaydedilenlerAssistant: AppAssistantModule = {
  appId: "kaydedilenler",
  name: "Kaydedilenler",
  description: "Sosyal medyadan mekan, tarif, alışveriş ve genel içerikleri kaydeder, düzenler ve siler.",
  schema: "kaydedilenler",
  tools: [
    {
      name: "list_bookmarks",
      description: "Kullanıcının kaydettiği tüm içerikleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_bookmark",
      description: "Yeni bir kaydedilen içerik (bookmark) ekler. Eğer kategori 'Mekan' ise şehir, ilçe, puan, ziyaret durumu gibi mekan detayları girilebilir.",
      permission: "create",
      parameters: {
        title: { type: "string", description: "İçeriğin başlığı veya mekan adı", required: true },
        description: { type: "string", description: "İçerik hakkında notlar veya açıklama" },
        url: { type: "string", description: "Sosyal medya linki veya post URL'i" },
        imageUrl: { type: "string", description: "Küçük resim veya görsel URL'i" },
        category: { type: "string", description: "İçerik kategorisi: 'Mekan', 'Tarif', 'Alışveriş', 'Genel', 'Diğer'", required: true },
        instagramUsername: { type: "string", description: "İçeriği paylaşan Instagram kullanıcı adı" },
        city: { type: "string", description: "Sadece Mekan kategorisi için şehir" },
        district: { type: "string", description: "Sadece Mekan kategorisi için ilçe" },
        rating: { type: "number", description: "Sadece Mekan kategorisi için puan (1.0 ile 5.0 arası)" },
        isVisited: { type: "boolean", description: "Mekan ziyaret edildi mi?" },
        isFavorite: { type: "boolean", description: "Favorilere eklensin mi?" },
      },
    },
    {
      name: "update_bookmark",
      description: "Mevcut bir kaydedilen içeriği (bookmark) günceller.",
      permission: "update",
      parameters: {
        id: { type: "string", description: "Güncellenecek içeriğin ID'si", required: true },
        title: { type: "string", description: "İçeriğin başlığı veya mekan adı", required: true },
        description: { type: "string", description: "İçerik hakkında notlar veya açıklama" },
        url: { type: "string", description: "Sosyal medya linki veya post URL'i" },
        imageUrl: { type: "string", description: "Küçük resim veya görsel URL'i" },
        category: { type: "string", description: "İçerik kategorisi: 'Mekan', 'Tarif', 'Alışveriş', 'Genel', 'Diğer'", required: true },
        instagramUsername: { type: "string", description: "İçeriği paylaşan Instagram kullanıcı adı" },
        city: { type: "string", description: "Şehir" },
        district: { type: "string", description: "İlçe" },
        rating: { type: "number", description: "Puan (1.0 ile 5.0 arası)" },
        isVisited: { type: "boolean", description: "Ziyaret edilme durumu", required: true },
        isFavorite: { type: "boolean", description: "Favori durumu", required: true },
      },
    },
    {
      name: "delete_bookmark",
      description: "Kaydedilen bir içeriği siler.",
      permission: "delete",
      parameters: {
        id: { type: "string", description: "Silinecek içeriğin ID'si", required: true },
      },
    },
  ],
  executors: {
    list_bookmarks: async ({ userId }) => {
      const res = await kaydedilenler.getUserBookmarks({ userId });
      return res.bookmarks;
    },
    create_bookmark: async ({ userId, args }) => {
      const res = await kaydedilenler.createBookmark({
        userId,
        title: requireString(args, "title"),
        description: optionalString(args, "description"),
        url: optionalString(args, "url"),
        imageUrl: optionalString(args, "imageUrl"),
        category: requireString(args, "category"),
        instagramUsername: optionalString(args, "instagramUsername"),
        city: optionalString(args, "city"),
        district: optionalString(args, "district"),
        rating: optionalNumber(args, "rating"),
        isVisited: optionalBoolean(args, "isVisited"),
        isFavorite: optionalBoolean(args, "isFavorite"),
      });
      return res.bookmark ? [res.bookmark] : [];
    },
    update_bookmark: async ({ userId, args }) => {
      const res = await kaydedilenler.updateBookmark({
        bookmarkId: requireString(args, "id"),
        userId,
        title: requireString(args, "title"),
        description: optionalString(args, "description"),
        url: optionalString(args, "url"),
        imageUrl: optionalString(args, "imageUrl"),
        category: requireString(args, "category"),
        instagramUsername: optionalString(args, "instagramUsername"),
        city: optionalString(args, "city"),
        district: optionalString(args, "district"),
        rating: optionalNumber(args, "rating"),
        isVisited: args.isVisited as boolean,
        isFavorite: args.isFavorite as boolean,
      });
      return res.bookmark ? [res.bookmark] : [];
    },
    delete_bookmark: async ({ userId, args }) => {
      const res = await kaydedilenler.deleteBookmark({
        bookmarkId: requireString(args, "id"),
        userId,
      });
      return res;
    },
  },
};
