import type { AppAssistantDefinition } from "../lib/assistant-types";

export const moviesThisYearAssistantDefinition: AppAssistantDefinition = {
  appId: "movies-this-year",
  name: "Movies This Year",
  description: "Film listelerini okur (salt okunur, harici API).",
  schema: "movies_this_year",
  tools: [
    {
      name: "list_movies",
      description: "Yılın filmlerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "list_upcoming",
      description: "Yaklaşan filmleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "list_top_rated",
      description: "En yüksek puanlı filmleri listeler.",
      permission: "read",
      parameters: {},
    },
  ],
};
