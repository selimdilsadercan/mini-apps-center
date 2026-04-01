"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, ArrowsClockwise } from "@phosphor-icons/react";
import { GraphNode } from "../types";

interface Film {
  id: string;
  title: string;
  year: number;
}

interface FilmListProps {
  films: Film[];
  onAddClick: () => void;
  onResetClick: () => void;
  onFilmClick: (filmId: string) => void;
  onDeleteFilm: (filmId: string) => void;
  selectedNodeId?: string;
}

export default function FilmList({
  films,
  onAddClick,
  onResetClick,
  onFilmClick,
  onDeleteFilm,
  selectedNodeId,
}: FilmListProps) {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.back()} 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          <h2 className="text-lg font-bold text-white tracking-tight">Film Graph</h2>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">My Movies</h3>
          <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-md text-[10px] font-bold text-zinc-400">
            {films.length}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onAddClick}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl text-white font-bold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            Add Movie
          </button>
          <button
            onClick={onResetClick}
            className="w-full py-2.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-zinc-400 font-bold transition-all flex items-center justify-center gap-2 text-[10px] border border-zinc-700 uppercase tracking-widest cursor-pointer"
          >
            <ArrowsClockwise size={16} weight="bold" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Film Listesi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {films.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-sm">No movies added yet</p>
          </div>
        ) : (
          films.map((film) => (
            <div
              key={film.id}
              className={`group p-4 rounded-xl cursor-pointer transition-all ${
                selectedNodeId === film.id
                  ? "bg-red-500/20 border border-red-500/50"
                  : "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent"
              }`}
              onClick={() => onFilmClick(film.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {film.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">{film.year}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFilm(film.id);
                  }}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <svg
                    className="w-4 h-4 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-widest">Color Codes</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-zinc-400">Movie</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-zinc-400">Director</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-zinc-400">Actor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
