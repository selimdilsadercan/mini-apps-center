type PlaceLike = {
  url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
};

/** Google Maps URL: önce kayıtlı link, yoksa koordinat veya adres. */
export function resolveMapsHref(place: PlaceLike): string | undefined {
  if (place.url?.trim()) return place.url.trim();
  if (place.latitude != null && place.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  if (place.address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address.trim())}`;
  }
  return undefined;
}
