/**
 * Scrape Infotus konu kitapları from tustime.com (12 individual books, no sets/soru bankası)
 *
 * Usage (from backend/):
 *   npx tsx tus-kitap/scrape/scrape_tustime.ts
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INDEX_URL = "https://tustime.com/tus-kitaplarimiz";

const TEMEL_IDS = new Set([
  "anatomi",
  "histolojiembriyoloji",
  "fizyoloji",
  "biyokimya",
  "mikrobiyoloji",
  "patoloji",
  "farmakoloji",
]);

const KLINIK_IDS = new Set([
  "dahiliye",
  "pediatri",
  "kucuk-stajlar",
  "genel-cerrahi",
  "kadin-dogum",
]);

export interface TUSBookSection {
  id: string;
  name: string;
  order: number;
}

export interface TUSBook {
  id: string;
  slug: string;
  name: string;
  category: "temel" | "klinik";
  imageUrl: string;
  productUrl: string;
  price: string | null;
  sections: TUSBookSection[];
}

export interface TUSBooksDataset {
  scrapedAt: string;
  source: string;
  books: TUSBook[];
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#xFC;/g, "ü")
    .replace(/&#xE7;/g, "ç")
    .replace(/&#x131;/g, "ı")
    .replace(/&#x11F;/g, "ğ")
    .replace(/&quot;/g, '"');
}

function parsePrice(html: string, slug: string): string | null {
  const re = new RegExp(
    `href="/tus-kitaplarimiz/urun/${slug}"[\\s\\S]*?class="price[^"]*"[^>]*>([\\s\\S]*?)</div>`
  );
  const m = html.match(re);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, "").trim() || null;
}

function parseBooks(html: string): Omit<TUSBook, "category" | "sections">[] {
  const exclude = /set|soru bankas|fast track|deneme/i;
  const books: Omit<TUSBook, "category" | "sections">[] = [];
  const seen = new Set<string>();

  const blocks = [
    ...html.matchAll(
      /href="(\/tus-kitaplarimiz\/urun\/([^"]+))"[\s\S]*?src="(https:\/\/ttcdn[^"]+)"[\s\S]*?book-name p-text">([^<]+)<\/div>/g
    ),
  ];

  for (const b of blocks) {
    const name = decodeHtml(b[4].trim());
    const slug = b[2];
    if (exclude.test(name) || exclude.test(slug)) continue;

    const id = slug.replace(/-\d+$/, "");
    if (seen.has(id)) continue;
    seen.add(id);

    books.push({
      id,
      slug,
      name,
      imageUrl: b[3],
      productUrl: `https://tustime.com${b[1]}`,
      price: parsePrice(html, slug),
    });
  }

  return books;
}

function categorize(id: string): "temel" | "klinik" {
  if (TEMEL_IDS.has(id)) return "temel";
  if (KLINIK_IDS.has(id)) return "klinik";
  return "temel";
}

async function scrape(): Promise<TUSBooksDataset> {
  console.log("Fetching tustime.com...");
  const res = await axios.get(INDEX_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TUSKitapBot/1.0)" },
    timeout: 30000,
  });

  const raw = parseBooks(res.data);
  const books: TUSBook[] = raw
    .filter((b) => TEMEL_IDS.has(b.id) || KLINIK_IDS.has(b.id))
    .map((b) => ({
      ...b,
      category: categorize(b.id),
      sections: [],
    }))
    .sort((a, b) => {
      if (a.category !== b.category) return a.category === "temel" ? -1 : 1;
      return a.name.localeCompare(b.name, "tr");
    });

  console.log(`Found ${books.length} konu kitapları`);
  books.forEach((b) => console.log(`  ${b.category === "temel" ? "🔵" : "🔴"} ${b.name}`));

  return {
    scrapedAt: new Date().toISOString(),
    source: INDEX_URL,
    books,
  };
}

function writeOutput(dataset: TUSBooksDataset) {
  const paths = [
    path.join(__dirname, "..", "data", "tus_books.json"),
    path.join(
      __dirname,
      "..",
      "..",
      "..",
      "frontend",
      "app",
      "apps",
      "tus-kitap",
      "data",
      "tus_books.json"
    ),
  ];

  const json = JSON.stringify(dataset, null, 2);
  for (const p of paths) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, json);
    console.log(`Wrote: ${p}`);
  }
}

scrape()
  .then(writeOutput)
  .catch((err) => {
    console.error("Scrape failed:", err);
    process.exit(1);
  });
