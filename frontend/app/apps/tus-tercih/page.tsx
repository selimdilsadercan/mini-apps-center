"use client";

import React, { useState, useEffect, useMemo } from "react";
import TUSShell from "./components/TUSShell";
import {
  MagnifyingGlass,
  BookmarkSimple,
  Check,
  Info,
  X,
  Sparkle,
  Stethoscope,
  CaretRight,
  CaretDown,
  Buildings,
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { tusApi } from "./lib/api";
import type { TUSPlacement, TUSSpecialty } from "./data/placements_data";
import {
  formatInstitutionTypeOption,
  getInstitutionTypeBadgeClass,
  INSTITUTION_TYPE_ORDER,
} from "./lib/institutionTypes";

export type { TUSPlacement, TUSSpecialty };

export default function TUSExplorePage() {
  const userId = "local_user";

  const [placements, setPlacements] = useState<TUSPlacement[]>([]);
  const [specialties, setSpecialties] = useState<TUSSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [displayLimit, setDisplayLimit] = useState(100);

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const stored = localStorage.getItem("tus_filters_v1");
      if (stored) return JSON.parse(stored).searchQuery || "";
    } catch {}
    return "";
  });

  const [specialtySlug, setSpecialtySlug] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    try {
      const stored = localStorage.getItem("tus_filters_v1");
      if (stored) return JSON.parse(stored).specialtySlug || "ALL";
    } catch {}
    return "ALL";
  });

  const [institutionType, setInstitutionType] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    try {
      const stored = localStorage.getItem("tus_filters_v1");
      if (stored) return JSON.parse(stored).institutionType || "ALL";
    } catch {}
    return "ALL";
  });

  const [candidateScoreStr, setCandidateScoreStr] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const stored = localStorage.getItem("tus_filters_v1");
      if (stored) return JSON.parse(stored).candidateScoreStr || "";
    } catch {}
    return "";
  });

  const [savedPlacementIds, setSavedPlacementIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    loadSavedChoices();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "tus_filters_v1",
        JSON.stringify({ searchQuery, specialtySlug, institutionType, candidateScoreStr })
      );
    } catch {}
  }, [searchQuery, specialtySlug, institutionType, candidateScoreStr]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { TUS_PLACEMENTS, TUS_SPECIALTIES } = await import("./data/placements_data");
      setPlacements(TUS_PLACEMENTS);
      setSpecialties(TUS_SPECIALTIES);
    } catch (err) {
      console.error("Failed to load TUS data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedChoices = async () => {
    try {
      const res = await tusApi.getSavedChoices(userId);
      if (res?.items) {
        const ids = res.items.map((i) => i.placementId);
        setSavedPlacementIds(ids);
        localStorage.setItem(`tus_saved_${userId}`, JSON.stringify(ids));
        return;
      }
    } catch {
      console.warn("DB unreachable, using localStorage");
    }
    try {
      const stored = localStorage.getItem(`tus_saved_${userId}`);
      if (stored) setSavedPlacementIds(JSON.parse(stored));
    } catch {}
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const availableInstitutionTypes = useMemo(() => {
    const fromData = new Set(placements.map((p) => p.institutionType));
    const ordered = INSTITUTION_TYPE_ORDER.filter((t) => fromData.has(t));
    const rest = [...fromData]
      .filter((t) => !INSTITUTION_TYPE_ORDER.includes(t as (typeof INSTITUTION_TYPE_ORDER)[number]))
      .sort();
    return [...ordered, ...rest];
  }, [placements]);

  const filteredPlacements = useMemo(() => {
    let list = placements.filter((p) => p.history.some((h) => h.score !== null));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.institutionName.toLowerCase().includes(q) ||
          p.specialtyName.toLowerCase().includes(q)
      );
    }

    if (specialtySlug !== "ALL") {
      list = list.filter((p) => p.specialtySlug === specialtySlug);
    }

    if (institutionType !== "ALL") {
      list = list.filter((p) => p.institutionType === institutionType);
    }

    const scoreNum = parseFloat(candidateScoreStr.replace(",", "."));
    if (!isNaN(scoreNum) && scoreNum > 0) {
      const minS = scoreNum * 0.85;
      const maxS = scoreNum * 1.15;
      list = list.filter((p) => {
        const latest = p.history[0]?.score;
        return latest !== null && latest >= minS && latest <= maxS;
      });
    }

    return list.sort((a, b) => {
      const sA = a.history[0]?.score ?? 0;
      const sB = b.history[0]?.score ?? 0;
      return sB - sA;
    });
  }, [placements, searchQuery, specialtySlug, institutionType, candidateScoreStr]);

  const toggleSaveChoice = async (placementId: string) => {
    const isSaved = savedPlacementIds.includes(placementId);
    let updated: string[];

    if (isSaved) {
      updated = savedPlacementIds.filter((id) => id !== placementId);
      toast.success("Tercih listenizden çıkarıldı.");
      try {
        await tusApi.removeSavedChoice(userId, placementId);
      } catch {}
    } else {
      updated = [...savedPlacementIds, placementId];
      toast.success("Tercih listenize eklendi!");
      try {
        await tusApi.addSavedChoice(userId, placementId);
      } catch {}
    }

    setSavedPlacementIds(updated);
    localStorage.setItem(`tus_saved_${userId}`, JSON.stringify(updated));
  };

  const getTypeBadge = (type: string) => getInstitutionTypeBadgeClass(type);

  return (
    <TUSShell activeTab="explore">
      <div className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 md:p-4 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-4">
              <div className="relative">
                <Sparkle size={14} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                <input
                  type="text"
                  placeholder="TUS Puanınız (Örn: 65,50)"
                  value={candidateScoreStr}
                  onChange={(e) => setCandidateScoreStr(e.target.value.replace(/[^\d,.]/g, ""))}
                  className="w-full bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 placeholder-gray-400 pl-9 pr-8 py-2.5 rounded-xl text-xs font-bold border border-gray-200/80 dark:border-zinc-700/60 focus:outline-none focus:border-red-500 transition-all"
                />
                {candidateScoreStr && (
                  <button
                    onClick={() => setCandidateScoreStr("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 cursor-pointer"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-8">
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kurum veya Uzmanlık Dalı Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 placeholder-gray-400 pl-9 pr-3 py-2.5 rounded-xl text-xs font-medium border border-gray-200/80 dark:border-zinc-700/60 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                Uzmanlık Dalı
              </label>
              <select
                value={specialtySlug}
                onChange={(e) => setSpecialtySlug(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200/80 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
              >
                <option value="ALL">Tüm Uzmanlık Dalları ({specialties.length})</option>
                {specialties.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name} ({s.institutionCount} kurum)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                Kurum Türü
              </label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200/80 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
              >
                <option value="ALL">Tüm Kurum Türleri</option>
                {availableInstitutionTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatInstitutionTypeOption(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            Toplam{" "}
            <strong className="text-gray-900 dark:text-white font-bold">
              {filteredPlacements.length.toLocaleString("tr-TR")}
            </strong>{" "}
            kurum listelendi
          </span>
          {candidateScoreStr && (
            <div className="flex items-center gap-1 text-red-600 font-bold text-[10px] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-100">
              <Sparkle size={10} weight="fill" />
              <span>Robot Aktif (±%15)</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">Veriler yükleniyor...</div>
        ) : filteredPlacements.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-gray-200/80 dark:border-zinc-800">
            <Stethoscope size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Uygun kurum bulunamadı</p>
            <p className="text-xs text-gray-400 mt-1">Filtreleri genişleterek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 font-bold border-b border-gray-200/80 dark:border-zinc-800">
                    <th className="py-3 px-2 text-center w-10"></th>
                    <th className="py-3 px-3 min-w-[180px]">Kurum</th>
                    <th className="py-3 px-3 min-w-[120px]">Uzmanlık</th>
                    <th className="py-3 px-2 text-center hidden sm:table-cell">Tür</th>
                    <th className="py-3 px-2 text-center hidden md:table-cell">Dönem</th>
                    <th className="py-3 px-2 text-right hidden sm:table-cell">Kontenjan</th>
                    <th className="py-3 px-3 text-right">Taban Puan</th>
                    <th className="py-3 px-2 text-right hidden lg:table-cell">Sıra</th>
                    <th className="py-3 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                  {filteredPlacements.slice(0, displayLimit).map((p) => {
                    const isSaved = savedPlacementIds.includes(p.id);
                    const isExpanded = expandedIds.includes(p.id);
                    const latest = p.history[0];
                    const previousPeriods = p.history.slice(1).filter((h) => h.score !== null);
                    const hasMore = previousPeriods.length > 0;

                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          onClick={() => hasMore && toggleExpand(p.id)}
                          className={`hover:bg-red-50/40 dark:hover:bg-zinc-800/40 transition-colors ${hasMore ? "cursor-pointer" : ""}`}
                        >
                          <td className="py-3 px-2 text-center">
                            {hasMore ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(p.id);
                                }}
                                className="w-6 h-6 rounded-md bg-app-surface text-app-muted flex items-center justify-center mx-auto cursor-pointer"
                              >
                                {isExpanded ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
                              </button>
                            ) : (
                              <span className="text-gray-300">•</span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                            <div className="line-clamp-2 leading-tight">{p.institutionName}</div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-gray-800 dark:text-zinc-200">
                            <div className="line-clamp-2">{p.specialtyName}</div>
                            <span className="text-[9px] text-gray-400">{p.educationYears} Yıl</span>
                          </td>

                          <td className="py-3 px-2 text-center hidden sm:table-cell">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${getTypeBadge(p.institutionType)}`}>
                              {p.institutionType}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-center font-bold text-gray-800 dark:text-zinc-200 hidden md:table-cell">
                            {latest?.period || "—"}
                          </td>

                          <td className="py-3 px-2 text-right font-medium text-gray-700 dark:text-zinc-300 hidden sm:table-cell">
                            {latest?.quota ?? "—"}
                          </td>

                          <td className="py-3 px-3 text-right font-black text-red-600 dark:text-red-400">
                            {latest?.score?.toFixed(2).replace(".", ",") ?? "—"}
                          </td>

                          <td className="py-3 px-2 text-right font-bold text-gray-700 dark:text-zinc-300 hidden lg:table-cell">
                            {latest?.rank ? latest.rank.toLocaleString("tr-TR") : "—"}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveChoice(p.id);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                isSaved
                                  ? "bg-red-600 text-white shadow-sm"
                                  : "bg-app-surface text-app-muted border border-app-border hover:text-red-600"
                              }`}
                            >
                              {isSaved ? <Check size={14} weight="bold" /> : <BookmarkSimple size={14} weight="bold" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded &&
                          previousPeriods.map((h) => (
                            <tr key={`${p.id}-${h.period}`} className="bg-gray-50/50 dark:bg-zinc-800/30 text-gray-500 dark:text-zinc-400">
                              <td className="py-2 px-2"></td>
                              <td colSpan={3} className="py-2 px-3 text-[10px] italic text-gray-500 dark:text-zinc-400">
                                <Buildings size={10} className="inline mr-1" />
                                Geçmiş Dönem
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-gray-700 dark:text-zinc-200 hidden md:table-cell">{h.period}</td>
                              <td className="py-2 px-2 text-right text-gray-600 dark:text-zinc-300 hidden sm:table-cell">{h.quota ?? "—"}</td>
                              <td className="py-2 px-3 text-right font-bold text-gray-800 dark:text-zinc-100">
                                {h.score?.toFixed(2).replace(".", ",") ?? "—"}
                              </td>
                              <td className="py-2 px-2 text-right text-gray-600 dark:text-zinc-300 hidden lg:table-cell">
                                {h.rank ? h.rank.toLocaleString("tr-TR") : "—"}
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

            {filteredPlacements.length > displayLimit && (
              <div className="p-4 text-center border-t border-gray-100 dark:border-zinc-800">
                <button
                  onClick={() => setDisplayLimit((l) => l + 100)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Daha Fazla Göster ({displayLimit} / {filteredPlacements.length})
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200/50 dark:border-zinc-700/50">
          <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed">
            Veriler{" "}
            <a href="https://tuskocu.com/tus-taban-puanlari-ve-siralamalari/" target="_blank" rel="noopener noreferrer" className="text-red-600 underline">
              TUS Koçu
            </a>{" "}
            üzerinden alınmıştır. TUS puan robotu ±%15 aralığında kurumları filtreler.
          </p>
        </div>
      </div>
    </TUSShell>
  );
}
