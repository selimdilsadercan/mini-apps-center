import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { workplaces } from "@/lib/client";

const CATEGORY_COLORS: Record<string, string> = {
  cafe: "#B58463", // Muted Amber
  restaurant: "#B56363", // Muted Red
  dessert: "#B56395", // Muted Pink
  library: "#637DB5", // Muted Blue
  study_spot: "#7B63B5", // Muted Indigo
  park: "#63B58E", // Muted Emerald
  activity: "#B563B5", // Muted Purple
  natural_beauty: "#63B5B5", // Muted Teal
  historical: "#B59A63", // Muted Gold/Brown
  bar: "#9063B5", // Muted Violet
  mall: "#4B6584", // Muted Blue Gray
  museum: "#8E735C", // Muted Teracotta/Clay
  complex: "#576574", // Muted Slate/Steel
  shop: "#A55EEA", // Muted Purple
};

function getMarkerHtml(place: workplaces.Place, isSelected: boolean, showLabel: boolean, isDark: boolean) {
  const types = place.types?.length > 0 ? place.types : ["cafe"];
  const primaryColor = CATEGORY_COLORS[types[0]] || CATEGORY_COLORS.cafe;
  const size = isSelected ? "14px" : "10px";
  
  const labelColor = isDark ? "#ffffff" : "#1a1a1a";
  const labelBg = isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)";

  const dotsHtml = types.length === 1 
    ? `<div class="relative rounded-full border-2 border-white dark:border-neutral-900 shadow-md transition-all" 
             style="width: ${size}; height: ${size}; background-color: ${primaryColor}; ${isSelected ? `transform: scale(1.25); box-shadow: 0 0 10px ${primaryColor}88;` : ""}">
        </div>`
    : `<div class="flex gap-0.5">
        ${types.slice(0, 3).map((t, i) => `
          <div class="relative rounded-full border border-white dark:border-neutral-900 shadow-sm transition-all" 
               style="width: ${isSelected ? '10px' : '8px'}; height: ${isSelected ? '10px' : '8px'}; background-color: ${CATEGORY_COLORS[t] || CATEGORY_COLORS.cafe}; ${isSelected ? `transform: scale(1.1);` : ""}">
          </div>
        `).join('')}
      </div>`;

  return `
    <div class="flex flex-col items-center justify-end" style="width: 150px; height: 60px;">
      ${showLabel ? `
        <span class="px-2 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap shadow-md border border-black/10 dark:border-white/10 mb-1 pointer-events-none" 
              style="background-color: ${labelBg}; color: ${labelColor}; z-index: 20;">
          ${place.name}
        </span>` : ""}
      <div class="flex items-center justify-center" style="width: 40px; height: 20px; z-index: 10;">
        ${dotsHtml}
      </div>
      <div style="height: 15px;"></div>
    </div>
  `;
}

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
  /** Room above a bottom app bar (workplaces map tab) */
  insetBottom?: boolean;
  /** Static, non-interactive embed (home widget preview) */
  preview?: boolean;
}

const MAP_TILES = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    // Colorful Voyager base + CSS filter trick to get green parks and blue water in dark mode
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;

/** NW: Renkli Yaşam Parkı — SE: Halk Eğitimi Merkezi (home widget preview) */
const WIDGET_PREVIEW_BOUNDS = L.latLngBounds(
  [37.5853466, 36.8568443],
  [37.5994934, 36.9025323],
);

const WIDGET_PREVIEW_CENTER: [number, number] = [
  (37.5994934 + 37.5853466) / 2,
  (36.8568443 + 36.9025323) / 2,
];

function PreviewMapBounds() {
  const map = useMap();
  const lockedZoomRef = useRef<number | null>(null);

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(WIDGET_PREVIEW_BOUNDS, { animate: false, padding: [0, 0] });
      lockedZoomRef.current = map.getZoom();
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
    };

    fit();
    const t1 = window.setTimeout(fit, 50);
    const t2 = window.setTimeout(fit, 300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map]);

  useMapEvents({
    zoomend: () => {
      const locked = lockedZoomRef.current;
      if (locked !== null && map.getZoom() !== locked) {
        map.setZoom(locked, { animate: false });
      }
    },
  });

  return null;
}

// Controller component to handle programmatic panning/zooming to user coordinates
function MapController({ center, onZoomChange }: { center: [number, number] | null, onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true, duration: 0.75 });
    }
  }, [center, map]);
  return null;
}

