/**
 * Bubilet etkinlik scraper (Puppeteer + JSON-LD)
 *
 * Şehir listesi:
 *   bun concert-list/scrape/scrape-bubilet.ts --city kahramanmaras
 *
 * Tek etkinlik:
 *   bun concert-list/scrape/scrape-bubilet.ts --event "https://www.bubilet.com.tr/kahramanmaras/etkinlik/soner-sarikabadayi-konseri-"
 *
 * DB sync:
 *   bun concert-list/scrape/scrape-bubilet.ts --city kahramanmaras --sync
 *
 * Encore ortamında:
 *   encore exec -- bun concert-list/scrape/scrape-bubilet.ts --city kahramanmaras --sync
 *
 * Çıktı: concert-list/data/scraped-bubilet.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Page } from "puppeteer";
import { launchBrowser } from "../../workplaces/scrape/scrape-google-maps";
import type { ScrapedBubiletEvent } from "./lib/parse-bubilet";
import { syncBubiletEvents } from "./lib/import-bubilet";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_JSON = path.resolve(__dirname, "../data/scraped-bubilet.json");

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function scrapeEventPageLive(page: Page, url: string): Promise<ScrapedBubiletEvent | null> {
  console.log(`  → ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await sleep(3500);

  return page.evaluate((pageUrl) => {
    function normalizeUrl(input: string): string {
      if (input.startsWith("http")) return input.split("?")[0];
      return `https://www.bubilet.com.tr${input.startsWith("/") ? "" : "/"}${input}`.split("?")[0];
    }

    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((node) => {
        try {
          return JSON.parse(node.textContent || "");
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const event = scripts.find((s: any) => s["@type"] === "Event");
    const title = event?.name?.trim() || document.querySelector("h1")?.textContent?.trim();
    if (!title) return null;

    const tags = [...document.querySelectorAll('a[href*="/etiket/"]')]
      .map((a) => a.textContent?.trim() || "")
      .filter(Boolean);

    const breadcrumbs = scripts
      .filter((s: any) => s["@type"] === "BreadcrumbList")
      .flatMap((s: any) => (s.itemListElement || []).map((item: any) => item.name || ""));

    const haystack = [...tags, ...breadcrumbs, title].join(" ").toLowerCase();
    if (/sinema|film gösterimi|belgesel/.test(haystack)) return null;

    let eventType: "concert" | "standup" | "theater" | "other" = "other";
    if (/stand.?up|standup|komedi gecesi|komedyen/.test(haystack)) eventType = "standup";
    else if (/tiyatro|tiyatr|oyun|gösteri|musical|opera|bale|dans gösterisi/.test(haystack)) eventType = "theater";
    else if (/konser|canlı müzik|festival|\bdj\b/.test(haystack) || /\bkonseri\b/i.test(title)) eventType = "concert";

    const categoryLabel =
      eventType === "concert" ? "Konser" : eventType === "standup" ? "Stand-up" : eventType === "theater" ? "Tiyatro" : "Etkinlik";

    const startAt =
      event?.startDate || document.querySelector('meta[name="event:start_time"]')?.getAttribute("content") || "";
    if (!startAt) return null;

    const d = new Date(startAt);
    const date = d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
    const time = d.toLocaleTimeString("tr-TR", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const performers = (event?.performer || [])
      .map((p: any) => p.name?.trim())
      .filter((p: string) => p && !/^sanatçı$/i.test(p));

    let artist = title.replace(/\s+Konseri$/i, "").trim();
    if (performers.length === 1) artist = performers[0];
    else if (performers.length > 1) artist = performers.find((p: string) => !/^sanatçı$/i.test(p)) || performers[0];

    const canonical = normalizeUrl(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
        document.querySelector('meta[property="og:url"]')?.getAttribute("content") ||
        pageUrl,
    );

    const venueName =
      event?.location?.name?.trim() ||
      document.querySelector('a[href*="/mekan/"]')?.textContent?.trim() ||
      "Bilinmeyen Mekan";

    const image = event?.image;
    const imageUrl = Array.isArray(image) ? image[0] : image || document.querySelector('meta[property="og:image"]')?.getAttribute("content") || undefined;

    const offers = event?.offers;
    const priceFrom = offers?.lowPrice ?? offers?.price ?? undefined;
    const description = event?.description?.trim() || document.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() || undefined;

    const descParts = [
      description && description !== title ? description : null,
      priceFrom != null ? `Bubilet — ${priceFrom}₺'den` : "Bubilet",
      time ? `Saat: ${time}` : null,
    ].filter(Boolean);

    const cityMatch = canonical.match(/bubilet\.com\.tr\/([^/]+)\/etkinlik\//i);
    const slug = canonical.replace(/\/$/, "").split("/").pop() || canonical;

    return {
      bubiletUrl: canonical,
      bubiletSlug: slug,
      title,
      artist,
      eventType,
      categoryLabel,
      date,
      time,
      startAt,
      venueName,
      venueSlug: document.querySelector('a[href*="/mekan/"]')?.getAttribute("href")?.replace(/^\//, "") || undefined,
      venueAddress: event?.location?.address?.streetAddress,
      latitude: event?.location?.geo?.latitude,
      longitude: event?.location?.geo?.longitude,
      city: cityMatch?.[1] || "kahramanmaras",
      imageUrl,
      description: descParts.join(" · "),
      priceFrom,
      priceCurrency: offers?.priceCurrency,
      tags,
      scrapedAt: new Date().toISOString(),
    };
  }, url);
}

async function scrapeCity(city: string): Promise<ScrapedBubiletEvent[]> {
  const browser = await launchBrowser(hasFlag("--headed"));
  const page = await browser.newPage();
  const cityUrl = `https://www.bubilet.com.tr/${city}`;

  try {
    console.log(`🏙️  Şehir sayfası: ${cityUrl}`);
    await page.goto(cityUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
    await sleep(4000);

    const eventUrls = await page.evaluate((citySlug) => {
      const prefix = `/${citySlug}/etkinlik/`;
      const urls = new Set<string>();
      for (const a of document.querySelectorAll(`a[href*="${prefix}"]`)) {
        const href = a.getAttribute("href");
        if (!href) continue;
        const full = href.startsWith("http") ? href : `https://www.bubilet.com.tr${href.startsWith("/") ? "" : "/"}${href}`;
        urls.add(full.split("?")[0]);
      }
      return [...urls];
    }, city);

    console.log(`📋 ${eventUrls.length} etkinlik bulundu`);

    const events: ScrapedBubiletEvent[] = [];
    for (const url of eventUrls) {
      const event = await scrapeEventPageLive(page, url);
      if (event) {
        events.push(event);
        console.log(`   ✓ ${event.categoryLabel}: ${event.title} (${event.date} ${event.time})`);
      } else {
        console.log(`   ⊘ atlandı: ${url}`);
      }
      await sleep(1200);
    }

    return events;
  } finally {
    await browser.close();
  }
}

async function scrapeSingleEvent(url: string): Promise<ScrapedBubiletEvent | null> {
  const browser = await launchBrowser(hasFlag("--headed"));
  const page = await browser.newPage();
  try {
    return await scrapeEventPageLive(page, url);
  } finally {
    await browser.close();
  }
}

function mergeEvents(existing: ScrapedBubiletEvent[], incoming: ScrapedBubiletEvent[]): ScrapedBubiletEvent[] {
  const map = new Map<string, ScrapedBubiletEvent>();
  for (const item of existing) map.set(item.bubiletUrl, item);
  for (const item of incoming) map.set(item.bubiletUrl, item);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  const city = getArg("--city");
  const eventUrl = getArg("--event");
  const dryRun = hasFlag("--dry-run");
  const shouldSync = hasFlag("--sync");

  if (!city && !eventUrl) {
    console.error("Kullanım: --city kahramanmaras | --event <url> [--sync] [--dry-run] [--headed]");
    process.exit(1);
  }

  let events: ScrapedBubiletEvent[] = [];

  if (eventUrl) {
    const one = await scrapeSingleEvent(eventUrl);
    if (one) events = [one];
  } else if (city) {
    events = await scrapeCity(city);
  }

  if (events.length === 0) {
    console.error("❌ Scrape edilen etkinlik yok");
    process.exit(1);
  }

  let merged = events;
  if (fs.existsSync(OUT_JSON)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT_JSON, "utf-8")) as ScrapedBubiletEvent[];
      merged = mergeEvents(existing, events);
    } catch {
      merged = events;
    }
  }

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`📂 ${OUT_JSON} (${merged.length} etkinlik)`);

  if (shouldSync) {
    console.log("🔄 DB sync...");
    const result = await syncBubiletEvents(events, dryRun);
    console.log("✅ Sync özeti:", JSON.stringify(result, null, 2));
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("scrape-bubilet.ts")) {
  main().catch((err) => {
    console.error("❌", err);
    process.exit(1);
  });
}

export { scrapeCity, scrapeSingleEvent, scrapeEventPageLive };
