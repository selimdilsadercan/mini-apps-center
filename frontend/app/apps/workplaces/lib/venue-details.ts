import type { workplaces } from "@/lib/client";

export function hasWorkplaceDetails(place: workplaces.Place): boolean {
  const metadata = place.metadata ?? {};
  const parkingStatus = metadata.parking_status;
  const hasParking =
    place.parking ||
    (Array.isArray(parkingStatus) ? parkingStatus.length > 0 : parkingStatus && parkingStatus !== "NO");

  return !!(
    place.wifi ||
    hasParking ||
    place.power_outlets ||
    metadata.wifi_status && metadata.wifi_status !== "NO" ||
    metadata.outlets_status && metadata.outlets_status !== "NO" ||
    (Array.isArray(metadata.areas) && metadata.areas.length > 0) ||
    (metadata.view_status && metadata.view_status !== "NO") ||
    metadata.coffee_price ||
    (place.quiet_level != null && place.quiet_level !== 3)
  );
}

export function getOutdoorCategoryId(place: workplaces.Place): string | null {
  const metadata = place.metadata ?? {};
  if (typeof metadata.outdoor_category === "string" && metadata.outdoor_category) {
    return metadata.outdoor_category;
  }
  if (place.types?.includes("outdoor")) {
    return typeof metadata.activity_category === "string" ? metadata.activity_category : null;
  }
  return null;
}