export default function StudyPlacesMap({ places, onSelectPlace, selectedPlaceId, insetBottom = false, preview = false }: MapProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [panTarget, setPanTarget] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(preview ? 14 : 13);

  // Filter places that have coordinates (preview: only inside widget bounds)
  const validPlaces = React.useMemo(() => {
    const withCoords = places.filter((p) => p.latitude && p.longitude);
    if (!preview) return withCoords;
    return withCoords.filter((p) =>
      WIDGET_PREVIEW_BOUNDS.contains([p.latitude!, p.longitude!]),
    );
  }, [places, preview]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')));
  const tiles = isDark ? MAP_TILES.dark : MAP_TILES.light;

  // Pre-calculate label visibility to prevent overlap
  const placesWithLabels = React.useMemo(() => {
    if (!mounted) return [];

    const labelZoom = preview ? 14 : zoom;
    const prioritized = [...validPlaces].sort((a, b) => {
      if (a.id === selectedPlaceId) return -1;
      if (b.id === selectedPlaceId) return 1;

      // Primary priority: Internal ratings
      const scoreA = (a.internal_rating || 0) * Math.log10((a.internal_review_count || 0) + 1);
      const scoreB = (b.internal_rating || 0) * Math.log10((b.internal_review_count || 0) + 1);

      if (scoreA !== scoreB) return scoreB - scoreA;

      // Secondary priority (background): Google ratings
      const gScoreA = (a.rating || 0) * Math.log10((a.user_ratings_total || 0) + 1);
      const gScoreB = (b.rating || 0) * Math.log10((b.user_ratings_total || 0) + 1);
      return gScoreB - gScoreA;
    });

    const labelledPositions: { lat: number, lng: number }[] = [];
    
    // Distance threshold in degrees (scales with zoom)
    // Much tighter thresholds for the new minimal labels
    const latThreshold = 0.004 / Math.pow(2, labelZoom - 13);
    const lngThreshold = 0.012 / Math.pow(2, labelZoom - 13);

    return prioritized.map(place => {
      const pos = { lat: place.latitude!, lng: place.longitude! };
      let showLabel = place.id === selectedPlaceId;

      if (!showLabel) {
        if (labelZoom < 14) {
          showLabel = false;
        } else if (labelZoom >= 17.5) {
          showLabel = true;
        } else {
          showLabel = true;
          for (const other of labelledPositions) {
            if (Math.abs(pos.lat - other.lat) < latThreshold &&
                Math.abs(pos.lng - other.lng) < lngThreshold) {
              showLabel = false;
              break;
            }
          }
        }
      }

      if (showLabel) {
        labelledPositions.push(pos);
      }

      return { ...place, showLabel };
    });
  }, [validPlaces, zoom, selectedPlaceId, mounted, preview]);

  const defaultCenter: [number, number] = [37.585, 36.937];
  const center: [number, number] = preview
    ? WIDGET_PREVIEW_CENTER
    : validPlaces.length > 0
      ? [validPlaces[0].latitude!, validPlaces[0].longitude!]
      : defaultCenter;

  // Ask for and trace user location on mount (interactive map only)
  useEffect(() => {
    if (!mounted || preview) return;
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
  }, [mounted, preview]);

  const handleLocateMe = () => {
    if (preview) return;
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

  if (!mounted) {
    return <div className="w-full h-full bg-app-bg" />;
  }

  const mapZoom = preview ? 14 : 13;

  return (
    <div
      className={`w-full h-full relative ${
        isDark ? "leaflet-map-google-dark" : ""
      } ${
        preview
          ? "leaflet-map-preview-embed cursor-grab active:cursor-grabbing [&_.leaflet-container]:!absolute [&_.leaflet-container]:!inset-0 [&_.leaflet-container]:!h-full [&_.leaflet-container]:!w-full [&_.leaflet-map-pane]:!h-full [&_.leaflet-map-pane]:!w-full"
          : ""
      }`}
    >
      <MapContainer
        center={center}
        zoom={mapZoom}
        style={{ width: "100%", height: "100%", background: isDark ? "#17263c" : "#eef2f6" }}
        zoomControl={false}
        dragging
        touchZoom={!preview}
        scrollWheelZoom={!preview}
        doubleClickZoom={!preview}
        boxZoom={!preview}
        keyboard={!preview}
        attributionControl={!preview}
      >
        {!preview && <MapController center={panTarget} onZoomChange={setZoom} />}
        {preview && <PreviewMapBounds />}

        <TileLayer
          key={isDark ? "dark" : "light"}
          attribution={tiles.attribution}
          url={tiles.url}
          maxZoom={19}
        />

        {/* User's Current Location Marker */}
        {!preview && userLocation && (
          <Marker position={userLocation} icon={userMarkerIcon} />
        )}

        {placesWithLabels.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const mapIcon = L.divIcon({
            html: getMarkerHtml(place, isSelected, place.showLabel, isDark),
            className: "custom-venue-marker",
            iconSize: [150, 60],
            iconAnchor: [75, 35],
          });

          return (
            <Marker
              key={place.id}
              position={[place.latitude!, place.longitude!]}
              icon={mapIcon}
              eventHandlers={
                preview
                  ? undefined
                  : { click: () => onSelectPlace(place) }
              }
            />
          );
        })}
      </MapContainer>

      {!preview && (
        <button
          onClick={handleLocateMe}
          className={`absolute right-4 w-11 h-11 bg-app-surface hover:bg-app-bg text-app-text rounded-full flex items-center justify-center shadow-xl z-[999] border border-app-border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            insetBottom ? "bottom-24" : "bottom-6"
          }`}
          title="Konumumu Bul"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-amber-600 dark:text-amber-400">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" className="opacity-30" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
