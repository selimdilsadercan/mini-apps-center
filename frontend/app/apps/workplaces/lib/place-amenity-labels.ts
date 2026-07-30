export const areaLabels: Record<string, string> = {
  INDOOR: "İç Mekan",
  GARDEN: "Bahçe",
  TERRACE: "Teras",
  STUDY_ZONE: "Çalışma Masaları",
};

export const parkingLabels: Record<string, string> = {
  NO: "Yok",
  FREE: "Ücretsiz Otopark",
  PAID: "Ücretli Otopark",
  STREET: "Yol Üstü Park",
};

export const priceLabels: Record<string, string> = {
  CHEAP: "Uygun / Ucuz",
  MODERATE: "Orta / Normal",
  EXPENSIVE: "Pahalı / Yüksek",
};

export const wifiLabels: Record<string, string> = {
  NO: "Yok",
  FREE_FAST: "Ücretsiz & Hızlı",
  FREE_SLOW: "Ücretsiz & Yavaş",
  PAID: "Ücretli",
};

export const outletsLabels: Record<string, string> = {
  NO: "Yok",
  PLENTY: "Fazlaca Priz",
  SOME: "Yeterli Priz",
  FEW: "Çok Az Priz",
};

export const viewLabels: Record<string, string> = {
  NO: "Manzara Yok",
  SEA: "Deniz Manzarası",
  PARK: "Park / Yeşil Alan",
  CITY: "Şehir Manzarası",
};

export function formatTo24Hour(text: string): string {
  if (!text) return text;
  return text.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (_match, hh, mm, ampm) => {
    let hour = parseInt(hh, 10);
    const m = ampm.toUpperCase();
    if (m === "PM" && hour < 12) hour += 12;
    else if (m === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${mm}`;
  });
}
