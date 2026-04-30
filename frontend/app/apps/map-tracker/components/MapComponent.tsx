"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CheckCircle, Circle } from "@phosphor-icons/react";

// Fix Leaflet icon issue inside client component
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapComponentProps {
  items: any[];
  onToggleVisited: (id: string) => void;
}

export default function MapComponent({ items, onToggleVisited }: MapComponentProps) {
  return (
    <MapContainer 
      center={[41.0082, 28.9784]} 
      zoom={12} 
      className="h-full w-full"
      style={{ background: '#F1EDE2' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {items.filter(i => i.latitude && i.longitude).map(item => (
        <Marker 
          key={item.id} 
          position={[item.latitude, item.longitude]}
          icon={DefaultIcon}
        >
          <Popup>
            <div className="p-1 font-sans">
              <h3 className="font-bold text-[#3D405B]">{item.name}</h3>
              <p className="text-xs text-[#8D99AE] mb-2">{item.address}</p>
              <button 
                onClick={() => onToggleVisited(item.id)}
                className={`w-full py-1.5 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors ${item.is_visited ? "bg-[#A3B18A] text-white" : "bg-[#F1EDE2] text-[#4A4A4A]"}`}
              >
                {item.is_visited ? <CheckCircle weight="fill" /> : <Circle />}
                {item.is_visited ? "Gidildi" : "Gidilmedi"}
              </button>
              {item.google_maps_url && (
                <a 
                  href={item.google_maps_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-2 text-center text-xs text-blue-500 underline"
                >
                  Maps'te Aç
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
