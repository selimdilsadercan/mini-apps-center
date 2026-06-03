import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

// Blue dot user location marker icon with pulse effect
const userLocationHtml = `
  <div class="relative flex items-center justify-center w-6 h-6">
    <div class="absolute w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-50"></div>
    <div class="relative w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
  </div>
`;

interface MapProps {
  places: workplaces.Place[];
  onSelectPlace: (place: workplaces.Place) => void;
  selectedPlaceId?: string;
}

// Controller component to handle programmatic panning/zooming to user coordinates
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true, duration: 0.75 });
    }
  }, [center, map]);
  return null;
}

export default function StudyPlacesMap({ places, onSelectPlace, selectedPlaceId }: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [panTarget, setPanTarget] = useState<[number, number] | null>(null);

  if (typeof window === "undefined") return null;

  // Filter places that have coordinates
  const validPlaces = places.filter((p) => p.latitude && p.longitude);

  const defaultCenter: [number, number] = [41.0082, 28.9784];
  const center: [number, number] = validPlaces.length > 0
    ? [validPlaces[0].latitude!, validPlaces[0].longitude!]
    : defaultCenter;

  // Ask for and trace user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latLng: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(latLng);
          // Focus map on user location on initial load
          setPanTarget(latLng);
        },
        (error) => {
          console.warn("Geolocation access denied or failed:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latLng: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(latLng);
        setPanTarget(latLng);
      });
    }
  };

  const userMarkerIcon = L.divIcon({
    html: userLocationHtml,
    className: "user-location-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false} // Disable default top-left controls to place custom controls
      >
        <MapController center={panTarget} />

        {/* Google Maps light theme style */}
        <TileLayer
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          maxZoom={20}
        />

        {/* User's Current Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userMarkerIcon} />
        )}

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

      {/* Floating Action Button to Locate User */}
      <button
        onClick={handleLocateMe}
        className="absolute bottom-6 right-6 w-11 h-11 bg-white hover:bg-neutral-50 text-neutral-800 rounded-full flex items-center justify-center shadow-xl z-[999] border border-neutral-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Konumumu Bul"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-amber-800">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" className="opacity-30" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
