/**
 * scraped-mekanlar.json → Supabase sync (insert + update)
 *
 *   bun run workplaces:sync
 *   bun run workplaces:sync:dry
 *   bun workplaces/scrape/sync-maps.ts --category sit
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  normalizeCategory,
  scrapedPlacesToImportVenues,
  syncVenuesToDb,
  type ScrapedPlaceInput,
} from "./lib/import-venues";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPED_JSON = path.resolve(__dirname, "../data/scraped-mekanlar.json");

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const file = getArg("--file") ? path.resolve(getArg("--file")!) : SCRAPED_JSON;
  const defaultCategory = normalizeCategory(getArg("--category")) || undefined;

  if (!fs.existsSync(file)) {
    console.error(`❌ Dosya bulunamadı: ${file}`);
    console.error("   Önce scrape çalıştır: bun run workplaces:scrape -- --place <url>");
    process.exit(1);
  }

  const places = JSON.parse(fs.readFileSync(file, "utf-8")) as ScrapedPlaceInput[];
  if (!Array.isArray(places) || places.length === 0) {
    console.error("❌ Sync edilecek mekan yok.");
    process.exit(1);
  }

  console.log("🔄 Mekanlar DB sync başlatılıyor...");
  console.log(`📂 Kaynak: ${file}`);
  if (defaultCategory) console.log(`🏷️  Varsayılan kategori: ${defaultCategory}`);

  const venues = scrapedPlacesToImportVenues(places, path.basename(file), defaultCategory);
  console.log(`✅ ${venues.length} mekan hazır`);

  const { inserted, updated, skipped } = await syncVenuesToDb(venues, dryRun);

  if (dryRun) {
    console.log(`\n🏃 --dry-run: ${inserted} yeni, ${updated} güncellenecek`);
    return;
  }

  console.log(`\n💾 Sync tamam: ${inserted} eklendi, ${updated} güncellendi, ${skipped} hata/atlandı`);
}

main().catch((err) => {
  console.error("❌ Hata:", err);
  process.exit(1);
});
