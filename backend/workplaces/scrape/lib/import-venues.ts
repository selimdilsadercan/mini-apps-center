import { createClient } from "@supabase/supabase-js";

export const CITY = "kahramanmaras";
export const NOMINATIM_DELAY_MS = 1100;

export type PrimaryType =
  | "cafe"
  | "restaurant"
  | "dessert"
  | "library"
  | "study_spot"
  | "bar"
  | "park"
  | "activity"
  | "natural_beauty"
  | "historical"
  | "mall"
  | "museum"
  | "complex";

export interface ImportVenue {
  name: string;
  note?: string;
  url?: string;
  tags: string[];
  address?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  source: string;
  dedupeKey: string;
  metadata: Record<string, unknown>;
}

export interface ScrapedPlaceInput {
  name: string;
  url?: string;
  note?: string;
  address?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  review_count?: number;
  maps_category?: string;
  types?: string[];
  opening_hours?: unknown;
}

const CATEGORY_ALIASES: Record<string, PrimaryType> = {
  sit: "cafe",
  cafe: "cafe",
  kafe: "cafe",
  eat: "restaurant",
  restaurant: "restaurant",
  yemek: "restaurant",
  dessert: "dessert",
  tatli: "dessert",
  tatlı: "dessert",
  work: "study_spot",
  study: "study_spot",
  study_spot: "study_spot",
  coworking: "coworking",
  library: "library",
  kutuphane: "library",
  kütüphane: "library",
};

export function normalizeCategory(input?: string): PrimaryType | null {
  if (!input?.trim()) return null;
  const key = input.trim().toLowerCase();
  return CATEGORY_ALIASES[key] || null;
}

export function extractFtid(url?: string): string | null {
  if (!url) return null;
  const ftid = url.match(/ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i);
  if (ftid?.[1]) return ftid[1].toLowerCase();
  const embedded = url.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
  if (embedded?.[1]) return embedded[1].toLowerCase();
  const cid = url.match(/[?&]cid=(\d+)/i);
  if (cid?.[1]) return `cid:${cid[1]}`;
  const chI = url.match(/(ChI[a-zA-Z0-9_-]+)/);
  if (chI?.[1]) return chI[1];
  return null;
}

export function extractCoordsFromUrl(url?: string): { lat?: number; lng?: number } {
  if (!url) return {};
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  return {};
}

