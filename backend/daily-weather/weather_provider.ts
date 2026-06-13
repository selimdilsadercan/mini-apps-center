import { APIError } from "encore.dev/api";

export type WeatherIcon = "sun" | "cloud" | "rain" | "partly" | "snow";

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
  maxPrecipitationProbability?: number; // Günün maksimum yağmur ihtimali
  eveningTempC?: number;                 // Akşam derecesi (yaklaşık 20:00 - 22:00 arası)
  eveningPrecipitationProbability?: number; // Akşam yağmur ihtimali (%)
  hourlyData?: {
    time: string;
    tempC: number;
    precipProb: number;
    weatherCode: number;
  }[];
  dailyForecast?: {
    dayLabel: string; // "Paz", "Pzt" vb.
    dateLabel: string; // "14 Haziran Pazar"
    condition: string;
    tempC: number;
    tempMinC: number;
    tempMaxC: number;
    humidity: number;
    windKmh: number;
    maxPrecipitationProbability: number;
    icon: WeatherIcon;
    weatherCode: number;
    hourlyData: {
      time: string;
      tempC: number;
      precipProb: number;
      weatherCode: number;
    }[];
  }[];
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
    precipitation_probability_max?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    relative_humidity_2m?: number[];
    wind_speed_10m?: number[];
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
  if (code >= 51 && code <= 55) return "rain"; // drizzle
  if (code >= 56 && code <= 57) return "rain"; // freezing drizzle
  if (code >= 61 && code <= 65) return "rain"; // rain
  if (code >= 66 && code <= 67) return "rain"; // freezing rain
  if (code >= 71 && code <= 77) return "snow"; // snow / grains / flakes
  if (code >= 80 && code <= 82) return "rain"; // rain showers
  if (code >= 85 && code <= 86) return "snow"; // snow showers
  if (code >= 95 && code <= 99) return "rain"; // thunderstorm / hail
  if (code >= 1 && code <= 3) return "partly";
  if (code === 45 || code === 48) return "cloud";
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
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m,weather_code",
  );
  url.searchParams.set("timezone", "Europe/Istanbul");
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("wind_speed_unit", "kmh");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw APIError.unavailable(`Weather provider error: HTTP ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const currentCode = data.current?.weather_code ?? data.daily?.weather_code?.[0] ?? 2;
  const currentTempC = roundTemp(data.current?.temperature_2m, 18);
  const currentHumidity = Math.round(data.current?.relative_humidity_2m ?? 0);
  const currentWindKmh = Math.round(data.current?.wind_speed_10m ?? 0);

  // Akşam (20:00) saatine denk gelen bugünün verileri
  let eveningTemp = roundTemp(data.daily?.temperature_2m_min?.[0], currentTempC - 4);
  let eveningPrecipProb = 0;
  if (data.hourly?.time && data.hourly.temperature_2m && data.hourly.precipitation_probability) {
    const index = 20; 
    if (data.hourly.temperature_2m[index] !== undefined) {
      eveningTemp = Math.round(data.hourly.temperature_2m[index]);
    }
    if (data.hourly.precipitation_probability[index] !== undefined) {
      eveningPrecipProb = data.hourly.precipitation_probability[index];
    }
  }

  const today = new Date();
  const dailyForecastList: NonNullable<WeatherSnapshot["dailyForecast"]> = [];

  const daysLimit = Math.min(5, data.daily?.weather_code?.length ?? 0);
  for (let d = 0; d < daysLimit; d++) {
    const forecastDate = new Date();
    forecastDate.setDate(today.getDate() + d);

    const dayLabel = forecastDate.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      weekday: "short",
      timeZone: "Europe/Istanbul",
    }).replace(".", "");

    const dateLabel = forecastDate.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Istanbul",
    });

    const dayCode = data.daily?.weather_code?.[d] ?? 2;
    const dayTempMinC = roundTemp(data.daily?.temperature_2m_min?.[d], currentTempC - 4);
    const dayTempMaxC = roundTemp(data.daily?.temperature_2m_max?.[d], currentTempC + 4);
    const maxPrecipProb = data.daily?.precipitation_probability_max?.[d] ?? 0;

    // Chunk hourly data (24 hours per day)
    const startHourIdx = d * 24;
    const endHourIdx = startHourIdx + 24;
    const dayHourlyData: { time: string; tempC: number; precipProb: number; weatherCode: number }[] = [];

    let totalTemp = 0;
    let totalHumidity = 0;
    let totalWind = 0;
    let validHoursCount = 0;

    for (let h = startHourIdx; h < endHourIdx; h++) {
      if (!data.hourly?.time || !data.hourly.time[h]) break;

      const timeStr = data.hourly.time[h];
      const hourPart = timeStr.includes("T") ? timeStr.split("T")[1] : timeStr;

      const tempC = Math.round(data.hourly.temperature_2m?.[h] ?? 18);
      const precipProb = Math.round(data.hourly.precipitation_probability?.[h] ?? 0);
      const weatherCode = data.hourly.weather_code?.[h] ?? dayCode;

      totalTemp += tempC;
      totalHumidity += Math.round(data.hourly.relative_humidity_2m?.[h] ?? 0);
      totalWind += Math.round(data.hourly.wind_speed_10m?.[h] ?? 0);
      validHoursCount++;

      dayHourlyData.push({
        time: hourPart,
        tempC,
        precipProb,
        weatherCode,
      });
    }

    // Averages/representative values for the day
    const avgTemp = validHoursCount > 0 ? Math.round(totalTemp / validHoursCount) : currentTempC;
    const avgHumidity = validHoursCount > 0 ? Math.round(totalHumidity / validHoursCount) : currentHumidity;
    const avgWind = validHoursCount > 0 ? Math.round(totalWind / validHoursCount) : currentWindKmh;

    const dayTempC = d === 0 ? currentTempC : (dayHourlyData[12]?.tempC ?? avgTemp);
    const dayHumidity = d === 0 ? currentHumidity : avgHumidity;
    const dayWind = d === 0 ? currentWindKmh : avgWind;

    dailyForecastList.push({
      dayLabel,
      dateLabel,
      condition: wmoToCondition(dayCode, locale),
      tempC: dayTempC,
      tempMinC: Math.min(dayTempMinC, dayTempMaxC),
      tempMaxC: Math.max(dayTempMinC, dayTempMaxC),
      humidity: dayHumidity,
      windKmh: dayWind,
      maxPrecipitationProbability: maxPrecipProb,
      icon: wmoToIcon(dayCode),
      weatherCode: dayCode,
      hourlyData: dayHourlyData,
    });
  }

  // Today's main details mapped for compatibility
  const firstDay = dailyForecastList[0];
  const dateLabel = today.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });

  return {
    city: locale === "tr" ? coords.labelTr : coords.labelEn,
    dateLabel,
    condition: wmoToCondition(currentCode, locale),
    tempC: currentTempC,
    tempMinC: firstDay ? firstDay.tempMinC : currentTempC - 4,
    tempMaxC: firstDay ? firstDay.tempMaxC : currentTempC + 4,
    humidity: currentHumidity,
    windKmh: currentWindKmh,
    icon: wmoToIcon(currentCode),
    weatherCode: currentCode,
    fetchedAt: new Date().toISOString(),
    maxPrecipitationProbability: firstDay ? firstDay.maxPrecipitationProbability : 0,
    eveningTempC: eveningTemp,
    eveningPrecipitationProbability: eveningPrecipProb,
    hourlyData: firstDay ? firstDay.hourlyData : [],
    dailyForecast: dailyForecastList,
  };
}
