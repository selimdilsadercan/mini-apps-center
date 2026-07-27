import {
  requireString,
  optionalString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { places } from "~encore/clients";

export const placesAssistant: AppAssistantModule = {
  appId: "places",
  name: "Places",
  description: "Cafes and restaurants (places) manager. Lists places, filters by category, and toggles favorite places.",
  schema: "places",
  tools: [
    {
      name: "list_cafes_and_restaurants",
      description: "Lists all cafes, restaurants, dessert shops, and bars in the city.",
      permission: "read",
      parameters: {
        userId: { type: "string", description: "Clerk user ID to check favorites status", required: false },
      },
    },
    {
      name: "toggle_favorite_place",
      description: "Favorites or unfavorites a specific cafe/restaurant.",
      permission: "update",
      parameters: {
        placeId: { type: "string", description: "The UUID of the place to toggle favorite status", required: true },
        userId: { type: "string", description: "Clerk user ID of the user", required: true },
      },
    },
  ],
  executors: {
    list_cafes_and_restaurants: async ({ args }) => {
      const res = await places.listPlaces({
        userId: optionalString(args, "userId") || undefined,
      });
      return res;
    },
    toggle_favorite_place: async ({ args }) => {
      const res = await places.toggleFavorite({
        placeId: requireString(args, "placeId"),
        userId: requireString(args, "userId"),
      });
      return res;
    },
  },
};
