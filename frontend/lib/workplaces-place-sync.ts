import type { workplaces } from "@/lib/client";

const STORAGE_KEY = "workplaces_place_patches";

export type PlaceStatusPatch = {
  is_favorite?: boolean;
  is_visited?: boolean;
};

function readAllPatches(): Record<string, PlaceStatusPatch> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || "{}",
    ) as Record<string, PlaceStatusPatch>;
  } catch {
    return {};
  }
}

export function setPlaceStatusPatch(
  placeId: string,
  patch: PlaceStatusPatch,
): void {
  if (typeof window === "undefined") return;
  const all = readAllPatches();
  all[placeId] = { ...all[placeId], ...patch };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function normalizePlace(place: workplaces.Place): workplaces.Place {
  return {
    ...place,
    is_favorite: Boolean(place.is_favorite),
    is_visited: Boolean(place.is_visited),
  };
}

export function applyPlacePatches(
  places: workplaces.Place[],
): workplaces.Place[] {
  const patches = readAllPatches();
  if (!Object.keys(patches).length) {
    return places.map(normalizePlace);
  }
  return places.map((place) => {
    const patch = patches[place.id];
    return normalizePlace(patch ? { ...place, ...patch } : place);
  });
}

export function applyPlacePatch(place: workplaces.Place): workplaces.Place {
  const patch = readAllPatches()[place.id];
  return normalizePlace(patch ? { ...place, ...patch } : place);
}
