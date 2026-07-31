"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, X, ArrowSquareOut } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";

export interface SelectedPlace {
  placeId: string;
  name: string;
  district?: string | null;
}

interface PlacePickerProps {
  value: SelectedPlace | null;
  onChange: (value: SelectedPlace | null) => void;
  disabled?: boolean;
}

export function PlacePicker({ value, onChange, disabled }: PlacePickerProps) {
  const client = useMemo(() => createBrowserClient(), []);
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<SelectedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value?.placeId, value?.name]);

  useEffect(() => {
    if (disabled) return;

    const q = query.trim();
    if (!q || (value && q === value.name)) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await client.workplaces.searchPlace({ query: q });
        setResults(
          (res.results || [])
            .filter((row) => row.id)
            .map((row) => ({
              placeId: row.id!,
              name: row.name,
              district: row.district,
            })),
        );
        setOpen(true);
      } catch (err) {
        console.error("Place search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, client, disabled, value]);

  const clearSelection = () => {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
          />
          <input
            disabled={disabled}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (value && e.target.value !== value.name) {
                onChange(null);
              }
            }}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            placeholder="Mekan ara..."
            className="w-full bg-app-surface border border-app-border rounded-xl pl-9 pr-4 py-3 text-sm focus:border-[#FF1493]/50 outline-none text-app-text placeholder:text-app-muted disabled:opacity-50"
          />
        </div>
        {value && !disabled && (
          <button
            type="button"
            onClick={clearSelection}
            className="shrink-0 px-3 rounded-xl border border-app-border text-app-muted hover:text-app-text hover:bg-app-surface-muted transition-colors cursor-pointer"
            aria-label="Mekan seçimini temizle"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>

      {loading && (
        <p className="text-[10px] text-[#FF1493] font-semibold mt-2 animate-pulse">Mekanlar aranıyor...</p>
      )}

      {open && results.length > 0 && !disabled && (
        <ul className="absolute z-20 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-app-border bg-app-surface shadow-xl">
          {results.map((place) => (
            <li key={place.placeId}>
              <button
                type="button"
                onClick={() => {
                  onChange(place);
                  setQuery(place.name);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-app-surface-muted transition-colors cursor-pointer border-b border-app-border last:border-b-0"
              >
                <p className="text-sm font-bold text-app-text truncate">{place.name}</p>
                {place.district && (
                  <p className="text-[11px] text-app-muted font-semibold truncate">{place.district}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ConcertVenueLink({
  venue,
  placeId,
  className = "",
}: {
  venue?: string;
  placeId?: string;
  className?: string;
}) {
  if (!venue) return null;

  if (placeId) {
    return (
      <a
        href={`/apps/workplaces/place?placeId=${encodeURIComponent(placeId)}`}
        className={`inline-flex items-center gap-1 truncate hover:text-[#FF1493] transition-colors ${className}`}
      >
        <MapPin size={12} />
        <span className="truncate">{venue}</span>
      </a>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 truncate ${className}`}>
      <MapPin size={12} />
      <span className="truncate">{venue}</span>
    </span>
  );
}

export function ConcertInfoLink({
  infoUrl,
  className = "",
  label = "Detay",
}: {
  infoUrl?: string;
  className?: string;
  label?: string;
}) {
  if (!infoUrl) return null;

  return (
    <a
      href={infoUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 shrink-0 hover:opacity-80 transition-opacity ${className}`}
    >
      <ArrowSquareOut size={12} weight="bold" />
      <span>{label}</span>
    </a>
  );
}
