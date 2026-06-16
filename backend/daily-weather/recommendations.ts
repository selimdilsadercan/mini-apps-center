import type { WeatherSnapshot } from "./weather_provider";

export type RecommendationCategory =
  | "clothing"
  | "gear"
  | "activity"
  | "health"
  | "commute";

export interface WeatherRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  detail: string;
  priority: number;
}

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

export function buildWeatherRecommendations(
  weather: Pick<
    WeatherSnapshot,
    "tempC" | "tempMinC" | "tempMaxC" | "humidity" | "windKmh" | "weatherCode" | "icon"
  >,
  locale: "tr" | "en",
): WeatherRecommendation[] {
  const items: WeatherRecommendation[] = [];
  const { tempC, tempMinC, tempMaxC, humidity, windKmh, weatherCode } = weather;
  const tr = locale === "tr";

  if (isRainCode(weatherCode)) {
    items.push({
      id: "umbrella",
      category: "gear",
      title: tr ? "Şemsiye al" : "Bring an umbrella",
      detail: tr
        ? "Yağış bekleniyor; yanınıza katlanır şemsiye alın."
        : "Rain expected — keep a compact umbrella handy.",
      priority: 10,
    });
    items.push({
      id: "waterproof-shoes",
      category: "clothing",
      title: tr ? "Su geçirmez ayakkabı" : "Waterproof shoes",
      detail: tr
        ? "Islak zeminlerde kaymamak için su geçirmez taban tercih edin."
        : "Choose waterproof soles for wet streets.",
      priority: 9,
    });
  }

  if (isSnowCode(weatherCode)) {
    items.push({
      id: "snow-boots",
      category: "clothing",
      title: tr ? "Kaymaz bot giy" : "Wear non-slip boots",
      detail: tr
        ? "Karlı havalarda tabanı kaymaz ayakkabı kullanın."
        : "Use boots with good grip in snowy conditions.",
      priority: 10,
    });
    items.push({
      id: "layers",
      category: "clothing",
      title: tr ? "Kat kat giyin" : "Layer up",
      detail: tr
        ? "Mont, polar ve iç katmanla vücut ısınızı koruyun."
        : "Wear a coat, mid-layer, and base layer.",
      priority: 8,
    });
  }

  if (tempMinC <= 5 || tempC <= 8) {
    items.push({
      id: "warm-coat",
      category: "clothing",
      title: tr ? "Kalın mont / palto" : "Heavy coat",
      detail: tr
        ? `Bugün ${tempMinC}°'ye kadar düşebilir; sıcak tutan dış giyim şart.`
        : `Lows around ${tempMinC}° — wear insulating outerwear.`,
      priority: tempMinC <= 0 ? 10 : 7,
    });
    items.push({
      id: "scarf-gloves",
      category: "gear",
      title: tr ? "Atkı ve eldiven" : "Scarf and gloves",
      detail: tr
        ? "Soğuk rüzgârda el ve boyun bölgesini koruyun."
        : "Protect your hands and neck from the cold wind.",
      priority: 6,
    });
  } else if (tempMaxC >= 28 || tempC >= 26) {
    items.push({
      id: "light-clothes",
      category: "clothing",
      title: tr ? "Hafif, nefes alan kıyafet" : "Light breathable clothes",
      detail: tr
        ? `${tempMaxC}°'ye kadar çıkabilir; pamuklu ve açık renkli giysiler tercih edin.`
        : `Highs up to ${tempMaxC}° — choose cotton and light colors.`,
      priority: 8,
    });
    items.push({
      id: "hydration",
      category: "health",
      title: tr ? "Bol su için" : "Stay hydrated",
      detail: tr
        ? "Sıcak havalarda gün boyunca düzenli su tüketin."
        : "Drink water regularly throughout the day.",
      priority: 7,
    });
    if (isClearCode(weatherCode)) {
      items.push({
        id: "sunscreen",
        category: "health",
        title: tr ? "Güneş kremi" : "Sunscreen",
        detail: tr
          ? "Açık havada SPF koruması unutmayın."
          : "Don't skip SPF when spending time outdoors.",
        priority: 6,
      });
    }
  } else if (tempMaxC >= 18 && tempMinC >= 10) {
    items.push({
      id: "light-jacket",
      category: "clothing",
      title: tr ? "İnce ceket veya hırka" : "Light jacket or cardigan",
      detail: tr
        ? "Gün içi ılık, akşam serin olabilir; katmanlı giyin."
        : "Mild days can cool off — layering works well.",
      priority: 5,
    });
  }

  if (windKmh >= 25) {
    items.push({
      id: "windbreaker",
      category: "clothing",
      title: tr ? "Rüzgarlık tercih et" : "Wear a windbreaker",
      detail: tr
        ? `${windKmh} km/s rüzgar hissedilen sıcaklığı düşürür.`
        : `${windKmh} km/h wind lowers the felt temperature.`,
      priority: 7,
    });
  }

  if (humidity >= 80 && tempC >= 18) {
    items.push({
      id: "breathable-fabric",
      category: "clothing",
      title: tr ? "Nefes alan kumaş" : "Breathable fabrics",
      detail: tr
        ? `%${humidity} nem bunaltıcı olabilir; sentetik yerine doğal kumaş seçin.`
        : `${humidity}% humidity can feel sticky — prefer natural fabrics.`,
      priority: 5,
    });
  }

  if (isFogCode(weatherCode)) {
    items.push({
      id: "visibility",
      category: "commute",
      title: tr ? "Görüş mesafesi düşük" : "Low visibility",
      detail: tr
        ? "Sisli havalarda araç kullanırken ekstra dikkatli olun."
        : "Drive carefully and allow extra time in fog.",
      priority: 9,
    });
  }

  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    items.push({
      id: "stay-indoors",
      category: "activity",
      title: tr ? "Mümkünse iç mekân" : "Stay indoors if possible",
      detail: tr
        ? "Fırtına veya dolu riski — açık alanda uzun süre kalmayın."
        : "Storm or hail risk — avoid extended time outdoors.",
      priority: 10,
    });
  } else if (isClearCode(weatherCode) && !isRainCode(weatherCode) && tempC >= 12 && tempC <= 26) {
    items.push({
      id: "outdoor-walk",
      category: "activity",
      title: tr ? "Açık hava yürüyüşü" : "Outdoor walk",
      detail: tr
        ? "Hava yürüyüş ve kısa park molası için uygun görünüyor."
        : "Great conditions for a walk or a short park break.",
      priority: 4,
    });
  }

  if (weatherCode === 3 && !isRainCode(weatherCode)) {
    items.push({
      id: "indoor-plan",
      category: "activity",
      title: tr ? "Kapalı mekân alternatifi" : "Indoor backup plan",
      detail: tr
        ? "Kapalı hava; kafe veya müze gibi iç mekân planı yapabilirsiniz."
        : "Overcast skies — consider a café or museum visit.",
      priority: 3,
    });
  }

  if (items.length === 0) {
    items.push({
      id: "default",
      category: "activity",
      title: tr ? "Günlük rutine devam" : "Stick to your routine",
      detail: tr
        ? "Belirgin bir hava riski yok; hafif katmanlı giyinmek yeterli olabilir."
        : "No major weather risks — light layers should be fine.",
      priority: 1,
    });
  }

  return items
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
}
