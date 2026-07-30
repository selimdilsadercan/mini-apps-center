"use client";

import { Suspense } from "react";
import WorkplacesMapView from "../components/WorkplacesMapView";
import { useWorkplacesPlaces } from "../hooks/use-workplaces-places";

function MapPageContent() {
  const { places, loading } = useWorkplacesPlaces();
  return (
    <div className="h-full w-full">
      <WorkplacesMapView places={places} loading={loading} />
    </div>
  );
}

export default function WorkplacesMapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
