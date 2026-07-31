/**
 * scraped-bubilet.json → DB sync
 *
 *   encore exec -- bun concert-list/cmd/sync-bubilet.ts
 *   encore exec -- bun concert-list/cmd/sync-bubilet.ts --dry-run
 */

import { secret } from "encore.dev/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ScrapedBubiletEvent } from "../scrape/lib/parse-bubilet";
import { syncBubiletEvents } from "../scrape/lib/import-bubilet";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const SCRAPED_JSON = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/scraped-bubilet.json",
);

async function main() {
  process.env.SUPABASE_URL = supabaseUrl();
  process.env.SUPABASE_ANON_KEY = supabaseAnonKey();

  const dryRun = process.argv.includes("--dry-run");

  if (!fs.existsSync(SCRAPED_JSON)) {
    console.error(`❌ Dosya yok: ${SCRAPED_JSON}`);
    console.error("Önce: encore exec -- bun concert-list/scrape/scrape-bubilet.ts --city kahramanmaras");
    process.exit(1);
  }

  const events = JSON.parse(fs.readFileSync(SCRAPED_JSON, "utf-8")) as ScrapedBubiletEvent[];
  console.log(`🔄 ${events.length} etkinlik sync ediliyor...`);
  const result = await syncBubiletEvents(events, dryRun);
  console.log("✅", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
