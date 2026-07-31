/**
 * KAFUM scrape + workplaces DB sync (RPC add_place / update_place)
 *
 * Önce Supabase'te çalıştır:
 *   backend/workplaces/migrations/12_fix_add_place_ambiguous_id.up.sql
 *
 * Konser bağlama için:
 *   backend/concert-list/migrations/14_link_kafum_concerts.up.sql
 *
 * Çalıştır:
 *   encore exec -- bun workplaces/cmd/import-kafum-and-link.ts
 */

import { secret } from "encore.dev/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  scrapedPlacesToImportVenues,
  syncVenuesToDb,
  type ScrapedPlaceInput,
} from "../scrape/lib/import-venues";
import { scrapePlacePage, launchBrowser } from "../scrape/scrape-google-maps";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const KAFUM_URL =
  "https://www.google.com/maps/place/Kahramanmara%C5%9F+Belediyesi+Fuar+Mer./@37.5584933,36.9206684,17z/data=!4m10!1m2!2m1!1skafum+fuar+merkezi!3m6!1s0x152dddc7f4cdd1e1:0xe1093e16fb4f3db!8m2!3d37.558479!4d36.923184!16s%2Fg%2F11b7q8nc8v?entry=ttu";

const SCRAPED_JSON = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/scraped-mekanlar.json",
);

async function main() {
  process.env.SUPABASE_URL = supabaseUrl();
  process.env.SUPABASE_ANON_KEY = supabaseAnonKey();

  console.log("🚀 KAFUM scrape başlıyor...");
  const browser = await launchBrowser(false);

  let scraped: ScrapedPlaceInput | null = null;
  try {
    const page = await browser.newPage();
    const one = await scrapePlacePage(page, KAFUM_URL);
    await page.close();
    if (one) {
      scraped = {
        ...one,
        types: one.types?.length ? one.types : ["activity"],
      };
      console.log(
        "✅ Scrape:",
        scraped.name,
        scraped.address || "",
        scraped.rating != null ? `⭐ ${scraped.rating}` : "",
        scraped.review_count != null ? `(${scraped.review_count} yorum)` : "",
      );
    }
  } finally {
    await browser.close();
  }

  if (!scraped) {
    console.error("❌ Scrape başarısız");
    process.exit(1);
  }

  fs.writeFileSync(SCRAPED_JSON, JSON.stringify([scraped], null, 2), "utf-8");
  console.log(`📂 ${SCRAPED_JSON}`);

  const venues = scrapedPlacesToImportVenues([scraped], "import-kafum-and-link", "activity");
  for (const v of venues) {
    v.tags = ["konser", "etkinlik", "fuar"];
  }

  console.log("🔄 DB sync (add_place / update_place RPC)...");
  const { inserted, updated, skipped } = await syncVenuesToDb(venues, false);

  if (inserted === 0 && updated === 0) {
    console.error(`❌ Sync başarısız (${skipped} hata). add_place fix SQL'ini uyguladın mı?`);
    process.exit(1);
  }

  console.log(`💾 ${inserted} eklendi, ${updated} güncellendi`);
  console.log("🎸 Konserleri bağlamak için 14_link_kafum_concerts.up.sql çalıştır");
  console.log("✅ Tamamlandı");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
