import { type DailyWeatherSnapshot } from "./types";

export interface SmartRecommendationItem {
  id: string;
  text: string;
  type: "warning" | "info" | "success";
  priority: number;
}

/**
 * Calculates smarter algorithmic weather recommendations based on weather parameters.
 */
export function calculateSmartRecommendations(
  weather: DailyWeatherSnapshot,
  t: (key: string, variables?: Record<string, string>) => string
): SmartRecommendationItem[] {
  const recommendations: SmartRecommendationItem[] = [];

  const condLower = weather.condition.toLowerCase();
  const hourlyData = weather.hourlyData ?? [];

  const addRecommendation = (item: SmartRecommendationItem) => {
    const alreadyExists = recommendations.some((r) => r.id === item.id);
    if (!alreadyExists) {
      recommendations.push(item);
    }
  };

  const getHourNumber = (time: string) => {
    return parseInt(time.split(":")[0], 10);
  };

  const tempDiff = weather.tempMaxC - weather.tempMinC;

  const morningTemps = hourlyData.filter((h: { time: string; tempC: number }) => {
    const hour = getHourNumber(h.time);
    return hour >= 6 && hour <= 10;
  });

  const afternoonTemps = hourlyData.filter((h: { time: string; tempC: number }) => {
    const hour = getHourNumber(h.time);
    return hour >= 12 && hour <= 17;
  });

  const minMorningTemp =
    morningTemps.length > 0
      ? Math.min(...morningTemps.map((h) => h.tempC))
      : weather.tempMinC;

  const maxAfternoonTemp =
    afternoonTemps.length > 0
      ? Math.max(...afternoonTemps.map((h) => h.tempC))
      : weather.tempMaxC;

  const isRainyCondition =
    condLower.includes("rain") ||
    condLower.includes("drizzle") ||
    condLower.includes("shower") ||
    condLower.includes("thunderstorm") ||
    condLower.includes("yağmur") ||
    condLower.includes("sağanak") ||
    condLower.includes("çisenti") ||
    condLower.includes("dolu") ||
    condLower.includes("hail") ||
    weather.icon === "rain";

  const maxRainProb = weather.maxPrecipitationProbability ?? 0;

  const rainHours = hourlyData.filter((h: { time: string; precipProb: number }) => {
    const hour = getHourNumber(h.time);
    return hour >= 6 && h.precipProb >= 35;
  });

  const morningRainHours = rainHours.filter((h) => {
    const hour = getHourNumber(h.time);
    return hour >= 6 && hour < 12;
  });

  const afternoonRainHours = rainHours.filter((h) => {
    const hour = getHourNumber(h.time);
    return hour >= 12 && hour < 18;
  });

  const eveningRainHours = rainHours.filter((h) => {
    const hour = getHourNumber(h.time);
    return hour >= 18;
  });

  const isStormy =
    condLower.includes("thunderstorm") ||
    condLower.includes("storm") ||
    condLower.includes("fırtına") ||
    condLower.includes("gök gürültülü");

  const isSnowy =
    condLower.includes("snow") ||
    condLower.includes("kar") ||
    condLower.includes("karlı") ||
    condLower.includes("sleet") ||
    condLower.includes("blizzard") ||
    weather.icon === "snow";

  const isFoggy =
    condLower.includes("fog") ||
    condLower.includes("mist") ||
    condLower.includes("sis") ||
    condLower.includes("pus");

  // 1. Storm / severe weather
  if (isStormy) {
    addRecommendation({
      id: "storm",
      text: t("recommendations.storm"),
      type: "warning",
      priority: 100,
    });
  }

  // 2. Snow
  if (isSnowy) {
    addRecommendation({
      id: "snow",
      text: t("recommendations.snow"),
      type: "warning",
      priority: 95,
    });
  }

  // 3. Rain - hourly specific advice
  if (rainHours.length > 0) {
    const firstRainHour = rainHours[0];
    const firstRainHourNumber = getHourNumber(firstRainHour.time);

    if (morningRainHours.length > 0) {
      addRecommendation({
        id: "morningRain",
        text: t("recommendations.morningRain", {
          hour: String(firstRainHourNumber),
          prob: String(firstRainHour.precipProb),
        }),
        type: "warning",
        priority: 90,
      });
    } else if (afternoonRainHours.length > 0) {
      addRecommendation({
        id: "afternoonRain",
        text: t("recommendations.afternoonRain", {
          hour: String(firstRainHourNumber),
          prob: String(firstRainHour.precipProb),
        }),
        type: "warning",
        priority: 85,
      });
    } else if (eveningRainHours.length > 0) {
      addRecommendation({
        id: "eveningRain",
        text: t("recommendations.eveningRain", {
          hour: String(firstRainHourNumber),
          prob: String(firstRainHour.precipProb),
        }),
        type: "warning",
        priority: 80,
      });
    }
  } else if (maxRainProb >= 50) {
    addRecommendation({
      id: "umbrellaHigh",
      text: t("recommendations.umbrellaHigh", {
        prob: String(maxRainProb),
      }),
      type: "warning",
      priority: 75,
    });
  } else if (maxRainProb >= 30) {
    addRecommendation({
      id: "umbrellaMedium",
      text: t("recommendations.umbrellaMedium", {
        prob: String(maxRainProb),
      }),
      type: "info",
      priority: 55,
    });
  } else if (isRainyCondition && maxRainProb >= 15) {
    addRecommendation({
      id: "lightRainChance",
      text: t("recommendations.lightRainChance", {
        prob: String(maxRainProb),
      }),
      type: "info",
      priority: 42,
    });
  }

  // 4. Wind recommendations
  if (weather.windKmh >= 50) {
    addRecommendation({
      id: "veryWindy",
      text: t("recommendations.veryWindy", {
        speed: String(weather.windKmh),
      }),
      type: "warning",
      priority: 88,
    });
  } else if (weather.windKmh >= 30) {
    addRecommendation({
      id: "windy",
      text: t("recommendations.windy", {
        speed: String(weather.windKmh),
      }),
      type: "info",
      priority: 70,
    });
  } else if (weather.windKmh >= 20) {
    addRecommendation({
      id: "breezy",
      text: t("recommendations.breezy", {
        speed: String(weather.windKmh),
      }),
      type: "info",
      priority: 45,
    });
  }

  // 5. Fog
  if (isFoggy) {
    addRecommendation({
      id: "fog",
      text: t("recommendations.fog"),
      type: "warning",
      priority: 78,
    });
  }

  // 6. Evening cold
  if (hourlyData.length > 0) {
    const coldEveningHours = hourlyData.filter((h: { time: string; tempC: number }) => {
      const hour = getHourNumber(h.time);
      return hour >= 17 && h.tempC < 16;
    });

    if (coldEveningHours.length > 0) {
      const firstColdHour = coldEveningHours[0];

      addRecommendation({
        id: "eveningCold",
        text: t("recommendations.eveningCold", {
          hour: firstColdHour.time.split(":")[0],
          temp: String(firstColdHour.tempC),
        }),
        type: "info",
        priority: 65,
      });
    }
  }

  // 7. Morning cold, day gets warmer
  if (minMorningTemp <= 20 && maxAfternoonTemp >= 25 && maxAfternoonTemp - minMorningTemp >= 6) {
    addRecommendation({
      id: "coolMorningWarmDay",
      text: t("recommendations.coolMorningWarmDay", {
        morning: String(minMorningTemp),
        afternoon: String(maxAfternoonTemp),
      }),
      type: "info",
      priority: 58,
    });
  } else if (tempDiff >= 10) {
    addRecommendation({
      id: "bigTempDiff",
      text: t("recommendations.bigTempDiff", {
        min: String(weather.tempMinC),
        max: String(weather.tempMaxC),
      }),
      type: "info",
      priority: 50,
    });
  } else if (tempDiff >= 7 && weather.tempMinC < 18) {
    addRecommendation({
      id: "jacket",
      text: t("recommendations.jacket"),
      type: "info",
      priority: 45,
    });
  }

  // 8. Cold weather
  if (weather.tempMaxC < 5) {
    addRecommendation({
      id: "veryCold",
      text: t("recommendations.veryCold"),
      type: "warning",
      priority: 82,
    });
  } else if (weather.tempMaxC < 12) {
    addRecommendation({
      id: "cold",
      text: t("recommendations.cold"),
      type: "info",
      priority: 55,
    });
  }

  // 9. Hot weather
  if (weather.tempMaxC >= 35) {
    addRecommendation({
      id: "extremeHot",
      text: t("recommendations.extremeHot"),
      type: "warning",
      priority: 85,
    });
  } else if (weather.tempMaxC >= 30) {
    addRecommendation({
      id: "hot",
      text: t("recommendations.hot"),
      type: "info",
      priority: 68,
    });
  }

  // 10. Humidity (using the humidity field in weather object)
  if (weather.humidity >= 85 && weather.tempMaxC >= 24) {
    addRecommendation({
      id: "humidHot",
      text: t("recommendations.humidHot", {
        humidity: String(weather.humidity),
      }),
      type: "info",
      priority: 62,
    });
  } else if (weather.humidity >= 85 && weather.tempMaxC < 16) {
    addRecommendation({
      id: "humidCold",
      text: t("recommendations.humidCold", {
        humidity: String(weather.humidity),
      }),
      type: "info",
      priority: 58,
    });
  } else if (weather.humidity <= 30) {
    addRecommendation({
      id: "dryAir",
      text: t("recommendations.dryAir", {
        humidity: String(weather.humidity),
      }),
      type: "info",
      priority: 40,
    });
  }

  // 11. Ideal weather fallback
  const hasBadWeather =
    isStormy ||
    isSnowy ||
    isFoggy ||
    (isRainyCondition && maxRainProb >= 15) ||
    maxRainProb >= 35 ||
    weather.windKmh >= 30 ||
    weather.tempMaxC >= 30 ||
    weather.tempMaxC < 12;

  if (!hasBadWeather && weather.tempMaxC >= 18 && weather.tempMaxC <= 26) {
    addRecommendation({
      id: "ideal",
      text: t("recommendations.ideal"),
      type: "success",
      priority: 35,
    });
  } else if (!hasBadWeather && weather.tempMaxC >= 16 && weather.tempMaxC < 30) {
    addRecommendation({
      id: "moderate",
      text: t("recommendations.moderate"),
      type: "success",
      priority: 30,
    });
  }

  const sortedRecommendations = recommendations.sort((a, b) => b.priority - a.priority);

  if (sortedRecommendations.length === 0) {
    return [];
  }

  const first = sortedRecommendations[0];
  const second = sortedRecommendations[1];

  const shouldCombine =
    second &&
    first.priority >= 55 &&
    second.priority >= 45 &&
    first.type !== "success" &&
    second.type !== "success";

  if (shouldCombine) {
    return [combineRecommendations(first, second, t)];
  }

  return [first];
}

