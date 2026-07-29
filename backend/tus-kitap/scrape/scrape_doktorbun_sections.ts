/**
 * Scrape TUS konu/bölüm listeleri from doktorbun.com soru dağılımları
 * and merge into tus_books.json
 *
 * Usage (from backend/):
 *   npx tsx tus-kitap/scrape/scrape_doktorbun_sections.ts
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BOOK_SOURCES: Record<
  string,
  { url: string; filter?: (topic: string) => boolean }
> = {
  anatomi: { url: "https://tus.doktorbun.com/anatomi-soru-dagilimi/" },
  biyokimya: { url: "https://tus.doktorbun.com/biyokimya-soru-dagilimi/" },
  histolojiembriyoloji: {
    url: "https://tus.doktorbun.com/fizyoloji-histoloji-soru-dagilimi/",
    filter: (t) =>
      ["Embriyoloji", "Hücre", "Doku", "Kas", "Genital Sistem", "Hematopetik Sistem"].includes(t),
  },
  fizyoloji: {
    url: "https://tus.doktorbun.com/fizyoloji-histoloji-soru-dagilimi/",
    filter: (t) =>
      [
        "Gastrointestinal Sistem",
        "Kardiyovasküler Sistem",
        "Endokrin Sistem",
        "Solunum Sistemi",
        "Sinir Sistemi",
        "Üriner Sistem",
      ].includes(t),
  },
  mikrobiyoloji: { url: "https://tus.doktorbun.com/mikrobiyoloji-soru-dagilimi/" },
  patoloji: { url: "https://tus.doktorbun.com/patoloji-soru-dagilimi/" },
  farmakoloji: { url: "https://tus.doktorbun.com/farmakoloji-soru-dagilimi/" },
  dahiliye: { url: "https://tus.doktorbun.com/dahiliye-soru-dagilimi/" },
  pediatri: { url: "https://tus.doktorbun.com/pediatri-soru-dagilimi/" },
  "kucuk-stajlar": { url: "https://tus.doktorbun.com/kucuk-stajlar-soru-dagilimi/" },
  "genel-cerrahi": { url: "https://tus.doktorbun.com/genel-cerrahi-soru-dagilimi/" },
  "kadin-dogum": {
    url: "https://tus.doktorbun.com/kadin-hastaliklari-ve-dogum-soru-dagilimi/",
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTopicsFromHtml(html: string): string[] {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)];

  for (const table of tables) {
    const rows = [...table[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)];
    const topics: string[] = [];

    for (const row of rows) {
      const cells = [...row[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
        .map((c) =>
          c[1]
            .replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean);

      if (!cells.length) continue;

      const first = cells[0];
      if (
        !first ||
        first.includes("TUS -") ||
        first.includes("Tabloyu") ||
        /^toplam$/i.test(first)
      ) {
        continue;
      }

      if (cells.length >= 2 && cells.slice(1).some((c) => /^\d+$/.test(c))) {
        topics.push(first);
      }
    }

    if (topics.length >= 3) return topics;
  }

  return [];
}

async function fetchTopics(url: string): Promise<string[]> {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TUSKitapBot/1.0)" },
    timeout: 30000,
  });
  return parseTopicsFromHtml(res.data);
}

async function main() {
  const booksPath = path.join(
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
  );

  const dataset = JSON.parse(fs.readFileSync(booksPath, "utf-8"));

  for (const book of dataset.books) {
    const source = BOOK_SOURCES[book.id];
    if (!source) {
      console.warn(`  ⚠ No source for ${book.id}`);
      continue;
    }

    console.log(`Fetching ${book.name}...`);
    let topics = await fetchTopics(source.url);
    if (source.filter) {
      topics = topics.filter(source.filter);
    }

    book.sections = topics.map((name, i) => ({
      id: slugify(name),
      name,
      order: i + 1,
    }));

    console.log(`  → ${book.sections.length} bölüm`);
  }

  dataset.sectionsSource = "https://tus.doktorbun.com/category/tus-analizleri/soru-dagilimlari/";
  dataset.sectionsUpdatedAt = new Date().toISOString();

  const json = JSON.stringify(dataset, null, 2);
  const paths = [
    booksPath,
    path.join(__dirname, "..", "data", "tus_books.json"),
  ];

  for (const p of paths) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, json);
    console.log(`Wrote: ${p}`);
  }

  const total = dataset.books.reduce(
    (sum: number, b: { sections: unknown[] }) => sum + b.sections.length,
    0
  );
  console.log(`\nToplam ${total} bölüm, ${dataset.books.length} kitap`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
