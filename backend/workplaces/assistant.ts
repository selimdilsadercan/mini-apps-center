import {
  requireNumber,
  requireString,
  optionalString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { workplaces } from "~encore/clients";

export const workplacesAssistant: AppAssistantModule = {
  appId: "workplaces",
  name: "Workplaces",
  description: "Çalışmaya uygun kütüphane ve kafeleri yönetir.",
  schema: "workplaces",
  tools: [
    {
      name: "list_places",
      description: "Çalışmaya uygun mekanları listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "toggle_favorite",
      description: "Bir mekanı favorilere ekler veya favorilerden çıkarır.",
      permission: "update",
      parameters: {
        place_id: { type: "string", description: "Mekan UUID", required: true },
      },
    },
    {
      name: "add_place",
      description: "Yeni bir çalışma mekanı önerir.",
      permission: "create",
      parameters: {
        name: { type: "string", description: "Mekan adı", required: true },
        note: { type: "string", description: "Mekan hakkında notlar" },
        url: { type: "string", description: "Google Maps URL'i" },
        tags: { type: "string", description: "Etiketler (virgülle ayrılmış)" },
        wifi: { type: "boolean", description: "WiFi var mı?" },
        parking: { type: "boolean", description: "Otopark var mı?" },
        power_outlets: { type: "boolean", description: "Priz var mı?" },
        quiet_level: { type: "number", description: "Sessizlik seviyesi (1-5)" },
      },
    },
  ],
  executors: {
    list_places: async ({ userId }) => {
      const res = await workplaces.listPlaces({ userId });
      return res.places;
    },
    toggle_favorite: async ({ userId, args }) => {
      const res = await workplaces.toggleFavorite({
        placeId: requireString(args, "place_id"),
        userId,
      });
      return res;
    },
    add_place: async ({ userId, args }) => {
      const res = await workplaces.addPlace({
        name: requireString(args, "name"),
        note: optionalString(args, "note") ?? undefined,
        url: optionalString(args, "url") ?? undefined,
        tags: optionalString(args, "tags")?.split(",").map(t => t.trim()) ?? [],
        wifi: Boolean(args.wifi),
        parking: Boolean(args.parking),
        power_outlets: Boolean(args.power_outlets),
        quiet_level: (args.quiet_level as number) ?? 3,
        latitude: (args.latitude as number) ?? undefined,
        longitude: (args.longitude as number) ?? undefined,
        district: optionalString(args, "district") ?? undefined,
        image_url: optionalString(args, "image_url") ?? undefined,
        address: optionalString(args, "address") ?? undefined,
        rating: (args.rating as number) ?? undefined,
        user_ratings_total: (args.user_ratings_total as number) ?? undefined,
        metadata: (args.metadata as any) ?? {},
        suggested_by: userId,
        suggested_by_clerk_id: userId,
      });
      return res.place ? [res.place] : [];
    },
  },
};
