/**
 * Google Maps sayfasını Puppeteer ile açıp mekan verisi toplar (API yok).
 *
 * Mod 1 — Liste:
 *   bun workplaces/scrape/scrape-google-maps.ts --list "https://www.google.com/maps/..."
 *
 * Mod 2 — Tek mekan:
 *   bun workplaces/scrape/scrape-google-maps.ts --place "https://www.google.com/maps/place/..."
 *
 * Mod 3 — CSV'deki URL'leri zenginleştir:
 *   bun workplaces/scrape/scrape-google-maps.ts --from-csv workplaces/data/mekanlar.csv
 *
 * Çıktı: workplaces/data/scraped-mekanlar.json
 * DB sync: --sync veya bun run workplaces:sync
 */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Browser, Page } from "puppeteer";
import {
  extractFtid,
  normalizeCategory,
  parseVenueCsv,
  scrapedPlacesToImportVenues,
  syncVenuesToDb,
  collectDedupeKeys,
  isUrlAlreadyKnown,
  loadExistingDedupeKeysFromDb,
  type PrimaryType,
} from "./lib/import-venues";

puppeteer.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const OUT_JSON = path.join(DATA_DIR, "scraped-mekanlar.json");

export interface ScrapedPlace {
  name: string;
  url: string;
  address?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  review_count?: number;
  maps_category?: string;
  types?: string[];
  note?: string;
  opening_hours?: OpeningHours;
}

export interface OpeningHours {
  is_open_now?: boolean;
  summary?: string;
  schedule: Record<string, string>;
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseCoordsFromUrl(url: string): { lat?: number; lng?: number } {
  const d3d4 = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (d3d4) return { lat: parseFloat(d3d4[1]), lng: parseFloat(d3d4[2]) };

  const at = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };

  return {};
}

function inferTypeFromMapsCategory(category?: string, name?: string): PrimaryType | undefined {
  const text = `${category || ""} ${name || ""}`.toLowerCase();
  if (/tatlı|dessert|bakery|pastane|ice cream|waffle/.test(text)) return "dessert";
  if (/kütüphane|library/.test(text)) return "library";
  if (/cowork/.test(text)) return "coworking";
  if (/cafe|coffee|kahve|çay/.test(text)) return "cafe";
  if (/restaurant|restoran|kebap|burger|pizza|fast food|lokanta/.test(text)) return "restaurant";
  return undefined;
}

function parseDistrict(address?: string): string | undefined {
  if (!address) return undefined;
  const districts = [
    "Onikişubat",
    "Dulkadiroğlu",
    "Pazarcık",
    "Elbistan",
    "Afşin",
    "Göksun",
    "Andırın",
    "Türkoğlu",
    "Çağlayancerit",
    "Nurhak",
    "Ekinözü",
  ];
  for (const d of districts) {
    if (address.toLowerCase().includes(d.toLowerCase())) return d;
  }
  return undefined;
}

function normalizePlaceUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("google") && u.pathname.includes("/maps")) {
      return u.toString().split("?")[0] + (u.search ? u.search : "");
    }
  } catch {
    /* ignore */
  }
  return url;
}

function dedupePlaces(places: ScrapedPlace[]): ScrapedPlace[] {
  const map = new Map<string, ScrapedPlace>();
  for (const p of places) {
    const key = extractFtid(p.url) || p.url || p.name.toLowerCase();
    const existing = map.get(key);
    map.set(key, { ...existing, ...p, name: p.name || existing?.name || "" });
  }
  return [...map.values()].filter((p) => p.name && p.url);
}

