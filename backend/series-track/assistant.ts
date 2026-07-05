import {
  requireString,
  optionalString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { series_track } from "~encore/clients";

export const seriesTrackAssistant: AppAssistantModule = {
  appId: "series-track",
  name: "SeriesTrack",
  description: "İzlediğin dizileri takip et, bölüm kaçırma ve televizyon akışlarını izle.",
  schema: "series_track",
  tools: [
    {
      name: "list_series",
      description: "Kullanıcının takip listesindeki tüm dizileri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "list_tv_channels",
      description: "Tüm aktif televizyon kanallarını ve yayınlanan programları listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    list_series: async ({ userId }) => {
      if (!userId) return [];
      const res = await series_track.getUserSeries({ userId });
      return res.series;
    },
    list_tv_channels: async () => {
      const res = await series_track.getTvChannels();
      return res.channels;
    },
  },
};
