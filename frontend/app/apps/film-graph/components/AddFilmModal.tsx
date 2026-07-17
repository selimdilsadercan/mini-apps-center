"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { ACCENT } from "../film-data";

interface Person {
  id: string;
  name: string;
  role: "actor" | "director";
}

interface FilmData {
  id: string;
  title: string;
  year: number;
  director: Person;
  actors: Person[];
}

interface AddFilmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (film: FilmData) => void;
}

export default function AddFilmModal({
  isOpen,
  onClose,
  onAdd,
}: AddFilmModalProps) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [director, setDirector] = useState("");
  const [actorInput, setActorInput] = useState("");
  const [actors, setActors] = useState<string[]>([]);

  const handleAddActor = () => {
    if (actorInput.trim() && !actors.includes(actorInput.trim())) {
      setActors([...actors, actorInput.trim()]);
      setActorInput("");
    }
  };

  const handleRemoveActor = (actor: string) => {
    setActors(actors.filter((a) => a !== actor));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !director.trim()) return;

    const filmId = `film-${Date.now()}`;
    const directorId = `person-${director.toLowerCase().replace(/\s+/g, "-")}`;

    const filmData: FilmData = {
      id: filmId,
      title: title.trim(),
      year: parseInt(year) || new Date().getFullYear(),
      director: {
        id: directorId,
        name: director.trim(),
        role: "director",
      },
      actors: actors.map((name) => ({
        id: `person-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name: name,
        role: "actor" as const,
      })),
    };

    onAdd(filmData);

    setTitle("");
    setYear("");
    setDirector("");
    setActors([]);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-3 bg-app-surface-muted border border-app-border rounded-xl text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-sm";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-app-surface border border-app-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-app-border">
          <h2 className="text-lg font-black text-app-text">Film Ekle</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-app-surface-muted rounded-lg transition-colors text-app-muted hover:text-app-text"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-app-muted uppercase tracking-widest mb-2">
              Film Adı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn: Inception"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-app-muted uppercase tracking-widest mb-2">
              Yıl
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2010"
              min="1900"
              max="2030"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-app-muted uppercase tracking-widest mb-2">
              Yönetmen *
            </label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="örn: Christopher Nolan"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-app-muted uppercase tracking-widest mb-2">
              Oyuncular
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={actorInput}
                onChange={(e) => setActorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddActor();
                  }
                }}
                placeholder="Oyuncu adı"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={handleAddActor}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-xs font-black uppercase tracking-wide transition-colors"
              >
                Ekle
              </button>
            </div>

            {actors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actors.map((actor) => (
                  <span
                    key={actor}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold"
                  >
                    {actor}
                    <button
                      type="button"
                      onClick={() => handleRemoveActor(actor)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.99]"
            style={{ backgroundColor: ACCENT }}
          >
            Filmi Ekle
          </button>
        </form>
      </div>
    </div>
  );
}