function combineRecommendations(
  first: SmartRecommendationItem,
  second: SmartRecommendationItem,
  t: (key: string, variables?: Record<string, string>) => string
): SmartRecommendationItem {
  const ids = [first.id, second.id];

  const hasRain = ids.some((id) =>
    ["umbrellaHigh", "umbrellaMedium", "lightRainChance", "morningRain", "afternoonRain", "eveningRain"].includes(id)
  );

  const hasWind = ids.some((id) =>
    ["breezy", "windy", "veryWindy"].includes(id)
  );

  const hasCold = ids.some((id) =>
    ["eveningCold", "jacket", "bigTempDiff", "cold", "veryCold", "coolMorningWarmDay"].includes(id)
  );

  if (hasRain && hasWind) {
    return {
      id: "rainWindCombined",
      text: t("recommendations.rainWindCombined"),
      type: "warning",
      priority: Math.max(first.priority, second.priority),
    };
  }

  if (hasRain && hasCold) {
    return {
      id: "rainColdCombined",
      text: t("recommendations.rainColdCombined"),
      type: "warning",
      priority: Math.max(first.priority, second.priority),
    };
  }

  if (hasWind && hasCold) {
    return {
      id: "windColdCombined",
      text: t("recommendations.windColdCombined"),
      type: "info",
      priority: Math.max(first.priority, second.priority),
    };
  }

  // Fallback: join with a neat connective word
  const localizedAlso = t("recommendations.alsoConnector") || " Ayrıca ";
  let secondText = second.text;
  if (secondText.length > 0) {
    secondText = secondText.charAt(0).toLowerCase() + secondText.slice(1);
  }

  return {
    id: `${first.id}_${second.id}`,
    text: `${first.text}${localizedAlso}${secondText}`,
    type: first.type === "warning" || second.type === "warning" ? "warning" : "info",
    priority: Math.max(first.priority, second.priority),
  };
}
