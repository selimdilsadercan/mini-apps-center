/** Resolve place image URL (direct https or app-relative paths). */
export function resolvePlaceImageSrc(imageUrl?: string | null): string | undefined {
  if (!imageUrl?.trim()) return undefined;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/encore-api/")) {
    return imageUrl;
  }

  return imageUrl;
}

export function isGooglePlacePhoto(_imageUrl?: string | null): boolean {
  return false;
}
