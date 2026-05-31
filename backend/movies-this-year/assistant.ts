import type { AppAssistantModule } from "../lib/assistant-types";
import { movies_this_year } from "~encore/clients";

export const moviesThisYearAssistant: AppAssistantModule = {
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
  executors: {
    list_movies: async () => {
      const res = await movies_this_year.getMoviesThisYear();
      return { movies: res.movies };
    },
    list_upcoming: async () => {
      const res = await movies_this_year.getUpcomingMovies();
      return { movies: res.movies };
    },
    list_top_rated: async () => {
      const res = await movies_this_year.getTopRatedMovies();
      return { movies: res.movies };
    },
  },
};
