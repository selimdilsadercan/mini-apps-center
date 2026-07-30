import { api } from "encore.dev/api";
import { currentRequest } from "encore.dev";
import type { APICallMeta } from "encore.dev";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { extractGooglePlaceId, streamGooglePlacePhoto } from "./google-photos";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

/**
 * Proxy endpoint for Google Place photos.
 * Does NOT re-host images — streams from Google per request (with short in-memory cache).
 */
export const serveGooglePlacePhoto = api.raw(
  { expose: true, method: "GET", path: "/workplaces/google-photo/:googlePlaceId" },
  async (_req, resp) => {
    try {
      const meta = currentRequest() as APICallMeta;
      const rawId = meta.pathParams?.googlePlaceId ?? "";
      const googlePlaceId = extractGooglePlaceId(decodeURIComponent(rawId));

      if (!googlePlaceId) {
        resp.writeHead(400, { "Content-Type": "text/plain" });
        resp.end("Invalid place id");
        return;
      }

      await streamGooglePlacePhoto(supabase, googlePlaceId, resp);
    } catch (err) {
      console.error("serveGooglePlacePhoto error:", err);
      resp.writeHead(500, { "Content-Type": "text/plain" });
      resp.end("Internal error");
    }
  },
);
