/**
 * Scrape TUS uzmanlık taban puanları from tuskocu.com
 *
 * Usage (from backend/):
 *   npx tsx tus-tercih/scrape/scrape_tuskocu.ts
 *   npx tsx tus-tercih/scrape/scrape_tuskocu.ts --specialty kardiyoloji
 */

import axios from "axios";
import { parse } from "node-html-parser";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = "https://tuskocu.com";
const INDEX_URL = `${BASE_URL}/tus-taban-puanlari-ve-siralamalari/`;
const DELAY_MS = 600;

export interface TUSPeriodHistory {
  period: string;
  score: number | null;
  quota: number | null;
  rank: number | null;
}

export interface TUSSpecialty {
  slug: string;
  name: string;
  url: string;
  educationYears: number;
  institutionCount: number;
  minScore: number | null;
  maxScore: number | null;
  totalQuota: number | null;
  placed: number | null;
}

export interface TUSPlacement {
  id: string;
  specialtySlug: string;
  specialtyName: string;
  educationYears: number;
  institutionName: string;
  institutionType: string;
  history: TUSPeriodHistory[];
}

export interface TUSDataset {
  scrapedAt: string;
  source: string;
  specialties: TUSSpecialty[];
  placements: TUSPlacement[];
}

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

function slugFromUrl(url: string): string {
  const path = url.replace(BASE_URL, "").replace(/\/$/, "");
  const match = path.match(/^\/tus-(.+?)-taban/);
  return match ? match[1].replace(/-ve-siralamalari.*$/, "").replace(/-\d{4}$/, "") : slugify(path);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseTurkishNumber(value: string): number | null {
  const v = value.trim();
  if (!v || v === "-" || v === "--") return null;
  const normalized = v.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function parseKont(value: string): number | null {
  const v = value.trim();
  if (!v || v === "-" || v === "--") return null;
  const match = v.match(/^(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
}

function splitMultiValue(cell: string): string[] {
  return cell.trim().split(/\s+/).filter(Boolean);
}

function parseIndexPage(html: string): { slug: string; name: string; url: string }[] {
  const root = parse(html);
  const seen = new Set<string>();
  const specialties: { slug: string; name: string; url: string }[] = [];

  for (const a of root.querySelectorAll("a")) {
    const href = a.getAttribute("href") || "";
    if (!href.includes("tuskocu.com/tus-") || !href.includes("taban")) continue;
    if (href.includes("feed") || href.includes("oembed") || href.includes("/tag/")) continue;
    if (href.includes("tus-taban-puanlari-ve-siralamalari")) continue;
    if (href.includes("tus-ek-yerlestirme")) continue;

    const url = href.split("?")[0].replace(/\/$/, "") + "/";
    const slug = slugFromUrl(url);
    if (!slug || seen.has(url)) continue;
    seen.add(url);

    let name = a.text.trim();
    name = name
      .replace(/^TUS\s+/i, "")
      .replace(/\s+Taban Puanları.*$/i, "")
      .trim();
    if (!name) name = slug.replace(/-/g, " ");

    specialties.push({ slug, name, url });
  }

  return specialties;
}

function parseDetailPage(
  html: string,
  specialty: { slug: string; name: string; url: string }
): TUSPlacement[] {
  const root = parse(html);
  const placements: TUSPlacement[] = [];

  const table = root.querySelector("table.tablepress") || root.querySelector("table");
  if (!table) {
    console.warn(`  No table found for ${specialty.slug}`);
    return placements;
  }

  const allRows = table.querySelectorAll("tr");
  if (allRows.length < 2) return placements;

  for (const row of allRows.slice(1)) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 7) continue;

    const institutionName = cells[0]?.text.trim() || "";
    const specialtyName = cells[1]?.text.trim() || specialty.name;
    const institutionType = cells[2]?.text.trim() || "—";
    if (!institutionName) continue;

    const periods = splitMultiValue(cells[3]?.text || "");
    const kontValues = splitMultiValue(cells[4]?.text || "");
    const scoreValues = splitMultiValue(cells[5]?.text || "");
    const rankValues = splitMultiValue(cells[6]?.text || "");

    const history: TUSPeriodHistory[] = periods.map((period, i) => ({
      period,
      score: parseTurkishNumber(scoreValues[i] || ""),
      quota: parseKont(kontValues[i] || ""),
      rank: rankValues[i] && rankValues[i] !== "--" ? parseInt(rankValues[i].replace(/\./g, ""), 10) || null : null,
    }));

    const id = `${specialty.slug}|${institutionType}|${slugify(institutionName)}`;

    placements.push({
      id,
      specialtySlug: specialty.slug,
      specialtyName,
      educationYears: 4,
      institutionName,
      institutionType,
      history,
    });
  }

  return placements;
}

function mergeHistory(a: TUSPeriodHistory[], b: TUSPeriodHistory[]): TUSPeriodHistory[] {
  const byPeriod = new Map<string, TUSPeriodHistory>();
  for (const h of [...a, ...b]) {
    const existing = byPeriod.get(h.period);
    if (!existing) {
      byPeriod.set(h.period, h);
      continue;
    }
    byPeriod.set(h.period, {
      period: h.period,
      score: existing.score ?? h.score,
      quota: existing.quota ?? h.quota,
      rank: existing.rank ?? h.rank,
    });
  }
  return Array.from(byPeriod.values());
}

function dedupePlacements(placements: TUSPlacement[]): TUSPlacement[] {
  const byId = new Map<string, TUSPlacement>();
  for (const p of placements) {
    const existing = byId.get(p.id);
    if (!existing) {
      byId.set(p.id, p);
      continue;
    }
    byId.set(p.id, {
      ...existing,
      history: mergeHistory(existing.history, p.history),
    });
  }
  return Array.from(byId.values());
}

function buildSpecialtyMeta(
  specialty: { slug: string; name: string; url: string },
  placements: TUSPlacement[]
): TUSSpecialty {
  const scores = placements
    .map((p) => p.history[0]?.score)
    .filter((s): s is number => s !== null);

  const quotas = placements
    .map((p) => p.history[0]?.quota)
    .filter((q): q is number => q !== null);

  return {
    slug: specialty.slug,
    name: specialty.name,
    url: specialty.url,
    educationYears: 4,
    institutionCount: placements.length,
    minScore: scores.length ? Math.min(...scores) : null,
    maxScore: scores.length ? Math.max(...scores) : null,
    totalQuota: quotas.length ? quotas.reduce((a, b) => a + b, 0) : null,
    placed: null,
  };
}

async function fetchPage(url: string): Promise<string> {
  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TUSTercihBot/1.0)",
      Accept: "text/html",
    },
    timeout: 30000,
  });
  return res.data;
}