export function parseDistrict(address?: string, explicit?: string): string | undefined {
  if (explicit?.trim()) return explicit.trim();
  if (!address) return undefined;

  const districts = [
    "Onikişubat",
    "Dulkadiroğlu",
    "Pazarcık",
    "Elbistan",
    "Afşin",
    "Göksun",
    "Andırın",
    "Türkoğlu",
    "Çağlayancerit",
    "Nurhak",
    "Ekinözü",
  ];
  for (const d of districts) {
    if (address.toLowerCase().includes(d.toLowerCase())) return d;
  }
  if (/merkez/i.test(address)) return "Merkez";
  return undefined;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

function headerIndex(headers: string[], ...names: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const name of names) {
    const idx = normalized.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function col(cols: string[], idx: number): string | undefined {
  if (idx < 0) return undefined;
  const v = cols[idx]?.trim();
  return v || undefined;
}

function parseNum(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function buildVenue(input: {
  name: string;
  note?: string;
  url?: string;
  tags?: string[];
  address?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  defaultCategory?: PrimaryType;
  source: string;
}): ImportVenue | null {
  const type = normalizeCategory(input.category) || input.defaultCategory || null;
  if (!type) return null;

  const urlCoords = extractCoordsFromUrl(input.url);
  const latitude = input.latitude ?? urlCoords.lat;
  const longitude = input.longitude ?? urlCoords.lng;
  const ftid = extractFtid(input.url);
  const dedupeKey = ftid || `${input.name.toLowerCase()}|${input.url || `${latitude},${longitude}`}`;

  return {
    name: input.name,
    note: input.note,
    url: input.url,
    tags: input.tags || [],
    address: input.address,
    district: parseDistrict(input.address, input.district),
    latitude,
    longitude,
    types: [type],
    source: input.source,
    dedupeKey,
    metadata: {
      import_source: input.source,
      maps_ftid: ftid,
      imported_at: new Date().toISOString(),
    },
  };
}

/** Google Maps CSV veya genişletilmiş CSV (Kategori, Adres, İlçe, Enlem, Boylam kolonları) */
export function parseVenueCsv(
  content: string,
  source: string,
  defaultCategory?: PrimaryType,
): ImportVenue[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstCols = parseCsvLine(lines[0]);
  const hasHeader =
    firstCols[0]?.toLowerCase().includes("başlık") ||
    firstCols[0]?.toLowerCase() === "name" ||
    firstCols[0]?.toLowerCase() === "isim";

  const headers = hasHeader ? firstCols : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const idxName = hasHeader ? headerIndex(headers, "başlık", "name", "isim") : 0;
  const idxNote = hasHeader ? headerIndex(headers, "not", "note") : 1;
  const idxUrl = hasHeader ? headerIndex(headers, "url", "maps", "link") : 2;
  const idxTags = hasHeader ? headerIndex(headers, "etiketler", "tags") : 3;
  const idxCategory = hasHeader
    ? headerIndex(headers, "kategori", "category", "primary_type", "tur", "tür")
    : -1;
  const idxAddress = hasHeader ? headerIndex(headers, "adres", "address") : -1;
  const idxDistrict = hasHeader ? headerIndex(headers, "ilçe", "ilce", "district") : -1;
  const idxLat = hasHeader ? headerIndex(headers, "enlem", "lat", "latitude") : -1;
  const idxLng = hasHeader ? headerIndex(headers, "boylam", "lng", "lon", "longitude") : -1;

  const venues: ImportVenue[] = [];

  for (const line of dataLines) {
    if (!line.trim() || line.startsWith(",,,")) continue;

    const cols = parseCsvLine(line);
    const name = col(cols, idxName);
    const url = col(cols, idxUrl);
    if (!name) continue;

    const tagsRaw = col(cols, idxTags);
    const tags = tagsRaw ? tagsRaw.split(";").map((t) => t.trim()).filter(Boolean) : [];

    const venue = buildVenue({
      name,
      note: col(cols, idxNote),
      url,
      tags,
      address: col(cols, idxAddress),
      district: col(cols, idxDistrict),
      latitude: parseNum(col(cols, idxLat)),
      longitude: parseNum(col(cols, idxLng)),
      category: col(cols, idxCategory),
      defaultCategory,
      source,
    });

    if (venue) venues.push(venue);
  }

  return venues;
}

/** Basit JSON liste: [{ name, url, kategori, ... }] */
export function parseVenueJson(
  content: string,
  source: string,
  defaultCategory?: PrimaryType,
): ImportVenue[] {
  const raw = JSON.parse(content) as
    | Array<Record<string, unknown>>
    | { venues: Array<Record<string, unknown>> };

  const rows = Array.isArray(raw) ? raw : raw.venues || [];
  const venues: ImportVenue[] = [];

  for (const row of rows) {
    const name = String(row.name || row.isim || row.baslik || row.Başlık || "").trim();
    if (!name) continue;

    const tags = Array.isArray(row.tags)
      ? row.tags.map(String)
      : typeof row.tags === "string"
        ? row.tags.split(";").map((t) => t.trim()).filter(Boolean)
        : [];

    const venue = buildVenue({
      name,
      note: row.note ? String(row.note) : row.not ? String(row.not) : undefined,
      url: row.url ? String(row.url) : undefined,
      tags,
      address: row.address ? String(row.address) : row.adres ? String(row.adres) : undefined,
      district: row.district ? String(row.district) : row.ilce ? String(row.ilce) : row.ilçe ? String(row.ilçe) : undefined,
      latitude: parseNum(row.latitude ? String(row.latitude) : row.enlem ? String(row.enlem) : row.lat ? String(row.lat) : undefined),
      longitude: parseNum(row.longitude ? String(row.longitude) : row.boylam ? String(row.boylam) : row.lng ? String(row.lng) : row.lon ? String(row.lon) : undefined),
      category: row.kategori
        ? String(row.kategori)
        : row.category
          ? String(row.category)
          : row.primary_type
            ? String(row.primary_type)
            : undefined,
      defaultCategory,
      source,
    });

    if (venue) {
      if (row.opening_hours && typeof row.opening_hours === "object") {
        venue.metadata.opening_hours = row.opening_hours;
      }
      if (row.maps_category) venue.metadata.maps_category = String(row.maps_category);
      if (row.rating != null) venue.metadata.rating = row.rating;
      if (row.review_count != null) venue.metadata.review_count = row.review_count;
      venues.push(venue);
    }
  }

  return venues;
}

export function mergeVenues(all: ImportVenue[]): ImportVenue[] {
  const map = new Map<string, ImportVenue>();

  for (const v of all) {
    const existing = map.get(v.dedupeKey);
    map.set(v.dedupeKey, {
      ...existing,
      ...v,
      tags: [...new Set([...(existing?.tags || []), ...v.tags])],
      note: v.note || existing?.note,
      address: v.address || existing?.address,
      district: v.district || existing?.district,
      latitude: v.latitude ?? existing?.latitude,
      longitude: v.longitude ?? existing?.longitude,
      metadata: { ...(existing?.metadata || {}), ...v.metadata },
    });
  }

  return [...map.values()];
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeVenue(venue: ImportVenue): Promise<ImportVenue> {
  if (venue.latitude && venue.longitude) return venue;

  const query = venue.address
    ? `${venue.name}, ${venue.address}`
    : `${venue.name}, Kahramanmaraş, Türkiye`;

  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "tr",
  })}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "everything-workplaces-import/1.0" },
    });
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (data[0]) {
      return {
        ...venue,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: venue.address || data[0].display_name,
        district: venue.district || parseDistrict(data[0].display_name),
      };
    }
  } catch (err) {
    console.warn(`  ⚠️ Geocode başarısız: ${venue.name}`, err);
  }

  return venue;
}

