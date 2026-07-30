export const DEFAULT_VENUE_CITY = "kahramanmaras";

/** Kahramanmaraş city center */
export const MARAS_MAP_CENTER: [number, number] = [37.585, 36.937];

/** Canonical venue types for the core places app */
export const VENUE_PRIMARY_TYPES = [
  { id: "cafe", label: "Kafe" },
  { id: "restaurant", label: "Restoran" },
  { id: "dessert", label: "Tatlıcı" },
  { id: "library", label: "Kütüphane" },
  { id: "study_spot", label: "Çalışma Alanı" },
  { id: "park", label: "Park" },
  { id: "activity", label: "Aktivite" },
  { id: "natural_beauty", label: "Doğal Güzellik" },
  { id: "historical", label: "Tarihi Yer" },
  { id: "mall", label: "AVM" },
  { id: "museum", label: "Müze" },
  { id: "complex", label: "Yerleşke" },
] as const;

export type VenuePrimaryType = (typeof VENUE_PRIMARY_TYPES)[number]["id"] | "bar";

/** Filter chips on explore — one per primary type */
export const VENUE_TYPE_FILTERS = VENUE_PRIMARY_TYPES;

export const FOOD_VENUE_TYPES: VenuePrimaryType[] = [
  "cafe",
  "restaurant",
  "dessert",
];

const VENUE_TYPE_LABELS: Record<string, string> = {
  cafe: "Kafe",
  restaurant: "Restoran",
  dessert: "Tatlıcı",
  library: "Kütüphane",
  study_spot: "Çalışma Alanı",
  park: "Park",
  activity: "Aktivite",
  natural_beauty: "Doğal Güzellik",
  historical: "Tarihi Yer",
  bar: "Bar",
  mall: "AVM",
  museum: "Müze",
  complex: "Yerleşke",
};

export function getVenueTypeLabel(type?: string | null): string {
  if (!type) return "Mekan";
  return VENUE_TYPE_LABELS[type] ?? "Mekan";
}

export function getPrimaryVenueType(types?: string[] | null): string {
  if (!types || types.length === 0) return "cafe";
  return types[0];
}

export function matchesVenueTypeFilter(
  types: string[] | null | undefined,
  filterType: string,
): boolean {
  if (!filterType) return true;
  if (!types) return false;
  return types.includes(filterType);
}

/** @deprecated Use VENUE_TYPE_FILTERS + matchesVenueTypeFilter */
export const VENUE_CATEGORY_FILTERS = VENUE_TYPE_FILTERS;

/** @deprecated Use matchesVenueTypeFilter */
export const matchesVenueCategoryFilter = matchesVenueTypeFilter;
