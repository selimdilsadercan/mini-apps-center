"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { searchGamesAction } from "../actions";
import type { gaming_hub } from "@/lib/client";

interface GameSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (game: gaming_hub.CatalogGame) => void;
  placeholder?: string;
}

export default function GameSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Oyun ara...",
}: GameSearchInputProps) {
  const [results, setResults] = useState<gaming_hub.CatalogGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await searchGamesAction(value.trim());
      setSearching(false);
      if (res.data) {
        setResults(res.data);
        setOpen(true);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = open && (searching || results.length > 0);

  return (
    <div ref={containerRef} className="relative">
      {showDropdown && (
        <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {searching && (
            <p className="px-4 py-3 text-xs font-bold text-gray-400">Aranıyor...</p>
          )}
          {!searching &&
            results.map((game) => (
              <button
                key={game.gameId}
                type="button"
                onClick={() => {
                  onSelect(game);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100 text-left"
              >
                {game.coverUrl ? (
                  <img
                    src={game.coverUrl}
                    alt=""
                    className="w-10 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
                  />
                ) : (
                  <div className="w-10 h-14 rounded-lg bg-violet-50 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-gray-900 truncate">{game.title}</p>
                  <p className="text-[10px] font-bold text-gray-400 truncate">
                    {game.genres.slice(0, 2).join(", ") || "Oyun"}
                    {game.rating != null && ` · ${game.rating}/10`}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}

      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim().length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:border-violet-200"
        />
      </div>
    </div>
  );
}