function resolveChromePath(): string | undefined {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

export async function launchBrowser(headed: boolean): Promise<Browser> {
  const executablePath = resolveChromePath();
  return puppeteer.launch({
    headless: !headed,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=tr-TR,tr"],
    defaultViewport: { width: 1400, height: 900 },
  });
}

async function gotoMaps(page: Page, url: string) {
  await page.setExtraHTTPHeaders({ "Accept-Language": "tr-TR,tr;q=0.9" });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await sleep(2500);

  // Çerez / consent (varsa)
  try {
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button, div[role='button']")];
      const accept = buttons.find((b) =>
        /kabul|accept|agree|tümünü kabul/i.test(b.textContent || ""),
      );
      accept?.click();
    });
    await sleep(800);
  } catch {
    /* optional */
  }
}

const TR_DAYS = [
  "pazartesi",
  "salı",
  "çarşamba",
  "perşembe",
  "cuma",
  "cumartesi",
  "pazar",
];

function parseNameFromPreview(body: string): string | undefined {
  const patterns = [
    /\[\[\["([^"]{3,200})"/,
    /"title"\s*,\s*"([^"]{3,200})"/,
    /"name"\s*,\s*"([^"]{3,200})"/,
  ];
  for (const re of patterns) {
    const m = body.match(re);
    if (m?.[1] && !isBadPlaceName(m[1])) return m[1];
  }
  return undefined;
}

function nameFromMapsUrl(url: string): string | undefined {
  try {
    const part = decodeURIComponent(url.split("/place/")[1]?.split("/@")[0] || "")
      .replace(/\+/g, " ")
      .trim();
    return part && !isBadPlaceName(part) ? part : undefined;
  } catch {
    return undefined;
  }
}

function isBadPlaceName(name?: string): boolean {
  if (!name?.trim()) return true;
  return /google haritalar|google maps|^maps$|^before you continue/i.test(name.trim());
}

function parseRatingFromPreview(body: string): { rating?: number; review_count?: number } {
  const result: { rating?: number; review_count?: number } = {};

  const ratingValue = body.match(/"ratingValue",\s*"?([\d.,]+)"?/);
  const reviewCount = body.match(/"reviewCount",\s*"?(\d+)"?/);
  if (ratingValue) {
    const r = parseFloat(ratingValue[1].replace(",", "."));
    if (!Number.isNaN(r)) result.rating = r;
  }
  if (reviewCount) {
    const n = parseInt(reviewCount[1], 10);
    if (!Number.isNaN(n)) result.review_count = n;
  }
  if (result.rating != null && result.review_count != null) return result;

  const starBlock = body.match(
    /\[\s*"([\d,.]+)"\s*,\s*null\s*,\s*null\s*,\s*null\s*,\s*null\s*,\s*null\s*,\s*(\d+)\s*\]/,
  );
  if (starBlock) {
    const r = parseFloat(starBlock[1].replace(",", "."));
    const n = parseInt(starBlock[2], 10);
    if (!Number.isNaN(r)) result.rating = result.rating ?? r;
    if (!Number.isNaN(n)) result.review_count = result.review_count ?? n;
  }

  const urc = body.match(/userRatingCount[^0-9]{0,24}(\d+)/i);
  if (urc) {
    const n = parseInt(urc[1], 10);
    if (!Number.isNaN(n)) result.review_count = result.review_count ?? n;
  }

  const ratingPair = body.match(/,([\d.]+),(\d{1,7}),/);
  if (ratingPair) {
    const r = parseFloat(ratingPair[1]);
    const n = parseInt(ratingPair[2], 10);
    if (!Number.isNaN(r) && r <= 5) result.rating = result.rating ?? r;
    if (!Number.isNaN(n) && n > 0) result.review_count = result.review_count ?? n;
  }

  return result;
}

function parseHoursFromPreview(body: string): OpeningHours | undefined {
  const schedule: Record<string, string> = {};
  const re =
    /"(Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar)",\d+,\[[^\]]+\],\[\["([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const day = m[1].toLowerCase();
    const hours = m[2];
    const existing = schedule[day];
    if (!existing) {
      schedule[day] = hours;
      continue;
    }
    // Aynı gün için birden fazla kayıt varsa 24 saat olanı tercih et
    if (/24\s*saat/i.test(hours)) schedule[day] = hours;
  }
  if (Object.keys(schedule).length === 0) return undefined;
  return { schedule };
}