export async function geocodeMissing(venues: ImportVenue[]): Promise<ImportVenue[]> {
  const result: ImportVenue[] = [];
  let geocoded = 0;

  for (const venue of venues) {
    if (venue.latitude && venue.longitude) {
      result.push(venue);
      continue;
    }
    process.stdout.write(`  📍 Geocode: ${venue.name.slice(0, 40)}...\r`);
    const updated = await geocodeVenue(venue);
    if (updated.latitude) geocoded++;
    result.push(updated);
    await sleep(NOMINATIM_DELAY_MS);
  }

  console.log(`\n📍 ${geocoded} mekan Nominatim ile konumlandırıldı.`);
  return result;
}

export function scrapedPlacesToImportVenues(
  places: ScrapedPlaceInput[],
  source = "scraped-mekanlar.json",
  defaultCategory?: PrimaryType,
): ImportVenue[] {
  return places
    .map((p) => {
      if (!p.name?.trim()) return null;

      const ftid = extractFtid(p.url);
      const dedupeKey = ftid || `${p.name.toLowerCase()}|${p.url || ""}`;
      const urlCoords = extractCoordsFromUrl(p.url);

      const metadata: Record<string, unknown> = {
        import_source: source,
        maps_ftid: ftid,
        synced_at: new Date().toISOString(),
      };
      if (p.maps_category) metadata.maps_category = p.maps_category;
      if (p.opening_hours) metadata.opening_hours = p.opening_hours;
      if (p.review_count != null) metadata.review_count = p.review_count;

      return {
        name: p.name.trim(),
        note: p.note || p.maps_category,
        url: p.url,
        tags: [],
        address: p.address,
        district: p.district || parseDistrict(p.address),
        latitude: p.latitude ?? urlCoords.lat,
        longitude: p.longitude ?? urlCoords.lng,
        types: p.types || (defaultCategory ? [defaultCategory] : []),
        rating: p.rating,
        user_ratings_total: p.review_count,
        source,
        dedupeKey,
        metadata,
      } satisfies ImportVenue;
    })
    .filter((v): v is ImportVenue => v !== null);
}

export function buildUrlDedupeKey(url: string): string {
  const ftid = extractFtid(url);
  if (ftid) return `ftid:${ftid.toLowerCase()}`;
  try {
    const u = new URL(url);
    return `url:${u.pathname.toLowerCase()}`;
  } catch {
    return `url:${url.toLowerCase().split("?")[0]}`;
  }
}

export function collectDedupeKeys(
  places: Array<{ name?: string; url?: string; metadata?: Record<string, unknown> }>,
): Set<string> {
  const keys = new Set<string>();
  for (const place of places) {
    if (place.url) keys.add(buildUrlDedupeKey(place.url));
    const metaFtid = place.metadata?.maps_ftid;
    if (typeof metaFtid === "string") keys.add(`ftid:${metaFtid.toLowerCase()}`);
    if (place.name?.trim()) keys.add(`name:${place.name.trim().toLowerCase()}`);
  }
  return keys;
}

export function isUrlAlreadyKnown(url: string, keys: Set<string>): boolean {
  if (keys.has(buildUrlDedupeKey(url))) return true;
  const ftid = extractFtid(url);
  return !!(ftid && keys.has(`ftid:${ftid.toLowerCase()}`));
}

export async function loadExistingDedupeKeysFromDb(): Promise<Set<string>> {
  const keys = new Set<string>();

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.SupabaseUrl ||
    process.env.ENCORE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SupabaseAnonKey ||
    process.env.ENCORE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return keys;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .schema("workplaces")
    .from("places")
    .select("name, url, metadata")
    .eq("city", CITY);

  if (error) {
    console.warn(`⚠️ DB dedupe anahtarları okunamadı: ${error.message}`);
    return keys;
  }

  for (const key of collectDedupeKeys((data || []) as Array<{ name?: string; url?: string; metadata?: Record<string, unknown> }>)) {
    keys.add(key);
  }
  return keys;
}

type ExistingRow = {
  id: string;
  name: string;
  url: string | null;
  metadata: Record<string, unknown> | null;
  rating: number | null;
  user_ratings_total: number | null;
};

