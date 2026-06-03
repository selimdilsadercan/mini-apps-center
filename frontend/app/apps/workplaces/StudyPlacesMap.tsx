import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { workplaces } from "@/lib/client";

// Clean Amber marker icon
const customMarkerHtml = `
  <div class="flex items-center justify-center bg-amber-700 w-8 h-8 rounded-full border-2 border-white shadow-md transform -translate-y-1 transition-all hover:scale-110">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-4.5 h-4.5" style="width: 18px; height: 18px;">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>
`;

// Selected/Active marker icon (larger, darker, subtle ring bounce)
const selectedMarkerHtml = `
  <div class="flex items-center justify-center bg-amber-950 w-9.5 h-9.5 rounded-full border-2 border-amber-400 shadow-xl transform -translate-y-1.5 ring-4 ring-amber-500/20">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-5 h-5" style="width: 20px; height: 20px;">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>
`;

interface MapProps {
  places: workplaces.Place[];
  onSelectPlace: (place: workplaces.Place) => void;
  selectedPlaceId?: string;
}

export default function StudyPlacesMap({ places, onSelectPlace, selectedPlaceId }: MapProps) {
  if (typeof window === "undefined") return null;

  // Filter places that have coordinates
  const validPlaces = places.filter((p) => p.latitude && p.longitude);

  const defaultCenter: [number, number] = [41.0082, 28.9784];
  const center: [number, number] = validPlaces.length > 0
    ? [validPlaces[0].latitude!, validPlaces[0].longitude!]
    : defaultCenter;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Google Maps-like vibrant & soft tile style (CARTO Voyager) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {validPlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const mapIcon = L.divIcon({
            html: isSelected ? selectedMarkerHtml : customMarkerHtml,
            className: "custom-div-icon",
            iconSize: isSelected ? [38, 38] : [32, 32],
            iconAnchor: isSelected ? [19, 38] : [16, 32],
          });

          return (
            <Marker
              key={place.id}
              position={[place.latitude!, place.longitude!]}
              icon={mapIcon}
              eventHandlers={{
                click: () => onSelectPlace(place),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
