"use client";

import { useState } from "react";

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

    // Formu temizle
    setTitle("");
    setYear("");
    setDirector("");
    setActors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Add Movie</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Film Adı */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Movie Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g.: Inception"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
              required
            />
          </div>

          {/* Yıl */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Release Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2010"
              min="1900"
              max="2030"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
            />
          </div>

          {/* Yönetmen */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Director *
            </label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="e.g.: Christopher Nolan"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
              required
            />
          </div>

          {/* Oyuncular */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Actors
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
                placeholder="Enter actor name"
                className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddActor}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {/* Eklenen oyuncular */}
            {actors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actors.map((actor) => (
                  <span
                    key={actor}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                  >
                    {actor}
                    <button
                      type="button"
                      onClick={() => handleRemoveActor(actor)}
                      className="hover:text-blue-200 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all shadow-lg shadow-red-500/25"
          >
            Add Movie
          </button>
        </form>
      </div>
    </div>
  );
}
