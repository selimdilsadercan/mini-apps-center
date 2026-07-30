import { api } from "encore.dev/api";
import { currentRequest } from "encore.dev";
import type { APICallMeta } from "encore.dev";
import { extractGooglePlaceId } from "./google-photos";

/**
 * Legacy route — Google Place photo proxy disabled (no API key / manual images only).
 */
export const serveGooglePlacePhoto = api.raw(
  { expose: true, method: "GET", path: "/workplaces/google-photo/:googlePlaceId" },
  async (_req, resp) => {
    const meta = currentRequest() as APICallMeta;
    const rawId = meta.pathParams?.googlePlaceId ?? "";
    const googlePlaceId = extractGooglePlaceId(decodeURIComponent(rawId));

    if (!googlePlaceId) {
      resp.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      resp.end("Invalid place id");
      return;
    }

    resp.writeHead(410, { "Content-Type": "text/plain; charset=utf-8" });
    resp.end("Google photo proxy disabled — set image_url on the place manually.");
  },
);
