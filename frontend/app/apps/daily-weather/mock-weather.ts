export interface DailyWeatherSnapshot {
  city: string;
  dateLabel: string;
  condition: string;
  tempC: number;
  tempMinC: number;
  tempMaxC: number;
  humidity: number;
  windKmh: number;
  icon: "sun" | "cloud" | "rain" | "partly";
  weatherCode?: number;
}

export function getMockIstanbulWeather(locale: "tr" | "en"): DailyWeatherSnapshot {
  const today = new Date();
  const dateLabel = today.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return {
    city: "İstanbul",
    dateLabel,
    condition: locale === "tr" ? "Parçalı bulutlu" : "Partly cloudy",
    tempC: 18,
    tempMinC: 14,
    tempMaxC: 22,
    humidity: 62,
    windKmh: 14,
    icon: "partly",
    weatherCode: 2,
  };
}

export function formatNotificationPreview(
  weather: DailyWeatherSnapshot,
  locale: "tr" | "en",
  hour: number,
  minute = 0,
): { title: string; body: string } {
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  if (locale === "tr") {
    return {
      title: `İstanbul • ${weather.condition}`,
      body: `Günaydın! Bugün ${weather.tempMinC}°–${weather.tempMaxC}° (şu an ${weather.tempC}°). Bildirim saati: ${time}.`,
    };
  }

  return {
    title: `Istanbul • ${weather.condition}`,
    body: `Good morning! Today ${weather.tempMinC}°–${weather.tempMaxC}° (now ${weather.tempC}°). Notification at ${time}.`,
  };
}
