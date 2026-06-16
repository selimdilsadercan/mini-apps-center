import type { AppAssistantModule } from "../lib/assistant-types";
import { daily_weather } from "~encore/clients";

export const dailyWeatherAssistant: AppAssistantModule = {
  appId: "daily-weather",
  name: "Daily Weather",
  description: "İstanbul sabah hava durumu bildirim tercihlerini yönetir.",
  schema: "daily_weather",
  tools: [
    {
      name: "get_weather_preferences",
      description: "Kullanıcının sabah bildirim tercihlerini getirir.",
      permission: "read",
      parameters: {},
    },
    {
      name: "get_current_weather",
      description: "İstanbul için güncel hava durumu özetini getirir.",
      permission: "read",
      parameters: {
        city: { type: "string", description: "Şehir adı (varsayılan Istanbul)" },
        locale: { type: "string", description: "tr veya en" },
      },
    },
    {
      name: "get_weather_recommendations",
      description: "Hava durumuna göre giyim, aktivite ve sağlık önerilerini getirir.",
      permission: "read",
      parameters: {
        city: { type: "string", description: "Şehir adı (varsayılan Istanbul)" },
        locale: { type: "string", description: "tr veya en" },
      },
    },
  ],
  executors: {
    get_weather_preferences: async ({ userId }) => {
      const res = await daily_weather.getPreferences({ userId });
      return res.preferences;
    },
    get_current_weather: async ({ args }) => {
      const res = await daily_weather.getWeather({
        city: typeof args?.city === "string" ? args.city : "Istanbul",
        locale: args?.locale === "en" ? "en" : "tr",
      });
      return res.weather;
    },
    get_weather_recommendations: async ({ args }) => {
      const res = await daily_weather.getWeather({
        city: typeof args?.city === "string" ? args.city : "Istanbul",
        locale: args?.locale === "en" ? "en" : "tr",
      });
      return res.recommendations;
    },
  },
};
