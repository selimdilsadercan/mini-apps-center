/**
 * Encore secret'ları ile scraped JSON'u DB'ye yazar.
 *   encore exec -- bun workplaces/cmd/sync-scraped.ts
 *   encore exec -- bun workplaces/cmd/sync-scraped.ts workplaces/data/scraped-mekanlar.json
 */

import { secret } from "encore.dev/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSupabaseClient } from "../../lib/supabase";
import {
  scrapedPlacesToImportVenues,
  syncVenuesToDb,
  type ScrapedPlaceInput,
} from "../scrape/lib/import-venues";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(__dirname, "../data/scraped-mekanlar.json");

async function main() {
  const file = process.argv[2] ? path.resolve(process.argv[2]) : defaultFile;
  if (!fs.existsSync(file)) {
    console.error(`❌ Dosya yok: ${file}`);
    process.exit(1);
  }

  const places = JSON.parse(fs.readFileSync(file, "utf-8")) as ScrapedPlaceInput[];
  const venues = scrapedPlacesToImportVenues(places, path.basename(file));

  process.env.SUPABASE_URL = supabaseUrl();
  process.env.SUPABASE_ANON_KEY = supabaseAnonKey();
  createSupabaseClient(supabaseUrl(), supabaseAnonKey());

  console.log(`🔄 ${venues.length} mekan sync ediliyor...`);
  const { inserted, updated, skipped } = await syncVenuesToDb(venues, false);
  console.log(`💾 ${inserted} eklendi, ${updated} güncellendi, ${skipped} hata/atlandı`);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