function expandUniformHours(hours: OpeningHours): OpeningHours {
  const values = [...new Set(Object.values(hours.schedule))];
  if (values.length !== 1 || Object.keys(hours.schedule).length >= 7) return hours;
  const value = values[0];
  if (!/24\s*saat|7\s*\/\s*24|open 24/i.test(value)) return hours;

  const schedule: Record<string, string> = {};
  for (const day of TR_DAYS) schedule[day] = value;
  return {
    ...hours,
    schedule,
    summary: hours.summary || value,
    is_open_now: hours.is_open_now ?? true,
  };
}

/** Çalışma saatleri panelini açıp gün/gün saatleri çeker */
async function scrapeOpeningHours(
  page: Page,
  previewBody?: string,
): Promise<OpeningHours | undefined> {
  // Önce JSON-LD dene (daha stabil)
  const fromLd = await page.evaluate(() => {
    const schedule: Record<string, string> = {};
    const dayMap: Record<string, string> = {
      Monday: "pazartesi",
      Tuesday: "salı",
      Wednesday: "çarşamba",
      Thursday: "perşembe",
      Friday: "cuma",
      Saturday: "cumartesi",
      Sunday: "pazar",
    };

    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    for (const script of scripts) {
      try {
        const raw = JSON.parse(script.textContent || "");
        const nodes = Array.isArray(raw) ? raw : raw["@graph"] ? raw["@graph"] : [raw];
        for (const node of nodes) {
          if (node.openingHours && Array.isArray(node.openingHours)) {
            return { schedule: { all: node.openingHours.join("; ") }, summary: node.openingHours[0] };
          }
          const specs = node.openingHoursSpecification;
          if (specs) {
            const list = Array.isArray(specs) ? specs : [specs];
            for (const spec of list) {
              const days = Array.isArray(spec.dayOfWeek) ? spec.dayOfWeek : [spec.dayOfWeek];
              const hours =
                spec.opens && spec.closes
                  ? `${spec.opens}–${spec.closes}`
                  : "24 saat açık";
              for (const d of days) {
                const key = dayMap[String(d).replace(/^https?:\/\/schema\.org\//, "")] || String(d).toLowerCase();
                schedule[key] = hours;
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
    return Object.keys(schedule).length ? { schedule } : null;
  });

  if (fromLd && Object.keys(fromLd.schedule).length > 0) {
    return { schedule: fromLd.schedule, summary: fromLd.summary };
  }

  // Saatler panelini aç
  const clicked = await page.evaluate(() => {
    const expand = [...document.querySelectorAll("div[role='button'], button")].find((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      return /saat açık|açık ·|kapalı ·|open now|closed now/i.test(t) && t.length < 40;
    }) as HTMLElement | undefined;
    if (expand) {
      expand.click();
      return true;
    }

    const selectors = [
      'button[data-item-id="oh"]',
      'button[aria-label*="Çalışma saati"]',
      'button[aria-label*="Hours"]',
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel) as HTMLButtonElement | null;
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  if (clicked) await sleep(700);

  const hours = await page.evaluate(() => {
    const schedule: Record<string, string> = {};
    let summary: string | undefined;
    let is_open_now: boolean | undefined;

    const ohBtn = document.querySelector('button[data-item-id="oh"]');
    const hoursToggle = [...document.querySelectorAll("div[role='button'], button")].find((el) =>
      /saat açık|açık ·|kapalı ·/i.test(el.textContent || ""),
    );
    summary =
      ohBtn?.textContent?.replace(/\s+/g, " ").trim() ||
      hoursToggle?.textContent?.replace(/\s+/g, " ").trim();
    if (summary) {
      is_open_now = /açık|open/i.test(summary) && !/kapalı|closed/i.test(summary);
    }

    const addRow = (day: string, hoursText: string) => {
      const d = day.trim().toLowerCase();
      const h = hoursText.trim();
      if (d && h && /^(pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar)/i.test(d)) {
        schedule[d] = h;
      }
    };

    const dayPattern =
      /^(Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar)\s+(.+)$/i;

    // Tablo satırları (genişletilmiş panel)
    document.querySelectorAll("table tr").forEach((row) => {
      const cells = [...row.querySelectorAll("td, th")];
      if (cells.length >= 2) {
        addRow(cells[0].textContent || "", cells[1].textContent || "");
      }
    });

    // oh butonunun üst container'ındaki tüm satırlar
    if (Object.keys(schedule).length < 7 && ohBtn) {
      let root: Element | null = ohBtn.parentElement;
      for (let depth = 0; depth < 6 && root; depth++) {
        const rows = root.querySelectorAll("tr, [role='listitem'], li");
        rows.forEach((row) => {
          const cells = [...row.querySelectorAll("td, th, div, span")].filter(
            (c) => (c.textContent || "").trim().length > 0,
          );
          if (cells.length >= 2) {
            addRow(cells[0].textContent || "", cells[1].textContent?.replace(cells[0].textContent || "", "").trim() || cells[1].textContent || "");
          }
          const line = row.textContent?.replace(/\s+/g, " ").trim() || "";
          const m = line.match(dayPattern);
          if (m) addRow(m[1], m[2]);
        });
        if (Object.keys(schedule).length >= 7) break;
        root = root.parentElement;
      }
    }

    // innerText satır satır
    if (Object.keys(schedule).length < 7 && ohBtn) {
      let root: Element | null = ohBtn.parentElement;
      for (let depth = 0; depth < 6 && root; depth++) {
        const text = (root as HTMLElement).innerText || "";
        for (const line of text.split("\n")) {
          const m = line.trim().match(dayPattern);
          if (m) addRow(m[1], m[2]);
        }
        if (Object.keys(schedule).length >= 7) break;
        root = root.parentElement;
      }
    }

    // td + aria-label (Google Maps tablo yapısı)
    document.querySelectorAll("tr").forEach((tr) => {
      const tds = tr.querySelectorAll("td");
      if (tds.length >= 2) {
        const day = tds[0].textContent?.trim() || "";
        const hoursText =
          tds[1].getAttribute("aria-label") || tds[1].textContent?.trim() || "";
        addRow(day, hoursText);
      }
    });

    return { schedule, summary, is_open_now };
  });

  if (Object.keys(hours.schedule).length === 0 && !hours.summary) {
    const fromPreview = previewBody ? parseHoursFromPreview(previewBody) : undefined;
    if (fromPreview) return expandUniformHours({ ...fromPreview, summary: hours.summary, is_open_now: hours.is_open_now });
    return undefined;
  }

  // DOM'da eksik günler varsa preview ile tamamla
  if (previewBody) {
    const fromPreview = parseHoursFromPreview(previewBody);
    if (fromPreview) {
      for (const [day, value] of Object.entries(fromPreview.schedule)) {
        if (!hours.schedule[day]) hours.schedule[day] = value;
      }
    }
  }

  return expandUniformHours(hours);
}

/** Tek mekan detay sayfasından veri çek */
export async function scrapePlacePage(page: Page, url: string): Promise<ScrapedPlace | null> {
  const inputUrl = url;
  let previewBody = "";
  const onResponse = async (res: { url: () => string; text: () => Promise<string> }) => {
    if (res.url().includes("/maps/preview/place")) {
      try {
        previewBody = await res.text();
      } catch {
        /* ignore */
      }
    }
  };
  page.on("response", onResponse);

  await gotoMaps(page, url);
  page.off("response", onResponse);

  await page
    .waitForSelector("h1.DUwDvf, h1", { timeout: 12000 })
    .catch(() => undefined);
  await sleep(1500);

  const currentUrl = page.url();
  const urlCoords = { ...parseCoordsFromUrl(inputUrl), ...parseCoordsFromUrl(currentUrl) };

  const data = await page.evaluate(() => {
    const pickText = (sel: string) => document.querySelector(sel)?.textContent?.trim() || "";

    const parseReviewCount = (text: string): number | undefined => {
      const m = text.match(/([\d.,\s]+)\s*(yorum|review|değerlendirme|ratings?)/i);
      if (!m) return undefined;
      const n = parseInt(m[1].replace(/[\s.,]/g, ""), 10);
      return Number.isNaN(n) ? undefined : n;
    };

    const name =
      pickText("h1.DUwDvf") ||
      pickText("h1") ||
      pickText('[data-attrid="title"]') ||
      document.title.replace(/ - Google Maps.*/, "").trim();

    const addressBtn = document.querySelector('button[data-item-id="address"]');
    const address =
      addressBtn?.getAttribute("aria-label")?.replace(/^Adres:\s*/i, "") ||
      addressBtn?.textContent?.trim() ||
      pickText('[data-item-id="address"]');

    const category =
      pickText('button[jsaction*="category"]') ||
      pickText(".DkEaL") ||
      pickText('[jsaction*="pane.rating.category"]');

    let rating: number | undefined;
    let review_count: number | undefined;

    // JSON-LD aggregateRating
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const raw = JSON.parse(script.textContent || "");
        const nodes = Array.isArray(raw) ? raw : raw["@graph"] ? raw["@graph"] : [raw];
        for (const node of nodes) {
          const agg = node.aggregateRating;
          if (!agg) continue;
          if (agg.ratingValue != null) {
            const r = parseFloat(String(agg.ratingValue).replace(",", "."));
            if (!Number.isNaN(r)) rating = rating ?? r;
          }
          if (agg.reviewCount != null) {
            const n = parseInt(String(agg.reviewCount).replace(/[^\d]/g, ""), 10);
            if (!Number.isNaN(n)) review_count = review_count ?? n;
          }
        }
      } catch {
        /* ignore */
      }
    }

    const ratingEl =
      document.querySelector("div.F7nice span[aria-hidden='true']") ||
      document.querySelector("div.F7nice span");
    if (ratingEl?.textContent) {
      const r = parseFloat(ratingEl.textContent.replace(",", "."));
      if (!Number.isNaN(r) && r <= 5) rating = rating ?? r;
    }

    const reviewLabels: string[] = [];
    const reviewSelectors = [
      'button[jsaction*="reviews"]',
      'button[aria-label*="yorum"]',
      'button[aria-label*="review"]',
      'span[aria-label*="yorum"]',
      'span[aria-label*="review"]',
      'a[aria-label*="yorum"]',
      'a[aria-label*="review"]',
    ];
    for (const sel of reviewSelectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const label = el.getAttribute("aria-label");
        const text = el.textContent?.trim();
        if (label) reviewLabels.push(label);
        if (text) reviewLabels.push(text);
      });
    }

    for (const text of reviewLabels) {
      const n = parseReviewCount(text);
      if (n != null) {
        review_count = review_count ?? n;
        break;
      }
    }

    if (review_count == null) {
      const f7 = document.querySelector("div.F7nice");
      const siblingText = f7?.parentElement?.textContent || "";
      const n = parseReviewCount(siblingText);
      if (n != null) review_count = n;
    }

    return { name, address, category, rating, review_count };
  });

  const fromPreview = previewBody ? parseRatingFromPreview(previewBody) : {};
  const opening_hours = await scrapeOpeningHours(page, previewBody);

  let resolvedName = data.name;
  if (isBadPlaceName(resolvedName)) {
    resolvedName = parseNameFromPreview(previewBody) || nameFromMapsUrl(inputUrl) || resolvedName;
  }
  if (isBadPlaceName(resolvedName)) return null;

  return {
    name: resolvedName,
    url: inputUrl,
    address: data.address || undefined,
    district: parseDistrict(data.address),
    latitude: urlCoords.lat,
    longitude: urlCoords.lng,
    rating: data.rating ?? fromPreview.rating,
    review_count: data.review_count ?? fromPreview.review_count,
    maps_category: data.category || undefined,
    types: inferTypeFromMapsCategory(data.category, data.name) ? [inferTypeFromMapsCategory(data.category, data.name)!] : [],
    opening_hours,
  };
}

/** Google Maps liste sayfasını kaydırıp mekan linklerini topla */
export async function scrapeListPage(page: Page, listUrl: string): Promise<ScrapedPlace[]> {
  await gotoMaps(page, listUrl);

  // Liste panelini kaydır
  await page.evaluate(async () => {
    const feed = document.querySelector('div[role="feed"]');
    if (!feed) return;

    let lastHeight = 0;
    for (let i = 0; i < 30; i++) {
      feed.scrollTop = feed.scrollHeight;
      await new Promise((r) => setTimeout(r, 600));
      if (feed.scrollHeight === lastHeight) break;
      lastHeight = feed.scrollHeight;
    }
  });

  const links = await page.evaluate(() => {
    const seen = new Set<string>();
    const results: Array<{ name: string; url: string; rating?: number; review_count?: number }> = [];

    const parseReviewCount = (text: string): number | undefined => {
      const m = text.match(/([\d.,\s]+)\s*(yorum|review|değerlendirme|ratings?)/i);
      if (!m) return undefined;
      const n = parseInt(m[1].replace(/[\s.,]/g, ""), 10);
      return Number.isNaN(n) ? undefined : n;
    };

    document.querySelectorAll('a[href*="/maps/place/"]').forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      if (!href || seen.has(href)) return;
      seen.add(href);

      const name =
        a.getAttribute("aria-label")?.trim() ||
        a.querySelector(".fontHeadlineSmall")?.textContent?.trim() ||
        a.textContent?.trim() ||
        "";

      if (!name || name.length <= 1) return;

      const card = a.closest('div[role="article"]') || a.parentElement?.parentElement;
      let rating: number | undefined;
      let review_count: number | undefined;

      card?.querySelectorAll("[aria-label]").forEach((el) => {
        const label = el.getAttribute("aria-label") || "";
        if (/yıldız|star/i.test(label)) {
          const r = parseFloat(label.replace(",", ".").match(/[\d.]+/)?.[0] || "");
          if (!Number.isNaN(r) && r <= 5) rating = rating ?? r;
        }
        const n = parseReviewCount(label);
        if (n != null) review_count = review_count ?? n;
      });

      results.push({ name, url: href, rating, review_count });
    });

    return results;
  });

  console.log(`  📋 Listede ${links.length} mekan linki bulundu.`);

  const places: ScrapedPlace[] = links.map((l) => ({
    name: l.name,
    url: normalizePlaceUrl(l.url),
    ...parseCoordsFromUrl(l.url),
    rating: l.rating,
    review_count: l.review_count,
    types: inferTypeFromMapsCategory(undefined, l.name) ? [inferTypeFromMapsCategory(undefined, l.name)!] : [],
  }));

  return dedupePlaces(places);
}

/** Liste linklerini tek tek açıp detay doldur */
async function enrichPlaces(
  browser: Browser,
  places: ScrapedPlace[],
  defaultCategory?: PrimaryType,
): Promise<ScrapedPlace[]> {
  const page = await browser.newPage();
  const result: ScrapedPlace[] = [];

  for (let i = 0; i < places.length; i++) {
    const seed = places[i];
    process.stdout.write(`  [${i + 1}/${places.length}] ${seed.name.slice(0, 45)}...\r`);

    try {
      const detailed = await scrapePlacePage(page, seed.url);
      if (detailed) {
        result.push({
          ...seed,
          ...detailed,
          types:
            seed.types ||
            detailed.types ||
            (defaultCategory ? [defaultCategory] : []),
        });
      } else {
        result.push({
          ...seed,
          types: seed.types || (defaultCategory ? [defaultCategory] : []),
        });
      }
    } catch (err) {
      console.warn(`\n  ⚠️ Atlandı (${seed.name}):`, err);
      result.push({
        ...seed,
        types: seed.types || (defaultCategory ? [defaultCategory] : []),
      });
    }

    await sleep(1200);
  }

  await page.close();
  console.log("");
  return result;
}

function writeOutput(places: ScrapedPlace[], options?: { merge?: boolean }) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  let output = places;
  if (options?.merge && fs.existsSync(OUT_JSON)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT_JSON, "utf-8")) as ScrapedPlace[];
      output = dedupePlaces([...existing, ...places]);
      console.log(`🔀 JSON birleştirildi: ${existing.length} mevcut + ${places.length} yeni → ${output.length} toplam`);
    } catch {
      /* yeni dosya yaz */
    }
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), "utf-8");
  console.log(`📂 ${OUT_JSON}`);
}

