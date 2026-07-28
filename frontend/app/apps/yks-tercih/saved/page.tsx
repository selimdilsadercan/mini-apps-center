"use client";

import React, { useState, useEffect } from "react";
import YKSShell from "../components/YKSShell";
import {
  Trash,
  ArrowUp,
  ArrowDown,
  Buildings,
  MapPin,
  PencilSimple,
  ShareNetwork,
  Plus,
  BookOpen,
  Check,
  GraduationCap,
  CaretRight,
  CaretDown,
} from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { YKSProgram } from "../page";
import Client, { Local } from "@/lib/client";

const client = new Client(Local);

interface SavedItemWithProgram {
  programId: string;
  note: string;
  program?: YKSProgram;
}

export default function YKSSavedPage() {
  const userId = "local_user";

  const [savedItems, setSavedItems] = useState<SavedItemWithProgram[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (programId: string) => {
    setExpandedIds((prev) =>
      prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
    );
  };

  useEffect(() => {
    loadSavedChoices();
  }, []);

  const loadSavedChoices = async () => {
    try {
      setLoading(true);
      const { YKS_PROGRAMS } = await import("../data/programs_data");

      // 1. Try DB first
      try {
        const res = await client.yks_tercih.getSavedChoices({ userId });
        if (res && res.items && res.items.length > 0) {
          const items: SavedItemWithProgram[] = res.items.map((row) => {
            const prog = YKS_PROGRAMS.find((p) => p.id === row.programId);
            return {
              programId: row.programId,
              note: row.note || "",
              program: prog,
            };
          });
          setSavedItems(items);
          localStorage.setItem(`yks_saved_${userId}`, JSON.stringify(items.map((i) => i.programId)));
          return;
        }
      } catch (e) {
        console.warn("DB unreachable, falling back to local storage", e);
      }

      // 2. Fallback to Local Storage
      const stored = localStorage.getItem(`yks_saved_${userId}`);
      const storedNotes = localStorage.getItem(`yks_notes_${userId}`);
      const notesMap: Record<string, string> = storedNotes ? JSON.parse(storedNotes) : {};
      const savedIds: string[] = stored ? JSON.parse(stored) : [];

      const items: SavedItemWithProgram[] = savedIds.map((id) => {
        const prog = YKS_PROGRAMS.find((p) => p.id === id);
        return {
          programId: id,
          note: notesMap[id] || "",
          program: prog,
        };
      });

      setSavedItems(items);
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

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setSavedItems(newItems);
    saveOrderToStorage(newItems);

    try {
      await client.yks_tercih.reorderSavedChoices({
        userId,
        programIds: newItems.map((i) => i.programId),
      });
    } catch (e) {
      console.warn("Failed to sync reorder to DB", e);
    }
  };

  const removeItem = async (programId: string) => {
    const updated = savedItems.filter((i) => i.programId !== programId);
    setSavedItems(updated);
    saveOrderToStorage(updated);
    toast.success("Tercih çıkarıldı.");

    try {
      await client.yks_tercih.removeSavedChoice({ userId, programId });
    } catch (e) {
      console.warn("Failed to sync remove to DB", e);
    }
  };

  const saveOrderToStorage = (items: SavedItemWithProgram[]) => {
    const ids = items.map((i) => i.programId);
    localStorage.setItem(`yks_saved_${userId}`, JSON.stringify(ids));
  };

  const saveNote = async (programId: string) => {
    const updated = savedItems.map((item) =>
      item.programId === programId ? { ...item, note: tempNoteText } : item
    );
    setSavedItems(updated);

    try {
      const storedNotes = localStorage.getItem(`yks_notes_${userId}`);
      const notesMap: Record<string, string> = storedNotes ? JSON.parse(storedNotes) : {};
      notesMap[programId] = tempNoteText;
      localStorage.setItem(`yks_notes_${userId}`, JSON.stringify(notesMap));

      // Sync to DB
      await client.yks_tercih.addSavedChoice({ userId, programId, note: tempNoteText });
    } catch (e) {
      console.error(e);
    }

    setEditingNoteId(null);
    toast.success("Not kaydedildi.");
  };

  const copyListSummary = () => {
    if (savedItems.length === 0) return;
    const text = savedItems
      .map((item, idx) => {
        const p = item.program;
        if (!p) return `${idx + 1}. ${item.programId}`;
        const latest = p.history[0];
        return `${idx + 1}. ${p.universityName} - ${p.departmentName} (${p.scoreType}) [Sıra: ${latest?.rank ? latest.rank.toLocaleString("tr-TR") : "—"}]`;
      })
      .join("\n");

    navigator.clipboard.writeText(`YKS Tercih Listem:\n\n${text}`);
    toast.success("Tercih listeniz panoya kopyalandı!");
  };

  const getScoreTypeBadge = (type?: string) => {
    switch (type) {
      case "SAY":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50";
      case "EA":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50";
      case "SÖZ":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50";
      case "DİL":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50";
      default:
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50";
    }
  };

  return (
    <YKSShell activeTab="saved">
      <div className="space-y-4">
        {/* Header Summary Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Tercih Listeniz ({savedItems.length} / 24)
            </h2>
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight max-w-[200px] md:max-w-none">
              <span className="hidden md:inline">Sıralamayı yukarı/aşağı oklarla ayarlayabilirsiniz. Verileriniz veritabanına eşzamanlı kaydedilir.</span>
              <span className="md:hidden">Sıralamayı güncelleyebilir ve paylaşabilirsiniz.</span>
            </p>
          </div>
          {savedItems.length > 0 && (
            <button
              onClick={copyListSummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-black dark:hover:bg-white transition-all shadow-xs shrink-0"
            >
              <ShareNetwork size={14} weight="bold" />
              <span>Listeyi Paylaş</span>
            </button>
          )}
        </div>

        {/* Saved List Content */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 dark:text-zinc-500 text-xs">
            Tercih listeniz yükleniyor...
          </div>
        ) : savedItems.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-gray-200/80 dark:border-zinc-800">
            <BookOpen size={40} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Henüz tercih eklemediniz</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 mb-4">
              Arama ve robot sekmesinden istediğiniz bölümleri listenize ekleyebilirsiniz.
            </p>
            <Link
              href="/apps/yks-tercih"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} weight="bold" /> Program Taramaya Başla
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs table-fixed md:table-auto">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 font-bold border-b border-gray-200/80 dark:border-zinc-800 align-middle">
                    <th className="py-3 px-2 text-center w-8 align-middle">#</th>
                    <th className="py-3 px-1 text-center w-8 sm:hidden align-middle"></th>
                    <th className="py-3 px-2 text-center w-14 hidden sm:table-cell align-middle">Sırala</th>
                    <th className="py-3 px-3 w-[45%] md:w-auto md:min-w-[140px] align-middle">Üniversiteler</th>
                    <th className="py-3 px-3 w-[40%] md:w-auto md:min-w-[180px] align-middle">Bölümler</th>
                    <th className="py-3 px-2 text-center hidden md:table-cell align-middle">Yıllar</th>
                    <th className="py-3 px-2 text-center hidden lg:table-cell align-middle">Puan Türü</th>
                    <th className="py-3 px-2 text-right hidden xl:table-cell align-middle">Kontenjan</th>
                    <th className="py-3 px-3 text-right hidden sm:table-cell align-middle">Taban Puan</th>
                    <th className="py-3 px-3 text-right w-16 md:w-auto align-middle">Sıralama</th>
                    <th className="py-3 px-2 text-center w-10 align-middle"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 align-middle">
                  {savedItems.map((item, index) => {
                    const prog = item.program;
                    const latest = prog?.history.find((h) => h.rank !== null || h.score !== null) || prog?.history[0];
                    const isExpanded = expandedIds.includes(item.programId);
                    const previousYears = prog?.history.filter((h) => h.year !== latest?.year) || [];

                    return (
                      <React.Fragment key={item.programId}>
                        <tr
                          onClick={() => toggleExpand(item.programId)}
                          className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/40 transition-colors align-middle cursor-pointer"
                        >
                          {/* Tercih Sırası Badge */}
                          <td className="py-3 px-1 text-center align-middle">
                            <span className="w-5 h-5 rounded-md bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black flex items-center justify-center mx-auto">
                              {index + 1}
                            </span>
                          </td>

                          {/* Genişletme Butonu - Mobil için */}
                          <td className="py-3 px-0.5 text-center align-middle sm:hidden">
                            <div className="w-6 h-6 rounded-md bg-app-surface text-app-muted flex items-center justify-center mx-auto">
                              {isExpanded ? <CaretDown size={11} weight="bold" /> : <CaretRight size={11} weight="bold" />}
                            </div>
                          </td>

                          {/* Yukarı / Aşağı Sıralama Butonları - Masaüstü */}
                          <td className="py-3 px-2 text-center align-middle hidden sm:table-cell">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); moveItem(index, "up"); }}
                                disabled={index === 0}
                                className="w-6 h-6 rounded-md bg-app-surface text-app-muted flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Yukarı Taşı"
                              >
                                <ArrowUp size={12} weight="bold" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveItem(index, "down"); }}
                                disabled={index === savedItems.length - 1}
                                className="w-6 h-6 rounded-md bg-app-surface text-app-muted flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Aşağı Taşı"
                              >
                                <ArrowDown size={12} weight="bold" />
                              </button>
                            </div>
                          </td>

                          {/* Üniversite */}
                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white align-middle">
                            <div className="line-clamp-3 leading-tight">{prog ? prog.universityName : item.programId}</div>
                            {prog && (
                              <div className="text-[9px] md:text-[10px] font-medium text-gray-400 dark:text-zinc-500 mt-0.5 line-clamp-2 leading-tight">
                                {prog.city} • {prog.universityType}
                              </div>
                            )}
                          </td>

                          {/* Bölüm & Inline Not Alanı */}
                          <td className="py-3 px-3 font-semibold text-gray-800 dark:text-zinc-200 align-middle">
                            <div className="line-clamp-3 leading-tight">
                              {prog ? prog.departmentName : item.programId}
                              {prog?.language && (
                                <span className="text-[10px] md:text-[11px] font-normal text-gray-500 dark:text-zinc-400">
                                  {" "}({prog.language})
                                </span>
                              )}
                            </div>
                            {prog && (
                              <span className="text-[9px] md:text-[10px] font-normal text-gray-400 block mt-0.5 line-clamp-2 leading-tight">
                                ({prog.durationYears}Y) ({prog.scholarshipType})
                              </span>
                            )}

                            {/* Not Alanı */}
                            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                              {editingNoteId === item.programId ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={tempNoteText}
                                    onChange={(e) => setTempNoteText(e.target.value)}
                                    placeholder="Not..."
                                    className="bg-app-surface text-[10px] px-2 py-0.5 rounded-md border border-app-border focus:outline-none w-24 md:w-44"
                                  />
                                  <button
                                    onClick={() => saveNote(item.programId)}
                                    className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[9px] font-bold cursor-pointer"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {item.note ? (
                                    <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-medium border border-amber-200/60 dark:border-amber-800/40 truncate max-w-[80px] md:max-w-none">
                                      📝 {item.note}
                                    </span>
                                  ) : null}
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(item.programId);
                                      setTempNoteText(item.note);
                                    }}
                                    className="text-[9px] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <PencilSimple size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Yıl - Masaüstü */}
                          <td className="py-3 px-2 text-center font-bold text-gray-800 dark:text-zinc-200 align-middle hidden md:table-cell">
                            {latest?.year || "—"}
                          </td>

                          {/* Puan Türü - Masaüstü */}
                          <td className="py-3 px-2 text-center align-middle hidden lg:table-cell">
                            {prog && (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${getScoreTypeBadge(
                                  prog.scoreType
                                )}`}
                              >
                                {prog.scoreType}
                              </span>
                            )}
                          </td>

                          {/* Kontenjan - Masaüstü */}
                          <td className="py-3 px-2 text-right font-medium text-gray-700 dark:text-zinc-300 align-middle hidden xl:table-cell">
                            {latest?.quota || "—"}
                          </td>

                          {/* Taban Puan - Masaüstü */}
                          <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-zinc-100 align-middle hidden sm:table-cell">
                            {latest?.score ? latest.score.toFixed(2).replace(".", ",") : "—"}
                          </td>

                          {/* Başarı Sırası */}
                          <td className="py-3 px-3 text-right font-black text-blue-600 dark:text-blue-400 align-middle">
                            {latest?.rank ? latest.rank.toLocaleString("tr-TR") : "—"}
                          </td>

                          {/* Listeden Çıkar Butonu */}
                          <td className="py-3 px-2 text-center align-middle">
                            <button
                              onClick={(e) => { e.stopPropagation(); removeItem(item.programId); }}
                              className="w-7 h-7 mx-auto rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 border border-red-200/60 dark:border-red-800/40 cursor-pointer"
                              title="Listeden Çıkar"
                            >
                              <Trash size={14} weight="bold" />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <tr className="bg-gray-50/50 dark:bg-zinc-800/20 border-t border-gray-100 dark:border-zinc-800/40">
                            <td colSpan={10} className="py-4 px-4">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 block">Puan Türü</span>
                                  {prog && (
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${getScoreTypeBadge(prog.scoreType)}`}>
                                      {prog.scoreType}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 block">Kontenjan</span>
                                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">{latest?.quota || "—"}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 block">Taban Puan</span>
                                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                                    {latest?.score ? latest.score.toFixed(2).replace(".", ",") : "—"}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 block">Şehir / Tür</span>
                                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">{prog?.city} • {prog?.universityType}</span>
                                </div>
                              </div>

                              {previousYears.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">Geçmiş Yıl Verileri</h4>
                                  <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50">
                                    <table className="w-full text-left text-[11px]">
                                      <thead>
                                        <tr className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400 font-bold border-b border-gray-100 dark:border-zinc-800">
                                          <th className="p-2">Yıl</th>
                                          <th className="p-2 text-right">Sıralama</th>
                                          <th className="p-2 text-right">Puan</th>
                                          <th className="p-2 text-right">Kont.</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/40">
                                        {previousYears.map((prev) => (
                                          <tr key={prev.year} className="text-gray-600 dark:text-zinc-300">
                                            <td className="p-2 font-bold">{prev.year}</td>
                                            <td className="p-2 text-right font-black text-blue-600 dark:text-blue-400">
                                              {prev.rank ? prev.rank.toLocaleString("tr-TR") : "—"}
                                            </td>
                                            <td className="p-2 text-right">
                                              {prev.score ? prev.score.toFixed(2).replace(".", ",") : "—"}
                                            </td>
                                            <td className="p-2 text-right">{prev.quota}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </YKSShell>
  );
}
