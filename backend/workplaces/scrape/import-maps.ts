/**
 * Mekanlar toplu import (chocolate-db scrape gibi CLI script)
 *
 * Listeni şuraya koy:
 *   backend/workplaces/data/mekanlar.csv
 *   veya backend/workplaces/data/mekanlar.json
 *
 * Kullanım:
 *   cd backend
 *   bun run workplaces:import:dry          # önizleme
 *   bun run workplaces:import              # DB'ye yaz
 *   bun workplaces/scrape/import-maps.ts --file ./path/to/liste.csv --category eat
 *
 * Kategori değerleri: sit | eat | dessert | work
 * (veya cafe, restaurant, study_spot, library, coworking)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  geocodeMissing,
  mergeVenues,
  normalizeCategory,
  parseVenueCsv,
  parseVenueJson,
  syncVenuesToDb,
  type ImportVenue,
  type PrimaryType,
} from "./lib/import-venues";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const DEFAULT_CSV = path.join(DATA_DIR, "mekanlar.csv");
const DEFAULT_JSON = path.join(DATA_DIR, "mekanlar.json");
const OUTPUT_PATH = path.join(DATA_DIR, "import-preview.json");

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function resolveInputFile(): string | null {
  const explicit = getArg("--file");
  if (explicit) {
    const resolved = path.resolve(explicit);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Dosya bulunamadı: ${resolved}`);
    }
    return resolved;
  }

  if (fs.existsSync(DEFAULT_CSV)) return DEFAULT_CSV;
  if (fs.existsSync(DEFAULT_JSON)) return DEFAULT_JSON;
  return null;
}

function loadVenues(filePath: string, defaultCategory?: PrimaryType): ImportVenue[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const source = path.basename(filePath);

  if (filePath.endsWith(".json")) {
    return parseVenueJson(content, source, defaultCategory);
  }
  return parseVenueCsv(content, source, defaultCategory);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const skipGeocode = process.argv.includes("--skip-geocode");
  const categoryArg = getArg("--category");
  const defaultCategory = normalizeCategory(categoryArg) || undefined;

  const inputFile = resolveInputFile();
  if (!inputFile) {
    console.error("❌ Liste dosyası bulunamadı.");
    console.error(`   Beklenen: ${DEFAULT_CSV} veya ${DEFAULT_JSON}`);
    console.error("   veya: bun workplaces/scrape/import-maps.ts --file ./liste.csv");
    process.exit(1);
  }

  console.log("🚀 Mekanlar import başlatılıyor...");
  console.log(`📂 Kaynak: ${inputFile}`);
  if (defaultCategory) console.log(`🏷️  Varsayılan kategori: ${defaultCategory}`);

  const parsed = loadVenues(inputFile, defaultCategory);
  if (parsed.length === 0) {
    console.error("❌ İçe aktarılacak satır bulunamadı.");
    console.error("   Her satırda en az 'Başlık/Name' ve 'Kategori' (veya --category) gerekli.");
    process.exit(1);
  }

  let venues = mergeVenues(parsed);
  console.log(`✅ ${venues.length} tekil mekan`);

  const byType: Record<string, number> = {};
  for (const v of venues) {
    const type = v.types[0] || "unknown";
    byType[type] = (byType[type] || 0) + 1;
  }
  console.log("📊 Kategori dağılımı:", byType);

  if (!skipGeocode) {
    const needsGeocode = venues.filter((v) => !v.latitude).length;
    if (needsGeocode > 0) {
      console.log(`\n🌍 ${needsGeocode} mekan için Nominatim geocode (ücretsiz, ~1/sn)...`);
      venues = await geocodeMissing(venues);
    }
  }

  const withCoords = venues.filter((v) => v.latitude && v.longitude).length;
  console.log(`📍 Koordinatlı mekan: ${withCoords}/${venues.length}`);

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(venues, null, 2), "utf-8");
  console.log(`📂 Önizleme: ${OUTPUT_PATH}`);

  if (dryRun) {
    console.log("\n🏃 --dry-run: veritabanına yazılmadı.");
    const preview = await syncVenuesToDb(venues, true);
    console.log(`   ${preview.inserted} yeni, ${preview.updated} güncellenecek`);
    venues.slice(0, 5).forEach((v) => {
      console.log(
        `  • [${v.types.join(", ")}] ${v.name} (${v.latitude?.toFixed(4) ?? "?"}, ${v.longitude?.toFixed(4) ?? "?"})`,
      );
    });
    if (venues.length > 5) console.log(`  ... ve ${venues.length - 5} mekan daha`);
    return;
  }

  const { inserted, updated, skipped } = await syncVenuesToDb(venues, dryRun);
  console.log(`\n💾 Veritabanı: ${inserted} eklendi, ${updated} güncellendi, ${skipped} hata/atlandı.`);
  console.log("🎉 Import tamamlandı!");
}

main().catch((err) => {
  console.error("❌ Hata:", err);
  process.exit(1);
});
