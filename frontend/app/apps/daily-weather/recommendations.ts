import type { daily_weather } from "@/lib/client";
import type { DailyWeatherSnapshot } from "./mock-weather";

type Locale = "tr" | "en";

function isRainCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 61 && code <= 77) ||
    (code >= 80 && code <= 82) ||
    code === 95 ||
    code === 96 ||
    code === 99
  );
}

function isSnowCode(code: number): boolean {
  return code >= 71 && code <= 77;
}

function isFogCode(code: number): boolean {
  return code === 45 || code === 48;
}

function isClearCode(code: number): boolean {
  return code === 0 || code === 1;
}

/** Mock/API fallback — backend ile aynı kurallar. */
export function buildLocalRecommendations(
  weather: DailyWeatherSnapshot & { weatherCode?: number },
  locale: Locale,
): daily_weather.WeatherRecommendation[] {
  const items: { id: string; category: daily_weather.RecommendationCategory; title: string; detail: string; priority: number }[] = [];
  const tr = locale === "tr";
  const code = weather.weatherCode ?? 2;
  const { tempC, tempMinC, tempMaxC, humidity, windKmh } = weather;

  if (isRainCode(code)) {
    items.push({
      id: "umbrella",
      category: "gear",
      title: tr ? "Şemsiye al" : "Bring an umbrella",
      detail: tr ? "Yağış bekleniyor; yanınıza katlanır şemsiye alın." : "Rain expected — keep a compact umbrella handy.",
      priority: 10,
    });
  }
  if (isSnowCode(code)) {
    items.push({
      id: "snow-boots",
      category: "clothing",
      title: tr ? "Kaymaz bot giy" : "Wear non-slip boots",
      detail: tr ? "Karlı havalarda tabanı kaymaz ayakkabı kullanın." : "Use boots with good grip in snowy conditions.",
      priority: 10,
    });
  }
  if (tempMinC <= 5 || tempC <= 8) {
    items.push({
      id: "warm-coat",
      category: "clothing",
      title: tr ? "Kalın mont / palto" : "Heavy coat",
      detail: tr ? `Bugün ${tempMinC}°'ye kadar düşebilir.` : `Lows around ${tempMinC}° — wear insulating outerwear.`,
      priority: 7,
    });
  } else if (tempMaxC >= 28 || tempC >= 26) {
    items.push({
      id: "light-clothes",
      category: "clothing",
      title: tr ? "Hafif kıyafet" : "Light clothes",
      detail: tr ? `${tempMaxC}°'ye kadar çıkabilir.` : `Highs up to ${tempMaxC}°.`,
      priority: 8,
    });
  }
  if (windKmh >= 25) {
    items.push({
      id: "windbreaker",
      category: "clothing",
      title: tr ? "Rüzgarlık tercih et" : "Wear a windbreaker",
      detail: tr ? `${windKmh} km/s rüzgar.` : `${windKmh} km/h wind.`,
      priority: 7,
    });
  }
  if (isFogCode(code)) {
    items.push({
      id: "visibility",
      category: "commute",
      title: tr ? "Görüş mesafesi düşük" : "Low visibility",
      detail: tr ? "Sisli havalarda dikkatli olun." : "Drive carefully in fog.",
      priority: 9,
    });
  }
  if (isClearCode(code) && tempC >= 12 && tempC <= 26 && !isRainCode(code)) {
    items.push({
      id: "outdoor-walk",
      category: "activity",
      title: tr ? "Açık hava yürüyüşü" : "Outdoor walk",
      detail: tr ? "Yürüyüş için uygun hava." : "Nice weather for a walk.",
      priority: 4,
    });
  }
  if (items.length === 0) {
    items.push({
      id: "default",
      category: "activity",
      title: tr ? "Günlük rutine devam" : "Stick to your routine",
      detail: tr ? "Hafif katmanlı giyinmek yeterli olabilir." : "Light layers should be fine.",
      priority: 1,
    });
  }

  return items
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(({ priority: _p, ...rest }) => rest);
}
