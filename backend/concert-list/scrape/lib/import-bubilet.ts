import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BubiletEventType, ScrapedBubiletEvent } from "./parse-bubilet";

export interface SyncBubiletResult {
  concerts: { inserted: number; updated: number; skipped: number };
  theater: { inserted: number; updated: number; skipped: number };
  standup: { inserted: number; updated: number; skipped: number };
  other: { inserted: number; updated: number; skipped: number };
}

function getSupabase(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.SupabaseUrl ||
    process.env.ENCORE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SupabaseAnonKey ||
    process.env.ENCORE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY ortam değişkenleri gerekli");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function fetchArtistImage(artist: string): Promise<string | null> {
  try {
    const cleanArtist = artist.split("-")[0].trim();
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist)}&entity=musicArtist&limit=1`;
    const res = await fetch(itunesUrl);
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<{ artworkUrl100?: string }> };
    const artwork = data.results?.[0]?.artworkUrl100;
    return artwork ? artwork.replace("/100x100bb.jpg", "/600x600bb.jpg") : null;
  } catch {
    return null;
  }
}

async function findPlaceId(supabase: SupabaseClient, venueName: string): Promise<string | null> {
  const normalized = venueName.trim().toLowerCase();

  if (/mehmet akif ersoy/i.test(venueName)) {
    const { data, error } = await supabase.schema("workplaces").rpc("get_places", {
      p_city: "kahramanmaras",
    });
    if (!error && data) {
      const row = (data as Array<{ id: string; name: string }>).find((p) =>
        p.name?.toLowerCase().includes("mehmet akif ersoy"),
      );
      if (row?.id) return row.id;
    }
  }

  const { data, error } = await supabase
    .schema("workplaces")
    .from("places")
    .select("id, name")
    .ilike("name", `%${venueName.split(" ").slice(-2).join(" ")}%`)
    .limit(20);

  if (error || !data?.length) return null;

  const exact = data.find((row) => row.name?.trim().toLowerCase() === normalized);
  if (exact) return exact.id;

  const contains = data.find((row) => row.name?.toLowerCase().includes(normalized.slice(0, 12)));
  return contains?.id || data[0]?.id || null;
}

async function upsertUpcomingConcert(
  supabase: SupabaseClient,
  event: ScrapedBubiletEvent,
  dryRun: boolean,
): Promise<"inserted" | "updated" | "skipped"> {
  const placeId = await findPlaceId(supabase, event.venueName);
  let imageUrl = event.imageUrl || null;

  if (!imageUrl && event.eventType === "concert") {
    imageUrl = (await fetchArtistImage(event.artist)) || null;
  }

  const row = {
    artist: event.artist,
    date: event.date,
    venue: event.venueName,
    place_id: placeId,
    description: event.description || null,
    image_url: imageUrl,
    info_url: event.bubiletUrl,
  };

  const { data: existing, error: findError } = await supabase
    .schema("concert_list")
    .from("upcoming_concerts")
    .select("id")
    .eq("info_url", event.bubiletUrl)
    .maybeSingle();

  if (findError) {
    console.error("upcoming_concerts lookup error:", findError.message);
    return "skipped";
  }

  if (dryRun) {
    console.log(`[dry-run] concert ${existing ? "update" : "insert"}:`, row.artist, row.date, row.venue);
    return existing ? "updated" : "inserted";
  }

  if (existing?.id) {
    const { error } = await supabase
      .schema("concert_list")
      .from("upcoming_concerts")
      .update(row)
      .eq("id", existing.id);
    if (error) {
      console.error("upcoming_concerts update error:", error.message);
      return "skipped";
    }
    return "updated";
  }

  const { error } = await supabase.schema("concert_list").from("upcoming_concerts").insert(row);
  if (error) {
    console.error("upcoming_concerts insert error:", error.message);
    return "skipped";
  }
  return "inserted";
}

async function upsertCampusEvent(
  supabase: SupabaseClient,
  event: ScrapedBubiletEvent,
  dryRun: boolean,
): Promise<"inserted" | "updated" | "skipped"> {
  const row = {
    title: event.title,
    description: event.description || null,
    university: event.city,
    location: event.venueName,
    event_date: event.startAt,
    image_url: event.imageUrl || null,
    organizer_club: "Bubilet",
    category: event.categoryLabel,
  };

  const { data: existing, error: findError } = await supabase
    .schema("campus_events")
    .from("events")
    .select("id")
    .eq("title", event.title)
    .eq("event_date", event.startAt)
    .maybeSingle();

  if (findError) {
    console.error("campus_events lookup error:", findError.message);
    return "skipped";
  }

  if (dryRun) {
    console.log(`[dry-run] campus ${existing ? "update" : "insert"}:`, row.title, row.category);
    return existing ? "updated" : "inserted";
  }

  if (existing?.id) {
    const { error } = await supabase.schema("campus_events").from("events").update(row).eq("id", existing.id);
    if (error) {
      console.error("campus_events update error:", error.message);
      return "skipped";
    }
    return "updated";
  }

  const { error } = await supabase.schema("campus_events").from("events").insert(row);
  if (error) {
    console.error("campus_events insert error:", error.message);
    return "skipped";
  }
  return "inserted";
}

async function findOrCreateComedian(
  supabase: SupabaseClient,
  name: string,
  dryRun: boolean,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("standup_comedians")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing?.id) return existing.id;
  if (dryRun) return "dry-run-comedian-id";

  const { data, error } = await supabase
    .from("standup_comedians")
    .insert({ name })
    .select("id")
    .single();

  if (error) {
    console.error("standup_comedians insert error:", error.message);
    return null;
  }
  return data.id;
}

async function upsertStandupShow(
  supabase: SupabaseClient,
  event: ScrapedBubiletEvent,
  dryRun: boolean,
): Promise<"inserted" | "updated" | "skipped"> {
  const comedianId = await findOrCreateComedian(supabase, event.artist, dryRun);
  if (!comedianId) return "skipped";

  const row = {
    comedian_id: comedianId,
    venue_name: event.venueName,
    title: event.title,
    description: event.description || null,
    show_date: event.startAt,
    ticket_url: event.bubiletUrl,
  };

  const { data: existing, error: findError } = await supabase
    .from("standup_shows")
    .select("id")
    .eq("ticket_url", event.bubiletUrl)
    .maybeSingle();

  if (findError) {
    console.error("standup_shows lookup error:", findError.message);
    return "skipped";
  }

  if (dryRun) {
    console.log(`[dry-run] standup ${existing ? "update" : "insert"}:`, row.title);
    return existing ? "updated" : "inserted";
  }

  if (existing?.id) {
    const { error } = await supabase.from("standup_shows").update(row).eq("id", existing.id);
    if (error) {
      console.error("standup_shows update error:", error.message);
      return "skipped";
    }
    return "updated";
  }

  const { error } = await supabase.from("standup_shows").insert(row);
  if (error) {
    console.error("standup_shows insert error:", error.message);
    return "skipped";
  }
  return "inserted";
}

function bucketFor(type: BubiletEventType): keyof SyncBubiletResult {
  if (type === "concert") return "concerts";
  if (type === "theater") return "theater";
  if (type === "standup") return "standup";
  return "other";
}

export async function syncBubiletEvents(
  events: ScrapedBubiletEvent[],
  dryRun = false,
): Promise<SyncBubiletResult> {
  const supabase = getSupabase();
  const result: SyncBubiletResult = {
    concerts: { inserted: 0, updated: 0, skipped: 0 },
    theater: { inserted: 0, updated: 0, skipped: 0 },
    standup: { inserted: 0, updated: 0, skipped: 0 },
    other: { inserted: 0, updated: 0, skipped: 0 },
  };

  for (const event of events) {
    let status: "inserted" | "updated" | "skipped";

    if (event.eventType === "concert") {
      status = await upsertUpcomingConcert(supabase, event, dryRun);
    } else if (event.eventType === "standup") {
      status = await upsertStandupShow(supabase, event, dryRun);
    } else if (event.eventType === "theater" || event.eventType === "other") {
      status = await upsertCampusEvent(supabase, event, dryRun);
    } else {
      continue;
    }

    const bucket = bucketFor(event.eventType);
    result[bucket][status] += 1;
    console.log(`${event.categoryLabel}: ${event.title} → ${status}`);
  }

  return result;
}
