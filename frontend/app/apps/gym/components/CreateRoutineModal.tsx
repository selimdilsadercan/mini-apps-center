"use client";

import { useState } from "react";
import { X, Check } from "@phosphor-icons/react";
import type { ExerciseRef } from "../types";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExercisePicker from "./ExercisePicker";
import { getExerciseBySlug } from "../exercises";

export default function CreateRoutineModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, exercises: ExerciseRef[]) => void;
}) {
  const { catalog, loading, error } = useExerciseCatalog();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.size === 0) return;
    setSaving(true);
    const exercises = [...selected]
      .map((slug) => {
        const ex = getExerciseBySlug(catalog, slug);
        return ex ? { slug: ex.slug, name: ex.name } : null;
      })
      .filter((e): e is ExerciseRef => e !== null);
    await onCreate(name.trim(), exercises);
    setSaving(false);
    setName("");
    setSelected(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#FAF9F7] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200/60">
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">Yeni Rutin</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/60 text-gray-500"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Rutin Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Push Day"
              className="w-full bg-white border border-gray-200/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Egzersizler ({selected.size})
            </label>
            {loading ? (
              <p className="text-center py-8 text-xs font-bold text-gray-400 animate-pulse">
                Egzersizler yükleniyor...
              </p>
            ) : error ? (
              <p className="text-center py-8 text-xs font-bold text-red-500">{error}</p>
            ) : (
              <ExercisePicker
                catalog={catalog}
                selectedSlugs={selected}
                multiSelect
                onSelect={(ex) => toggle(ex.slug)}
              />
            )}
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...selected].map((slug) => {
                const ex = getExerciseBySlug(catalog, slug);
                if (!ex) return null;
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggle(slug)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-100 text-violet-700 text-[10px] font-bold"
                  >
                    {ex.name}
                    <Check size={12} weight="bold" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-gray-200/60">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.size === 0 || saving || loading}
            className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            {saving ? "Kaydediliyor..." : "Rutini Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}
