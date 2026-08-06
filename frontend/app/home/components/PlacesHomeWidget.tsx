"use client";

import dynamic from "next/dynamic";
import type { workplaces } from "@/lib/client";

const StudyPlacesMapPreview = dynamic(
  () => import("@/components/maps/StudyPlacesMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#17263c] animate-pulse" />
    ),
  },
);

export function PlacesHomeWidget({ places }: { places: workplaces.Place[] }) {
  const hasMapPlaces = places.some(
    (p) => p.latitude != null && p.longitude != null,
  );

  if (!hasMapPlaces) return null;

  return (
    <div className="relative w-full h-[152px] overflow-hidden border-t border-app-border rounded-b-2xl">
      <div className="absolute inset-0 [&_.leaflet-container]:!h-full [&_.leaflet-container]:!w-full">
        <StudyPlacesMapPreview
          places={places}
          onSelectPlace={() => {}}
          preview
        />
      </div>
    </div>
  );
}
