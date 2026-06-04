import { APIError } from "encore.dev/api";

export type WeatherIcon = "sun" | "cloud" | "rain" | "partly";

export interface WeatherSnapshot {
  city: string;
  dateLabel: string;
  condition: string;
  tempC: number;
  tempMinC: number;
  tempMaxC: number;
  humidity: number;
  windKmh: number;
  icon: WeatherIcon;
  weatherCode: number;
  fetchedAt: string;
}

const CITY_COORDS: Record<string, { lat: number; lon: number; labelTr: string; labelEn: string }> = {
  istanbul: { lat: 41.0082, lon: 28.9784, labelTr: "İstanbul", labelEn: "Istanbul" },
};

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
}

function normalizeCityKey(city?: string): string {
  const key = (city ?? "Istanbul").trim().toLowerCase();
  if (key.includes("istanbul")) return "istanbul";
  return key || "istanbul";
}

function wmoToIcon(code: number): WeatherIcon {
  if (code === 0) return "sun";
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 80 && code <= 99) return "rain";
  if (code >= 1 && code <= 3) return "partly";
  if (code === 45 || code === 48) return "cloud";
  if (code >= 61 && code <= 77) return "rain";
  return "cloud";
}

function wmoToCondition(code: number, locale: "tr" | "en"): string {
  const tr: Record<number, string> = {
    0: "Açık",
    1: "Çoğunlukla açık",
    2: "Parçalı bulutlu",
    3: "Kapalı",
    45: "Sisli",
    48: "Sisli",
    51: "Çisenti",
    53: "Çisenti",
    55: "Çisenti",
    61: "Yağmurlu",
    63: "Yağmurlu",
    65: "Şiddetli yağmur",
    71: "Karlı",
    73: "Karlı",
    75: "Yoğun kar",
    80: "Sağanak",
    81: "Sağanak",
    82: "Şiddetli sağanak",
    95: "Fırtınalı",
    96: "Dolu",
    99: "Dolu",
  };
  const en: Record<number, string> = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Drizzle",
    53: "Drizzle",
    55: "Drizzle",
    61: "Rainy",
    63: "Rainy",
    65: "Heavy rain",
    71: "Snowy",
    73: "Snowy",
    75: "Heavy snow",
    80: "Showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Hail",
    99: "Hail",
  };
  const table = locale === "tr" ? tr : en;
  return table[code] ?? (locale === "tr" ? "Değişken" : "Variable");
}

function roundTemp(value: number | undefined, fallback: number): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.round(value);
}

export function buildNotificationCopy(
  weather: WeatherSnapshot,
  locale: "tr" | "en",
  notifyHour: number,
  notifyMinute: number,
): { title: string; body: string } {
  const time = `${String(notifyHour).padStart(2, "0")}:${String(notifyMinute).padStart(2, "0")}`;
  const cityLabel = weather.city;

  if (locale === "tr") {
    return {
      title: `${cityLabel} • ${weather.condition}`,
      body: `Günaydın! Bugün ${weather.tempMinC}°–${weather.tempMaxC}° (şu an ${weather.tempC}°). Bildirim saati: ${time}.`,
    };
  }

  return {
    title: `${cityLabel} • ${weather.condition}`,
    body: `Good morning! Today ${weather.tempMinC}°–${weather.tempMaxC}° (now ${weather.tempC}°). Notification at ${time}.`,
  };
}

export async function fetchWeatherSnapshot(
  city?: string,
  locale: "tr" | "en" = "tr",
): Promise<WeatherSnapshot> {
  const cityKey = normalizeCityKey(city);
  const coords = CITY_COORDS[cityKey];
  if (!coords) {
    throw APIError.invalidArgument(`Unsupported city: ${city ?? "Istanbul"}`);
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "Europe/Istanbul");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("wind_speed_unit", "kmh");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw APIError.unavailable(`Weather provider error: HTTP ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const code = data.current?.weather_code ?? data.daily?.weather_code?.[0] ?? 2;
  const tempC = roundTemp(data.current?.temperature_2m, 18);
  const tempMinC = roundTemp(data.daily?.temperature_2m_min?.[0], tempC - 4);
  const tempMaxC = roundTemp(data.daily?.temperature_2m_max?.[0], tempC + 4);

  const today = new Date();
  const dateLabel = today.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });

  return {
    city: locale === "tr" ? coords.labelTr : coords.labelEn,
    dateLabel,
    condition: wmoToCondition(code, locale),
    tempC,
    tempMinC: Math.min(tempMinC, tempMaxC),
    tempMaxC: Math.max(tempMinC, tempMaxC),
    humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
    windKmh: Math.round(data.current?.wind_speed_10m ?? 0),
    icon: wmoToIcon(code),
    weatherCode: code,
    fetchedAt: new Date().toISOString(),
  };
}
