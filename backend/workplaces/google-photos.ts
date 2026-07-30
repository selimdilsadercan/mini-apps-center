import { secret } from "encore.dev/config";
import type { ServerResponse } from "http";
import type { SupabaseClient } from "@supabase/supabase-js";

const googleMapsApiKey = secret("GoogleMapsApiKey");

/** Short-lived in-memory cache only — not persisted to disk/CDN (Google ToS). */
const MEMORY_TTL_MS = 30 * 60 * 1000;
const memoryCache = new Map<
  string,
  { body: Buffer; contentType: string; expiresAt: number }
>();

export function googlePhotoProxyPath(googlePlaceId: string): string {
  return `/workplaces/google-photo/${encodeURIComponent(googlePlaceId)}`;
}

export function isGooglePhotoProxyPath(url?: string | null): boolean {
  return !!url?.includes("/workplaces/google-photo/");
}

export function extractGooglePlaceId(input?: string | null): string | null {
  if (!input?.trim()) return null;

  const trimmed = input.trim();

  if (/^ChI[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  const placeIdParam = trimmed.match(/[?&]place_id=([^&]+)/i);
  if (placeIdParam?.[1]) {
    return decodeURIComponent(placeIdParam[1]);
  }

  const queryPlaceId = trimmed.match(/[?&]query=place_id:([^&]+)/i);
  if (queryPlaceId?.[1]) {
    return decodeURIComponent(queryPlaceId[1]);
  }

  const embeddedPlaceId = trimmed.match(/!1s(ChI[a-zA-Z0-9_-]+)/);
  if (embeddedPlaceId?.[1]) {
    return embeddedPlaceId[1];
  }

  const proxyMatch = trimmed.match(/\/workplaces\/google-photo\/([^/?#]+)/);
  if (proxyMatch?.[1]) {
    return decodeURIComponent(proxyMatch[1]);
  }

  return null;
}

interface PhotoCacheRow {
  photo_reference: string;
  attributions: string[] | null;
}

async function readPhotoCache(
  supabase: SupabaseClient,
  googlePlaceId: string,
): Promise<PhotoCacheRow | null> {
  const { data, error } = await supabase
    .schema("workplaces")
    .from("photo_cache")
    .select("photo_reference, attributions")
    .eq("google_place_id", googlePlaceId)
    .maybeSingle();

  if (error) {
    console.warn("photo_cache read failed:", error.message);
    return null;
  }

  if (!data?.photo_reference) {
    return null;
  }

  return {
    photo_reference: data.photo_reference,
    attributions: (data.attributions as string[] | null) ?? [],
  };
}

async function writePhotoCache(
  supabase: SupabaseClient,
  googlePlaceId: string,
  photoReference: string,
  attributions: string[],
): Promise<void> {
  const { error } = await supabase.schema("workplaces").from("photo_cache").upsert({
    google_place_id: googlePlaceId,
    photo_reference: photoReference,
    attributions,
    fetched_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("photo_cache write failed:", error.message);
  }
}

function getApiKey(): string | null {
  try {
    const key = googleMapsApiKey();
    return key?.trim() || null;
  } catch {
    console.warn("GoogleMapsApiKey secret not configured");
    return null;
  }
}

/**
 * Resolves and caches Google's photo_reference (not the image bytes).
 * Place Details API: one call per place id.
 */
export async function ensurePhotoReference(
  supabase: SupabaseClient,
  googlePlaceId: string,
): Promise<PhotoCacheRow | null> {
  const normalizedId = extractGooglePlaceId(googlePlaceId);
  if (!normalizedId || normalizedId.startsWith("osm_")) {
    return null;
  }

  const cached = await readPhotoCache(supabase, normalizedId);
  if (cached) {
    return cached;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", normalizedId);
    detailsUrl.searchParams.set("fields", "photos");
    detailsUrl.searchParams.set("key", apiKey);

    const detailsRes = await fetch(detailsUrl.toString());
    if (!detailsRes.ok) {
      console.warn("Google place details failed:", detailsRes.status);
      return null;
    }

    const details = (await detailsRes.json()) as {
      result?: { photos?: Array<{ photo_reference?: string; html_attributions?: string[] }> };
      status?: string;
    };

    if (details.status && details.status !== "OK") {
      console.warn("Google place details status:", details.status);
      return null;
    }

    const firstPhoto = details.result?.photos?.[0];
    const photoRef = firstPhoto?.photo_reference;
    if (!photoRef) {
      return null;
    }

    const attributions = firstPhoto?.html_attributions ?? [];
    await writePhotoCache(supabase, normalizedId, photoRef, attributions);

    return { photo_reference: photoRef, attributions };
  } catch (err) {
    console.error("ensurePhotoReference error:", err);
    return null;
  }
}

async function fetchPhotoBytes(
  photoReference: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const now = Date.now();
  const mem = memoryCache.get(photoReference);
  if (mem && mem.expiresAt > now) {
    return { body: mem.body, contentType: mem.contentType };
  }

  const photoUrl = new URL("https://maps.googleapis.com/maps/api/place/photo");
  photoUrl.searchParams.set("maxwidth", "800");
  photoUrl.searchParams.set("photo_reference", photoReference);
  photoUrl.searchParams.set("key", apiKey);

  const photoRes = await fetch(photoUrl.toString());
  if (!photoRes.ok) {
    console.warn("Google place photo fetch failed:", photoRes.status);
    return null;
  }

  const body = Buffer.from(await photoRes.arrayBuffer());
  const contentType = photoRes.headers.get("content-type") || "image/jpeg";

  memoryCache.set(photoReference, {
    body,
    contentType,
    expiresAt: now + MEMORY_TTL_MS,
  });

  return { body, contentType };
}

/**
 * Streams a Google Place photo through our API (key stays server-side).
 * Image bytes are only kept in short-lived memory — not uploaded to CDN.
 */
export async function streamGooglePlacePhoto(
  supabase: SupabaseClient,
  googlePlaceId: string,
  resp: ServerResponse,
): Promise<void> {
  const cache = await ensurePhotoReference(supabase, googlePlaceId);
  if (!cache) {
    resp.writeHead(404, { "Content-Type": "text/plain" });
    resp.end("Photo not found");
    return;
  }

  const bytes = await fetchPhotoBytes(cache.photo_reference);
  if (!bytes) {
    resp.writeHead(502, { "Content-Type": "text/plain" });
    resp.end("Photo unavailable");
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": bytes.contentType,
    "Cache-Control": "private, max-age=3600",
    "X-Photo-Source": "google-places",
  };

  if (cache.attributions?.length) {
    headers["X-Photo-Attribution"] = cache.attributions.join(" ");
  }

  resp.writeHead(200, headers);
  resp.end(bytes.body);
}

export async function fetchAndCachePlacePhoto(
  supabase: SupabaseClient,
  googlePlaceId: string,
): Promise<string | null> {
  const normalizedId = extractGooglePlaceId(googlePlaceId);
  if (!normalizedId) {
    return null;
  }

  const cache = await ensurePhotoReference(supabase, normalizedId);
  if (!cache) {
    return null;
  }

  return googlePhotoProxyPath(normalizedId);
}
