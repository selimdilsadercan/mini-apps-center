"use client";

import React, { useState, useEffect } from "react";
import TUSShell from "../components/TUSShell";
import {
  Trash,
  ArrowUp,
  ArrowDown,
  PencilSimple,
  ShareNetwork,
  Plus,
  BookOpen,
  Check,
  Stethoscope,
  CaretRight,
  CaretDown,
} from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { TUSPlacement } from "../page";
import { tusApi } from "../lib/api";
import { getInstitutionTypeBadgeClass } from "../lib/institutionTypes";

interface SavedItemWithPlacement {
  placementId: string;
  note: string;
  placement?: TUSPlacement;
}

export default function TUSSavedPage() {
  const userId = "local_user";

  const [savedItems, setSavedItems] = useState<SavedItemWithPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  useEffect(() => {
    loadSavedChoices();
  }, []);

  const loadSavedChoices = async () => {
    try {
      setLoading(true);
      const { TUS_PLACEMENTS } = await import("../data/placements_data");

      try {
        const res = await tusApi.getSavedChoices(userId);
        if (res?.items?.length > 0) {
          const items: SavedItemWithPlacement[] = res.items.map((row) => ({
            placementId: row.placementId,
            note: row.note || "",
            placement: TUS_PLACEMENTS.find((p) => p.id === row.placementId),
          }));
          setSavedItems(items);
          localStorage.setItem(`tus_saved_${userId}`, JSON.stringify(items.map((i) => i.placementId)));
          return;
        }
      } catch {
        console.warn("DB unreachable, using localStorage");
      }

      const stored = localStorage.getItem(`tus_saved_${userId}`);
      const storedNotes = localStorage.getItem(`tus_notes_${userId}`);
      const notesMap: Record<string, string> = storedNotes ? JSON.parse(storedNotes) : {};
      const savedIds: string[] = stored ? JSON.parse(stored) : [];

      setSavedItems(
        savedIds.map((id) => ({
          placementId: id,
          note: notesMap[id] || "",
          placement: TUS_PLACEMENTS.find((p) => p.id === id),
        }))
      );
    } catch (e) {
      console.error("Error loading choices", e);
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const newItems = [...savedItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setSavedItems(newItems);
    saveOrderToStorage(newItems);

    try {
      await tusApi.reorderSavedChoices(userId, newItems.map((i) => i.placementId));
    } catch {}
  };

  const removeItem = async (placementId: string) => {
    const updated = savedItems.filter((i) => i.placementId !== placementId);
    setSavedItems(updated);
    saveOrderToStorage(updated);
    toast.success("Tercih çıkarıldı.");
    try {
      await tusApi.removeSavedChoice(userId, placementId);
    } catch {}
  };

  const saveOrderToStorage = (items: SavedItemWithPlacement[]) => {
    localStorage.setItem(`tus_saved_${userId}`, JSON.stringify(items.map((i) => i.placementId)));
  };

  const saveNote = async (placementId: string) => {
    const updated = savedItems.map((item) =>
      item.placementId === placementId ? { ...item, note: tempNoteText } : item
    );
    setSavedItems(updated);

    try {
      const storedNotes = localStorage.getItem(`tus_notes_${userId}`);
      const notesMap: Record<string, string> = storedNotes ? JSON.parse(storedNotes) : {};
      notesMap[placementId] = tempNoteText;
      localStorage.setItem(`tus_notes_${userId}`, JSON.stringify(notesMap));
      await tusApi.addSavedChoice(userId, placementId, tempNoteText);
    } catch {}

    setEditingNoteId(null);
    toast.success("Not kaydedildi.");
  };

  const copyListSummary = () => {
    if (savedItems.length === 0) return;
    const text = savedItems
      .map((item, idx) => {
        const p = item.placement;
        if (!p) return `${idx + 1}. ${item.placementId}`;
        const latest = p.history[0];
        return `${idx + 1}. ${p.specialtyName} — ${p.institutionName} (${p.institutionType}) [Puan: ${latest?.score?.toFixed(2) ?? "—"}]`;
      })
      .join("\n");

    navigator.clipboard.writeText(`TUS Tercih Listem:\n\n${text}`);
    toast.success("Tercih listeniz panoya kopyalandı!");
  };

  const getTypeBadge = (type?: string) => getInstitutionTypeBadgeClass(type || "");

  return (
    <TUSShell activeTab="saved">
      <div className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Tercih Listeniz ({savedItems.length})
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Sıralamayı yukarı/aşağı oklarla ayarlayabilirsiniz.
            </p>
          </div>
          {savedItems.length > 0 && (
            <button
              onClick={copyListSummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
            >
              <ShareNetwork size={14} weight="bold" />
              <span>Paylaş</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">Tercih listeniz yükleniyor...</div>
        ) : savedItems.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-gray-200/80 dark:border-zinc-800">
            <BookOpen size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Henüz tercih eklemediniz</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Arama sekmesinden kurumları listenize ekleyebilirsiniz.
            </p>
            <Link
              href="/apps/tus-tercih"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus size={14} weight="bold" /> Kurum Taramaya Başla
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 font-bold border-b border-gray-200/80 dark:border-zinc-800">
                    <th className="py-3 px-2 text-center w-8">#</th>
                    <th className="py-3 px-2 text-center w-14 hidden sm:table-cell">Sırala</th>
                    <th className="py-3 px-3 min-w-[160px]">Kurum</th>
                    <th className="py-3 px-3 min-w-[120px]">Uzmanlık</th>
                    <th className="py-3 px-2 text-center hidden sm:table-cell">Tür</th>
                    <th className="py-3 px-3 text-right">Taban Puan</th>
                    <th className="py-3 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {savedItems.map((item, index) => {
                    const p = item.placement;
                    const latest = p?.history[0];
                    const isExpanded = expandedIds.includes(item.placementId);
                    const previousPeriods = p?.history.slice(1).filter((h) => h.score !== null) || [];

                    return (
                      <React.Fragment key={item.placementId}>
                        <tr
                          onClick={() => toggleExpand(item.placementId)}
                          className="hover:bg-red-50/40 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-1 text-center">
                            <span className="w-5 h-5 rounded-md bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black flex items-center justify-center mx-auto">
                              {index + 1}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-center hidden sm:table-cell">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); moveItem(index, "up"); }}
                                disabled={index === 0}
                                className="w-6 h-6 rounded-md bg-app-surface text-app-muted flex items-center justify-center disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp size={12} weight="bold" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveItem(index, "down"); }}
                                disabled={index === savedItems.length - 1}
                                className="w-6 h-6 rounded-md bg-app-surface text-app-muted flex items-center justify-center disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown size={12} weight="bold" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                            <div className="line-clamp-2">{p?.institutionName ?? item.placementId}</div>
                            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                              {editingNoteId === item.placementId ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={tempNoteText}
                                    onChange={(e) => setTempNoteText(e.target.value)}
                                    placeholder="Not..."
                                    className="bg-app-surface text-[10px] px-2 py-0.5 rounded-md border border-app-border w-24 md:w-44"
                                  />
                                  <button
                                    onClick={() => saveNote(item.placementId)}
                                    className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[9px] font-bold cursor-pointer"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {item.note && (
                                    <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-md">
                                      📝 {item.note}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(item.placementId);
                                      setTempNoteText(item.note);
                                    }}
                                    className="text-[9px] text-gray-400 cursor-pointer"
                                  >
                                    <PencilSimple size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-gray-800 dark:text-zinc-200">
                            {p?.specialtyName ?? "—"}
                          </td>

                          <td className="py-3 px-2 text-center hidden sm:table-cell">
                            {p && (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${getTypeBadge(p.institutionType)}`}>
                                {p.institutionType}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right font-black text-red-600">
                            {latest?.score?.toFixed(2).replace(".", ",") ?? "—"}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); removeItem(item.placementId); }}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 cursor-pointer"
                            >
                              <Trash size={14} weight="bold" />
                            </button>
                          </td>
                        </tr>

                        {isExpanded &&
                          previousPeriods.map((h) => (
                            <tr key={`${item.placementId}-${h.period}`} className="bg-gray-50/50 dark:bg-zinc-800/30 text-gray-500 dark:text-zinc-400">
                              <td colSpan={2} className="hidden sm:table-cell"></td>
                              <td colSpan={3} className="py-2 px-3 text-[10px] italic text-gray-500 dark:text-zinc-300">
                                {h.period} dönemi
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-gray-800 dark:text-zinc-100">
                                {h.score?.toFixed(2).replace(".", ",") ?? "—"}
                              </td>
                              <td></td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TUSShell>
  );
}