function indexExisting(rows: ExistingRow[]) {
  const byFtid = new Map<string, ExistingRow>();
  const byUrl = new Map<string, ExistingRow>();
  const byName = new Map<string, ExistingRow>();

  for (const row of rows) {
    byName.set(row.name.toLowerCase(), row);
    if (row.url) byUrl.set(row.url.toLowerCase(), row);
    const ftid = extractFtid(row.url || undefined);
    if (ftid) byFtid.set(ftid, row);
    const metaFtid = row.metadata?.maps_ftid;
    if (typeof metaFtid === "string") byFtid.set(metaFtid, row);
  }

  return { byFtid, byUrl, byName };
}

function findExisting(
  venue: ImportVenue,
  indexes: ReturnType<typeof indexExisting>,
): ExistingRow | undefined {
  const ftid = extractFtid(venue.url) || (venue.metadata.maps_ftid as string | undefined);
  if (ftid && indexes.byFtid.has(ftid)) return indexes.byFtid.get(ftid);
  if (venue.url && indexes.byUrl.has(venue.url.toLowerCase())) {
    return indexes.byUrl.get(venue.url.toLowerCase());
  }
  return indexes.byName.get(venue.name.toLowerCase());
}

export async function syncVenuesToDb(venues: ImportVenue[], dryRun: boolean) {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.SupabaseUrl ||
    process.env.ENCORE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SupabaseAnonKey ||
    process.env.ENCORE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("ℹ️ Supabase anahtarları yok — DB sync atlandı.");
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: existingRows, error: readError } = await supabase
    .schema("workplaces")
    .from("places")
    .select("id, name, url, metadata, rating, user_ratings_total")
    .eq("city", CITY);

  if (readError) {
    throw new Error(`Mevcut mekanlar okunamadı: ${readError.message}`);
  }

  const indexes = indexExisting((existingRows || []) as ExistingRow[]);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const v of venues) {
    const existing = findExisting(v, indexes);

    if (dryRun) {
      if (existing) updated++;
      else inserted++;
      continue;
    }

    if (existing) {
      const mergedMetadata = {
        ...(existing.metadata || {}),
        ...v.metadata,
        synced_at: new Date().toISOString(),
      };

      const { error } = await supabase.schema("workplaces").rpc("update_place", {
        p_id: existing.id,
        p_name: v.name,
        p_note: v.note || null,
        p_url: v.url || existing.url,
        p_tags: v.tags,
        p_wifi: false,
        p_parking: false,
        p_power_outlets: false,
        p_quiet_level: v.types.includes("study_spot") || v.types.includes("library") ? 4 : 3,
        p_latitude: v.latitude ?? null,
        p_longitude: v.longitude ?? null,
        p_district: v.district ?? null,
        p_image_url: null,
        p_address: v.address ?? null,
        p_rating: v.rating ?? existing.rating ?? null,
        p_user_ratings_total: v.user_ratings_total ?? existing.user_ratings_total ?? null,
        p_metadata: mergedMetadata,
        p_business_id: null,
        p_types: v.types,
      });

      if (error) {
        console.error(`  ❌ Güncelleme (${v.name}): ${error.message}`);
        skipped++;
      } else {
        updated++;
      }
      continue;
    }

    const { error } = await supabase.schema("workplaces").rpc("add_place", {
      p_name: v.name,
      p_note: v.note || null,
      p_url: v.url || null,
      p_tags: v.tags,
      p_wifi: false,
      p_parking: false,
      p_power_outlets: false,
      p_quiet_level: v.types.includes("study_spot") || v.types.includes("library") ? 4 : 3,
      p_user_id: null,
      p_latitude: v.latitude ?? null,
      p_longitude: v.longitude ?? null,
      p_district: v.district ?? null,
      p_image_url: null,
      p_address: v.address ?? null,
      p_rating: v.rating ?? null,
      p_user_ratings_total: v.user_ratings_total ?? null,
      p_metadata: v.metadata,
      p_approved: true,
      p_business_id: null,
      p_city: CITY,
      p_types: v.types,
    });

    if (error) {
      console.error(`  ❌ Ekleme (${v.name}): ${error.message}`);
      skipped++;
    } else {
      inserted++;
      indexes.byName.set(v.name.toLowerCase(), {
        id: "new",
        name: v.name,
        url: v.url || null,
        metadata: v.metadata,
        rating: v.rating ?? null,
        user_ratings_total: v.user_ratings_total ?? null,
      });
      if (v.url) indexes.byUrl.set(v.url.toLowerCase(), indexes.byName.get(v.name.toLowerCase())!);
    }
  }

  return { inserted, updated, skipped };
}

/** @deprecated syncVenuesToDb kullan */
export async function importToDb(venues: ImportVenue[], dryRun: boolean) {
  const result = await syncVenuesToDb(venues, dryRun);
  return { inserted: result.inserted, skipped: result.skipped + result.updated };
}
