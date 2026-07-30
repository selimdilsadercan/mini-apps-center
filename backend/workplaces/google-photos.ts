/** Google Place ID parsing from Maps URLs — no Google Maps API calls. */

export function googlePhotoProxyPath(googlePlaceId: string): string {
  return `/workplaces/google-photo/${encodeURIComponent(googlePlaceId)}`;
}

/** @deprecated Legacy image URLs — Google photo proxy is disabled. */
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
