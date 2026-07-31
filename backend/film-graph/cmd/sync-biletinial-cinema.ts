/**
 * Biletinial Arsan sinema seans sync (manuel)
 *
 *   encore exec -- bun film-graph/cmd/sync-biletinial-cinema.ts
 */

import { secret } from "encore.dev/config";
import { scrapeBiletinialTheater } from "../cron";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

async function main() {
  process.env.SUPABASE_URL = supabaseUrl();
  process.env.SUPABASE_ANON_KEY = supabaseAnonKey();

  console.log("🎬 Biletinial Arsan scraper başlıyor...");
  const result = await scrapeBiletinialTheater();
  console.log(result.success ? `✅ ${result.count} seans kaydedildi` : "❌ Scrape başarısız");
  if (!result.success) process.exit(1);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
