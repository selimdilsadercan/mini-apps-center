/**
 * Mehmet Akif Ersoy Kültür Merkezi scrape + DB sync + Bubilet etkinliklerini bağla
 *
 * Çalıştır:
 *   encore exec -- bun concert-list/cmd/import-mehmet-akif-and-link.ts
 */

import { secret } from "encore.dev/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  scrapedPlacesToImportVenues,
  syncVenuesToDb,
  extractFtid,
  type ScrapedPlaceInput,
} from "../../workplaces/scrape/lib/import-venues";
import { scrapePlacePage, launchBrowser } from "../../workplaces/scrape/scrape-google-maps";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const MEHMET_AKIF_URL =
  "https://www.google.com/maps/place/Mehmet+Akif+Ersoy+K%C3%BClt%C3%BCr+Merkezi/@37.58562,36.9199481,17z/data=!3m1!4b1!4m6!3m5!1s0x152ddd0ff278e83b:0x4da5a6c604550bb!8m2!3d37.58562!4d36.922523!16s%2Fg%2F11bycl9069?entry=ttu";

const MEHMET_AKIF_FTID = "0x152ddd0ff278e83b:0x4da5a6c604550bb";

const BUBILET_INFO_URLS = [
  "https://www.bubilet.com.tr/kahramanmaras/etkinlik/soner-sarikabadayi-konseri-",
  "https://www.bubilet.com.tr/kahramanmaras/etkinlik/-kurk-mantolu-madonna-",
];

const SCRAPED_JSON = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../workplaces/data/scraped-mehmet-akif.json",
);

async function findPlaceId(): Promise<{ id: string; name: string } | null> {
  const supabase = createClient(supabaseUrl(), supabaseAnonKey());

  const { data, error } = await supabase.schema("workplaces").rpc("get_places", {
    p_city: "kahramanmaras",
  });

  if (error) {
    console.error("get_places error:", error.message);
    return null;
  }

  const rows = (data || []) as Array<{
    id: string;
    name: string;
    url?: string | null;
    metadata?: Record<string, string> | null;
  }>;

  const row = rows.find(
    (p) =>
      p.name?.toLowerCase().includes("mehmet akif ersoy") ||
      p.url?.includes(MEHMET_AKIF_FTID) ||
      p.metadata?.maps_ftid === MEHMET_AKIF_FTID,
  );

  return row ? { id: row.id, name: row.name } : null;
}

async function linkEvents(placeId: string, placeName: string) {
  const supabase = createClient(supabaseUrl(), supabaseAnonKey());

  for (const infoUrl of BUBILET_INFO_URLS) {
    const { data, error } = await supabase
      .schema("concert_list")
      .from("upcoming_concerts")
      .update({ place_id: placeId, venue: null })
      .eq("info_url", infoUrl)
      .select("id, artist");

    if (error) {
      console.error(`upcoming_concerts link error (${infoUrl}):`, error.message);
      continue;
    }
    if (data?.length) {
      console.log(`🎸 upcoming_concerts: ${data.map((r) => r.artist).join(", ")} → ${placeName}`);
    }
  }

  // venue adına göre de bağla (info_url eşleşmezse)
  const { data: byVenue, error: venueError } = await supabase
    .schema("concert_list")
    .from("upcoming_concerts")
    .update({ place_id: placeId, venue: null })
    .is("place_id", null)
    .ilike("venue", "%Mehmet Akif Ersoy%")
    .select("id, artist");

  if (venueError) {
    console.error("upcoming_concerts venue link error:", venueError.message);
  } else if (byVenue?.length) {
    console.log(`🎸 venue eşleşmesi: ${byVenue.map((r) => r.artist).join(", ")}`);
  }

  // campus_events (tiyatro) — location'ı canonical mekan adına çek
  const { data: theater, error: theaterError } = await supabase
    .schema("campus_events")
    .from("events")
    .update({ location: placeName })
    .or(
      `title.ilike.%Kürk Mantolu Madonna%,location.ilike.%Mehmet Akif Ersoy%`,
    )
    .select("id, title");

  if (theaterError) {
    console.error("campus_events link error:", theaterError.message);
  } else if (theater?.length) {
    console.log(`🎭 campus_events: ${theater.map((r) => r.title).join(", ")} → ${placeName}`);
  }
}

async function main() {
  process.env.SUPABASE_URL = supabaseUrl();
  process.env.SUPABASE_ANON_KEY = supabaseAnonKey();

  console.log("🚀 Mehmet Akif Ersoy Kültür Merkezi scrape...");
  const browser = await launchBrowser(false);

  let scraped: ScrapedPlaceInput | null = null;
  try {
    const page = await browser.newPage();
    const one = await scrapePlacePage(page, MEHMET_AKIF_URL);
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
      );
    }
  } finally {
    await browser.close();
  }

  if (!scraped) {
    console.error("❌ Scrape başarısız");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(SCRAPED_JSON), { recursive: true });
  fs.writeFileSync(SCRAPED_JSON, JSON.stringify([scraped], null, 2), "utf-8");
  console.log(`📂 ${SCRAPED_JSON}`);

  const venues = scrapedPlacesToImportVenues([scraped], "import-mehmet-akif", "activity");
  for (const v of venues) {
    v.tags = ["konser", "etkinlik", "kultur", "tiyatro"];
    v.metadata = {
      ...v.metadata,
      maps_ftid: extractFtid(v.url) || MEHMET_AKIF_FTID,
      bubilet_venue_slug: "mekan/kahramanmaras-mehmet-akif-ersoy-kultur-merkezi",
    };
  }

  console.log("🔄 DB sync...");
  const { inserted, updated, skipped } = await syncVenuesToDb(venues, false);
  if (inserted === 0 && updated === 0) {
    console.error(`❌ Sync başarısız (${skipped} hata)`);
    process.exit(1);
  }
  console.log(`💾 ${inserted} eklendi, ${updated} güncellendi`);

  const place = await findPlaceId();
  if (!place) {
    console.error("❌ place_id bulunamadı");
    process.exit(1);
  }

  console.log(`📍 place: ${place.name} (${place.id})`);
  await linkEvents(place.id, place.name);
  console.log("✅ Tamamlandı");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
