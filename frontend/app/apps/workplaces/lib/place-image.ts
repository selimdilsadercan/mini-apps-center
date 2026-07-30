import { getEncoreApiBase } from "@/lib/api";

/** Resolve place image URL — Google photos use our API proxy, not CDN re-hosting. */
export function resolvePlaceImageSrc(imageUrl?: string | null): string | undefined {
  if (!imageUrl?.trim()) return undefined;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/workplaces/google-photo/")) {
    const base = getEncoreApiBase().replace(/\/$/, "");
    return `${base}${imageUrl}`;
  }

  if (imageUrl.startsWith("/encore-api/")) {
    return imageUrl;
  }

  return imageUrl;
}

export function isGooglePlacePhoto(imageUrl?: string | null): boolean {
  return !!imageUrl?.includes("/workplaces/google-photo/");
}