async function scrape(singleSpecialty?: string): Promise<TUSDataset> {
  console.log("Fetching index page from tuskocu.com...");
  const indexHtml = await fetchPage(INDEX_URL);
  let indexSpecialties = parseIndexPage(indexHtml);
  console.log(`Found ${indexSpecialties.length} specialties`);

  if (singleSpecialty) {
    indexSpecialties = indexSpecialties.filter((s) => s.slug === singleSpecialty);
    if (indexSpecialties.length === 0) {
      throw new Error(`Specialty not found: ${singleSpecialty}`);
    }
  }

  const allPlacements: TUSPlacement[] = [];
  const specialties: TUSSpecialty[] = [];

  for (let i = 0; i < indexSpecialties.length; i++) {
    const spec = indexSpecialties[i];
    console.log(`[${i + 1}/${indexSpecialties.length}] ${spec.name} (${spec.slug})...`);

    try {
      const html = await fetchPage(spec.url);
      const placements = dedupePlacements(parseDetailPage(html, spec));
      console.log(`  → ${placements.length} institutions`);
      allPlacements.push(...placements);
      specialties.push(buildSpecialtyMeta(spec, placements));
    } catch (err) {
      console.error(`  ✗ Failed: ${err}`);
    }

    if (i < indexSpecialties.length - 1) await sleep(DELAY_MS);
  }

  return {
    scrapedAt: new Date().toISOString(),
    source: INDEX_URL,
    specialties,
    placements: allPlacements,
  };
}

function writeOutput(dataset: TUSDataset) {
  const backendPath = path.join(__dirname, "..", "data", "tus_placements.json");
  const frontendPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "frontend",
    "app",
    "apps",
    "tus-tercih",
    "data",
    "tus_placements.json"
  );

  const json = JSON.stringify(dataset, null, 2);

  fs.mkdirSync(path.dirname(backendPath), { recursive: true });
  fs.writeFileSync(backendPath, json);
  console.log(`\nWrote backend: ${backendPath}`);

  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });
  fs.writeFileSync(frontendPath, json);
  console.log(`Wrote frontend: ${frontendPath}`);

  console.log(
    `\nSummary: ${dataset.specialties.length} specialties, ${dataset.placements.length} placements`
  );
}

const specialtyArg =
  process.argv.find((a) => a.startsWith("--specialty="))?.split("=")[1] ||
  (process.argv.includes("--specialty")
    ? process.argv[process.argv.indexOf("--specialty") + 1]
    : undefined);

scrape(specialtyArg)
  .then(writeOutput)
  .catch((err) => {
    console.error("Scrape failed:", err);
    process.exit(1);
  });