async function loadSkipKeys(): Promise<Set<string>> {
  const keys = new Set<string>();

  if (fs.existsSync(OUT_JSON)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUT_JSON, "utf-8")) as ScrapedPlace[];
      for (const key of collectDedupeKeys(existing)) keys.add(key);
    } catch {
      /* ignore */
    }
  }

  const dbKeys = await loadExistingDedupeKeysFromDb();
  for (const key of dbKeys) keys.add(key);

  return keys;
}

async function main() {
  const listUrl = getArg("--list");
  const placeUrl = getArg("--place");
  const urlsFile = getArg("--urls-file");
  const fromCsv = getArg("--from-csv");
  const defaultCategory = normalizeCategory(getArg("--category")) || undefined;
  const headed = process.argv.includes("--headed");
  const enrich = process.argv.includes("--enrich") || !!fromCsv;
  const localHtml = getArg("--local-html");
  const syncDb = process.argv.includes("--sync");
  const syncDryRun = process.argv.includes("--sync-dry-run");
  const skipExisting = process.argv.includes("--skip-existing");
  const mergeOutput = process.argv.includes("--merge") || !!urlsFile;

  let browser: Browser | null = null;

  try {
    console.log("🚀 Google Maps scraper (Puppeteer, API yok)");

    if (localHtml) {
      browser = await launchBrowser(headed);
      const page = await browser.newPage();
      const html = fs.readFileSync(path.resolve(localHtml), "utf-8");
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const places = await page.evaluate(() => {
        const results: Array<{ name: string; url: string }> = [];
        document.querySelectorAll('a[href*="/maps/place/"]').forEach((a) => {
          const name = a.getAttribute("aria-label") || a.textContent?.trim() || "";
          const url = (a as HTMLAnchorElement).href;
          if (name && url) results.push({ name, url });
        });
        return results;
      });
      writeOutput(
        dedupePlaces(
          places.map((p) => ({
            name: p.name,
            url: p.url,
            types: inferTypeFromMapsCategory(undefined, p.name) ? [inferTypeFromMapsCategory(undefined, p.name)!] : (defaultCategory ? [defaultCategory] : []),
          })),
        ),
      );
      return;
    }

    if (!listUrl && !placeUrl && !fromCsv && !urlsFile) {
      console.error(`
Kullanım:
  --list <google_maps_liste_url>     Paylaşılan liste sayfası
  --place <google_maps_mekan_url>    Tek mekan
  --urls-file <dosya.txt>            Her satırda bir Maps URL
  --from-csv <dosya.csv>             CSV'deki URL kolonunu zenginleştir
  --category sit|eat|dessert|work    Varsayılan kategori
  --enrich                           Liste modunda her mekanı tek tek aç (adres+koordinat)
  --sync                             Scrape sonrası DB'ye yaz (insert + update)
  --sync-dry-run                     Sync önizlemesi
  --skip-existing                    DB/JSON'da olan URL'leri scrape etme
  --merge                            Çıktıyı scraped-mekanlar.json ile birleştir (urls-file varsayılan)
  --headed                           Tarayıcıyı görünür aç (debug)
  --local-html <kaydedilmiş.html>    Offline HTML test
`);
      process.exit(1);
    }

    browser = await launchBrowser(headed);
    let places: ScrapedPlace[] = [];

    if (urlsFile) {
      const filePath = path.resolve(urlsFile);
      let urls = fs
        .readFileSync(filePath, "utf-8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith("http"));

      if (skipExisting) {
        const skipKeys = await loadSkipKeys();
        const before = urls.length;
        urls = urls.filter((url) => !isUrlAlreadyKnown(url, skipKeys));
        console.log(`⏭️  ${before - urls.length} URL zaten kayıtlı — scrape atlandı`);
      }

      console.log(`📄 ${urls.length} URL scrape edilecek...`);
      const page = await browser.newPage();
      for (let i = 0; i < urls.length; i++) {
        process.stdout.write(`  [${i + 1}/${urls.length}] scraping...\r`);
        const one = await scrapePlacePage(page, urls[i]);
        if (one) {
          places.push({ ...one, types: one.types || (defaultCategory ? [defaultCategory] : []) });
        } else {
          console.warn(`\n  ⚠️ Atlandı: ${urls[i]}`);
        }
        await sleep(1200);
      }
      await page.close();
      console.log("");
    } else if (placeUrl) {
      const page = await browser.newPage();
      const one = await scrapePlacePage(page, placeUrl);
      if (!one) throw new Error("Mekan verisi alınamadı.");
      places = [{ ...one, types: one.types || (defaultCategory ? [defaultCategory] : []) }];
      await page.close();
    } else if (listUrl) {
      const page = await browser.newPage();
      places = await scrapeListPage(page, listUrl);
      await page.close();

      if (enrich && places.length > 0) {
        console.log(`\n🔍 ${places.length} mekan için detay sayfası açılıyor...`);
        places = await enrichPlaces(browser, places, defaultCategory);
      } else {
        places = places.map((p) => ({
          ...p,
          types: p.types || (defaultCategory ? [defaultCategory] : []),
        }));
      }
    } else if (fromCsv) {
      const csvPath = path.resolve(fromCsv);
      const rows = parseVenueCsv(fs.readFileSync(csvPath, "utf-8"), path.basename(csvPath), defaultCategory);
      const seeds: ScrapedPlace[] = rows
        .filter((r) => r.url)
        .map((r) => ({
          name: r.name,
          url: r.url!,
          address: r.address,
          district: r.district,
          latitude: r.latitude,
          longitude: r.longitude,
          types: r.types,
          note: r.note,
        }));

      console.log(`📄 ${seeds.length} URL zenginleştirilecek...`);
      places = await enrichPlaces(browser, seeds, defaultCategory);
    }

    places = dedupePlaces(places);
    console.log(`\n✅ ${places.length} mekan toplandı`);
    writeOutput(places, { merge: mergeOutput });

    if (syncDb || syncDryRun) {
      try {
        const { secret } = await import("encore.dev/config");
        process.env.SUPABASE_URL = secret("SupabaseUrl")();
        process.env.SUPABASE_ANON_KEY = secret("SupabaseAnonKey")();
      } catch {
        /* encore dışı çalıştırma */
      }

      const venues = scrapedPlacesToImportVenues(places, "scrape-google-maps", defaultCategory);
      console.log(`\n🔄 DB sync (${syncDryRun ? "dry-run" : "canlı"})...`);
      const { inserted, updated, skipped } = await syncVenuesToDb(venues, syncDryRun);
      console.log(`💾 ${inserted} eklendi, ${updated} güncellendi, ${skipped} hata/atlandı`);
    } else {
      console.log("\nSonraki adım:");
      console.log("  bun run workplaces:sync");
      console.log("  veya: --sync ile scrape + sync birlikte");
    }
  } finally {
    if (browser) await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("❌ Hata:", err);
    process.exit(1);
  });
}
