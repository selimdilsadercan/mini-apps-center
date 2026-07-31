export type BubiletEventType = "concert" | "standup" | "theater" | "skip" | "other";

export interface ScrapedBubiletEvent {
  bubiletUrl: string;
  bubiletSlug: string;
  title: string;
  artist: string;
  eventType: BubiletEventType;
  categoryLabel: string;
  date: string;
  time: string;
  startAt: string;
  venueName: string;
  venueSlug?: string;
  venueAddress?: string;
  latitude?: number;
  longitude?: number;
  city: string;
  imageUrl?: string;
  description?: string;
  priceFrom?: number;
  priceCurrency?: string;
  tags: string[];
  scrapedAt: string;
}

interface JsonLdNode {
  "@type"?: string;
  name?: string;
  startDate?: string;
  description?: string;
  location?: {
    name?: string;
    address?: { streetAddress?: string; addressLocality?: string };
    geo?: { latitude?: number; longitude?: number };
  };
  image?: string | string[];
  offers?: {
    lowPrice?: number;
    highPrice?: number;
    price?: number;
    priceCurrency?: string;
    url?: string;
  };
  performer?: Array<{ name?: string }>;
}

function normalizeUrl(url: string, base = "https://www.bubilet.com.tr"): string {
  if (url.startsWith("http")) return url.split("?")[0];
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`.split("?")[0];
}

function slugFromUrl(url: string): string {
  const parts = url.replace(/\/$/, "").split("/");
  return parts[parts.length - 1] || url;
}

function cityFromUrl(url: string): string {
  const match = url.match(/bubilet\.com\.tr\/([^/]+)\/etkinlik\//i);
  return match?.[1] || "kahramanmaras";
}

export function parseArtistFromTitle(title: string, performers: string[] = []): string {
  const cleanedPerformers = performers.filter(
    (p) => p && !/^sanatçı$/i.test(p.trim()) && p.trim().length > 1,
  );
  if (cleanedPerformers.length === 1) return cleanedPerformers[0];
  if (cleanedPerformers.length > 1 && !/^sanatçı$/i.test(cleanedPerformers[0])) {
    return cleanedPerformers.find((p) => !/^sanatçı$/i.test(p)) || cleanedPerformers[0];
  }

  return title
    .replace(/\s+Konseri$/i, "")
    .replace(/\s+Stand\s*Up.*$/i, "")
    .replace(/\s+Tiyatro\s*Oyunu$/i, "")
    .trim();
}

export function detectEventType(tags: string[], breadcrumbs: string[], title: string): BubiletEventType {
  const haystack = [...tags, ...breadcrumbs, title].join(" ").toLowerCase();

  if (/sinema|film gösterimi|belgesel/.test(haystack)) return "skip";
  if (/stand.?up|standup|komedi gecesi|komedyen/.test(haystack)) return "standup";
  if (/tiyatro|tiyatr|oyun|gösteri|musical|opera|bale|dans gösterisi/.test(haystack)) return "theater";
  if (/konser|canlı müzik|festival|\bdj\b/.test(haystack)) return "concert";
  if (/\bkonseri\b/i.test(title)) return "concert";

  return "other";
}

export function categoryLabelFor(type: BubiletEventType): string {
  switch (type) {
    case "concert":
      return "Konser";
    case "standup":
      return "Stand-up";
    case "theater":
      return "Tiyatro";
    case "skip":
      return "Sinema";
    default:
      return "Etkinlik";
  }
}

export function toTurkeyDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  const time = d.toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

function pickEventJsonLd(scripts: JsonLdNode[]): JsonLdNode | null {
  return scripts.find((s) => s["@type"] === "Event") || null;
}

function collectJsonLd(document: Document): JsonLdNode[] {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => {
      try {
        return JSON.parse(node.textContent || "") as JsonLdNode;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as JsonLdNode[];
}

function collectTags(document: Document): string[] {
  return [...document.querySelectorAll('a[href*="/etiket/"]')]
    .map((a) => a.textContent?.trim() || "")
    .filter(Boolean);
}

function collectBreadcrumbs(document: Document): string[] {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((node) => {
      try {
        const data = JSON.parse(node.textContent || "");
        if (data["@type"] !== "BreadcrumbList") return [];
        return (data.itemListElement || []).map((item: { name?: string }) => item.name || "");
      } catch {
        return [];
      }
    })
    .filter(Boolean);
}

function firstImage(image?: string | string[]): string | undefined {
  if (!image) return undefined;
  return Array.isArray(image) ? image[0] : image;
}

function venueSlugFromPage(document: Document): string | undefined {
  const href = document.querySelector('a[href*="/mekan/"]')?.getAttribute("href") || undefined;
  if (!href) return undefined;
  return href.replace(/^\//, "");
}

export function parseBubiletHtml(url: string, document: Document): ScrapedBubiletEvent | null {
  const canonical = normalizeUrl(
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
      document.querySelector('meta[property="og:url"]')?.getAttribute("content") ||
      url,
  );

  const jsonLd = collectJsonLd(document);
  const event = pickEventJsonLd(jsonLd);
  const title =
    event?.name?.trim() ||
    document.querySelector("h1")?.textContent?.trim() ||
    document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim();

  if (!title) return null;

  const tags = collectTags(document);
  const breadcrumbs = collectBreadcrumbs(document);
  const eventType = detectEventType(tags, breadcrumbs, title);
  if (eventType === "skip") return null;

  const performers = (event?.performer || [])
    .map((p) => p.name?.trim())
    .filter(Boolean) as string[];

  const startAt = event?.startDate || document.querySelector('meta[name="event:start_time"]')?.getAttribute("content") || "";
  if (!startAt) return null;

  const { date, time } = toTurkeyDateTime(startAt);
  const venueName =
    event?.location?.name?.trim() ||
    document.querySelector('a[href*="/mekan/"]')?.textContent?.trim() ||
    "Bilinmeyen Mekan";

  const offers = event?.offers;
  const priceFrom = offers?.lowPrice ?? offers?.price ?? undefined;

  const description =
    event?.description?.trim() ||
    document.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() ||
    undefined;

  const imageUrl =
    firstImage(event?.image) ||
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
    undefined;

  const descParts = [
    description && description !== title ? description : null,
    priceFrom != null ? `Bubilet — ${priceFrom}${offers?.priceCurrency === "TRY" ? "₺" : ""}'den` : "Bubilet",
    time ? `Saat: ${time}` : null,
  ].filter(Boolean);

  return {
    bubiletUrl: canonical,
    bubiletSlug: slugFromUrl(canonical),
    title,
    artist: parseArtistFromTitle(title, performers),
    eventType,
    categoryLabel: categoryLabelFor(eventType),
    date,
    time,
    startAt,
    venueName,
    venueSlug: venueSlugFromPage(document),
    venueAddress: event?.location?.address?.streetAddress,
    latitude: event?.location?.geo?.latitude,
    longitude: event?.location?.geo?.longitude,
    city: cityFromUrl(canonical),
    imageUrl,
    description: descParts.join(" · "),
    priceFrom,
    priceCurrency: offers?.priceCurrency,
    tags,
    scrapedAt: new Date().toISOString(),
  };
}

export function collectCityEventUrls(document: Document, city: string): string[] {
  const base = "https://www.bubilet.com.tr";
  const prefix = `/${city}/etkinlik/`;
  const urls = new Set<string>();

  for (const a of document.querySelectorAll(`a[href*="${prefix}"]`)) {
    const href = a.getAttribute("href");
    if (!href) continue;
    urls.add(normalizeUrl(href, base));
  }

  return [...urls];
}
