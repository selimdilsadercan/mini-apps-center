"use client";

import React, { useState, useEffect, useMemo } from "react";
import YKSShell from "./components/YKSShell";
import {
  MagnifyingGlass,
  BookmarkSimple,
  Check,
  Buildings,
  MapPin,
  Info,
  X,
  Plus,
  Sparkle,
  GraduationCap,
  CaretRight,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import Client, { Local } from "@/lib/client";

const client = new Client(Local);

// YKS Types
export interface ProgramHistory {
  year: number;
  rank: number | null;
  score: number | null;
  quota: number;
}

export interface YKSProgram {
  id: string;
  code: string;
  universityName: string;
  facultyName: string;
  departmentName: string;
  language?: string;
  scoreType: "SAY" | "EA" | "SÖZ" | "DİL" | "TYT";
  city: string;
  universityType: "Devlet" | "Vakıf" | "KKTC" | "Yurtdışı";
  scholarshipType: "Ücretsiz" | "Burslu" | "%75 İndirimli" | "%50 İndirimli" | "%25 İndirimli" | "Ücretli";
  durationYears: 2 | 4;
  history: ProgramHistory[];
}

export default function YKSExplorePage() {
  const userId = "local_user";

  const [programs, setPrograms] = useState<YKSProgram[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(100);

  // Filters (Initialized lazily from localStorage to prevent initial render overwrite)
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const stored = localStorage.getItem("yks_filters_v1");
      if (stored) return JSON.parse(stored).searchQuery || "";
    } catch (e) {}
    return "";
  });

  const [scoreType, setScoreType] = useState<string>(() => {
    if (typeof window === "undefined") return "ALL";
    try {
      const stored = localStorage.getItem("yks_filters_v1");
      if (stored) return JSON.parse(stored).scoreType || "ALL";
    } catch (e) {}
    return "ALL";
  });

  const [universityType, setUniversityType] = useState<string>(() => {
    if (typeof window === "undefined") return "ALL";
    try {
      const stored = localStorage.getItem("yks_filters_v1");
      if (stored) return JSON.parse(stored).universityType || "ALL";
    } catch (e) {}
    return "ALL";
  });

  const [selectedCities, setSelectedCities] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("yks_filters_v1");
      if (stored && Array.isArray(JSON.parse(stored).selectedCities)) {
        return JSON.parse(stored).selectedCities;
      }
    } catch (e) {}
    return [];
  });

  const [isCitiesExpanded, setIsCitiesExpanded] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>("");

  const [candidateRankStr, setCandidateRankStr] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const stored = localStorage.getItem("yks_filters_v1");
      if (stored) return JSON.parse(stored).candidateRankStr || "";
    } catch (e) {}
    return "";
  });

  const [savedProgramIds, setSavedProgramIds] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<YKSProgram | null>(null);

  useEffect(() => {
    fetchPrograms();
    loadSavedChoices();
  }, []);

  useEffect(() => {
    try {
      const filterState = {
        searchQuery,
        scoreType,
        universityType,
        selectedCities,
        candidateRankStr,
      };
      localStorage.setItem("yks_filters_v1", JSON.stringify(filterState));
    } catch (e) {
      console.error("Failed to save filters", e);
    }
  }, [searchQuery, scoreType, universityType, selectedCities, candidateRankStr]);

  const loadSavedChoices = async () => {
    try {
      // Try database API first
      const res = await client.yks_tercih.getSavedChoices({ userId });
      if (res && res.items) {
        const ids = res.items.map((i) => i.programId);
        setSavedProgramIds(ids);
        localStorage.setItem(`yks_saved_${userId}`, JSON.stringify(ids));
        return;
      }
    } catch (e) {
      console.warn("Database offline or unreachable, falling back to local storage", e);
    }

    try {
      const stored = localStorage.getItem(`yks_saved_${userId}`);
      if (stored) {
        setSavedProgramIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Local storage error", e);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { YKS_PROGRAMS } = await import("./data/programs_data");
      setPrograms(YKS_PROGRAMS || []);
    } catch (err) {
      console.error("Failed to load programs catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (programId: string) => {
    setExpandedIds((prev) =>
      prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
    );
  };

  // Compute dynamic program counts per city based on active filters
  const cityStats = useMemo(() => {
    let baseList = programs.filter((p) => p.history.some((h) => h.rank !== null && h.rank > 0));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      baseList = baseList.filter(
        (p) =>
          p.universityName.toLowerCase().includes(q) ||
          p.departmentName.toLowerCase().includes(q) ||
          p.facultyName.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.code.includes(q)
      );
    }

    if (scoreType !== "ALL") {
      baseList = baseList.filter((p) => p.scoreType === scoreType);
    }

    if (universityType !== "ALL") {
      baseList = baseList.filter((p) => p.universityType === universityType);
    }

    const rankNum = parseInt(candidateRankStr.replace(/\D/g, ""), 10);
    if (!isNaN(rankNum) && rankNum > 0) {
      const minR = Math.max(1, Math.floor(rankNum * 0.90));
      const maxR = Math.ceil(rankNum * 1.40);
      baseList = baseList.filter((p) =>
        p.history.some(
          (h) => h.year >= 2023 && h.rank !== null && h.rank > 0 && h.rank >= minR && h.rank <= maxR
        )
      );
    }

    const map = new Map<string, number>();
    baseList.forEach((p) => {
      const c = p.city.toUpperCase();
      map.set(c, (map.get(c) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [programs, searchQuery, scoreType, universityType, candidateRankStr]);

  // Main Filter Computation
  const filteredPrograms = useMemo(() => {
    // Only include programs that have at least one valid YKS cutoff rank
    let list = programs.filter((p) => p.history.some((h) => h.rank !== null && h.rank > 0));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.universityName.toLowerCase().includes(q) ||
          p.departmentName.toLowerCase().includes(q) ||
          p.facultyName.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.code.includes(q)
      );
    }

    if (scoreType !== "ALL") {
      list = list.filter((p) => p.scoreType === scoreType);
    }

    if (universityType !== "ALL") {
      list = list.filter((p) => p.universityType === universityType);
    }

    if (selectedCities.length > 0) {
      list = list.filter((p) => selectedCities.includes(p.city.toUpperCase()));
    }

    const rankNum = parseInt(candidateRankStr.replace(/\D/g, ""), 10);
    if (!isNaN(rankNum) && rankNum > 0) {
      const minR = Math.max(1, Math.floor(rankNum * 0.90));
      const maxR = Math.ceil(rankNum * 1.40);
      list = list.filter((p) =>
        p.history.some(
          (h) => h.year >= 2023 && h.rank !== null && h.rank > 0 && h.rank >= minR && h.rank <= maxR
        )
      );
    }

    return list.sort((a, b) => {
      const hA = a.history.find((h) => h.rank !== null && h.rank > 0);
      const hB = b.history.find((h) => h.rank !== null && h.rank > 0);
      const rA = hA?.rank ?? 9999999;
      const rB = hB?.rank ?? 9999999;
      return rA - rB;
    });
  }, [programs, searchQuery, scoreType, universityType, selectedCities, candidateRankStr]);

  const toggleCity = (cityName: string) => {
    const c = cityName.toUpperCase();
    if (selectedCities.includes(c)) {
      setSelectedCities(selectedCities.filter((x) => x !== c));
    } else {
      setSelectedCities([...selectedCities, c]);
    }
  };

  const selectAllCities = () => {
    setSelectedCities(cityStats.map((cs) => cs.name));
  };

  const clearCities = () => {
    setSelectedCities([]);
  };

  const toggleSaveChoice = async (programId: string) => {
    let updated: string[];
    const isCurrentlySaved = savedProgramIds.includes(programId);

    if (isCurrentlySaved) {
      updated = savedProgramIds.filter((id) => id !== programId);
      toast.success("Tercih listenizden çıkarıldı.");
      try {
        await client.yks_tercih.removeSavedChoice({ userId, programId });
      } catch (e) {
        console.warn("Failed to sync remove to DB:", e);
      }
    } else {
      updated = [...savedProgramIds, programId];
      toast.success("Tercih listenize eklendi!");
      try {
        await client.yks_tercih.addSavedChoice({ userId, programId });
      } catch (e) {
        console.warn("Failed to sync add to DB:", e);
      }
    }

    setSavedProgramIds(updated);
    try {
      localStorage.setItem(`yks_saved_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const getScoreTypeBadge = (type: string) => {
    switch (type) {
      case "SAY":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "EA":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "SÖZ":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "DİL":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default:
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
  };

  // Filter cityStats for search inside expanded city selector
  const visibleCityStats = useMemo(() => {
    if (!citySearchQuery.trim()) return cityStats;
    const q = citySearchQuery.toLowerCase().trim();
    return cityStats.filter((c) => c.name.toLowerCase().includes(q));
  }, [cityStats, citySearchQuery]);

  const displayedCityStats = isCitiesExpanded
    ? visibleCityStats
    : cityStats.slice(0, 12);

  return (
    <YKSShell activeTab="explore">
      <div className="space-y-4">
        {/* Unified Search & Robot Filter Box */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          {/* Top Row: Rank Robot & Text Search in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Rank Robot Input */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider flex items-center gap-1 mb-1.5">
                <Sparkle size={12} weight="fill" className="text-amber-400" />
                Başarı Sıralamanız (Robot)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Örn: 100.000 (Sıralamanız)"
                  value={candidateRankStr}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (!digits) {
                      setCandidateRankStr("");
                    } else {
                      setCandidateRankStr(parseInt(digits, 10).toLocaleString("tr-TR"));
                    }
                  }}
                  className="w-full bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3.5 py-2 rounded-xl text-xs font-medium border border-gray-200/80 dark:border-zinc-700/60 focus:outline-none focus:border-blue-500"
                />
                {candidateRankStr && (
                  <button
                    onClick={() => setCandidateRankStr("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[11px] font-bold"
                  >
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Box */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider block mb-1.5">
                Kelime İle Arama
              </label>
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Bölüm, Üniversite veya Şehir Ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-gray-200/80 dark:border-zinc-700/60 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Score Types & University Type in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
            {/* Score Types Filter Pills */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider block mb-1.5">
                Puan Türü
              </label>
              <div className="flex flex-wrap gap-1">
                {["ALL", "SAY", "EA", "SÖZ", "DİL", "TYT"].map((st) => {
                  const active = scoreType === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setScoreType(st)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all border ${active
                          ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-gray-900 dark:border-zinc-100 shadow-xs"
                          : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200/80 dark:border-zinc-700 hover:bg-gray-100"
                        }`}
                    >
                      {st === "ALL" ? "Tümü" : st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tür Select */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider block mb-1.5">
                Üniversite Türü
              </label>
              <select
                value={universityType}
                onChange={(e) => setUniversityType(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200/80 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="ALL">Tüm Üniversiteler (Devlet & Vakıf)</option>
                <option value="Devlet">Devlet Üniversiteleri</option>
                <option value="Vakıf">Vakıf (Özel) Üniversiteler</option>
              </select>
            </div>
          </div>

          {/* DEDICATED FULL ROW CITY MULTI-SELECT FILTER (DESIGN SYSTEM COHESIVE) */}
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[10px] font-black uppercase text-gray-700 dark:text-zinc-300 tracking-wider flex items-center gap-1.5">
                <MapPin size={14} weight="fill" className="text-gray-500 dark:text-zinc-400" />
                Şehir Filtresi (Çoklu Seçim)
                {selectedCities.length > 0 ? (
                  <span className="ml-1 px-2 py-0.5 rounded-lg bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold">
                    {selectedCities.length} Şehir Seçili
                  </span>
                ) : (
                  <span className="ml-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-[10px] font-medium border border-gray-200/80 dark:border-zinc-700/80">
                    Tüm Şehirler ({cityStats.length})
                  </span>
                )}
              </label>

              {/* City Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearCities}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${selectedCities.length === 0
                      ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-gray-900 dark:border-zinc-100 shadow-xs"
                      : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-100"
                    }`}
                >
                  Tüm Şehirler
                </button>

                <button
                  onClick={selectAllCities}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-750 transition-all"
                >
                  Tümünü Seç
                </button>

                <button
                  onClick={() => setIsCitiesExpanded(!isCitiesExpanded)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-gray-900 dark:border-zinc-100 hover:bg-black dark:hover:bg-white transition-all shadow-xs"
                >
                  {isCitiesExpanded ? (
                    <>
                      <span>Daralt</span>
                      <CaretUp size={12} weight="bold" />
                    </>
                  ) : (
                    <>
                      <span>Tüm 81 Şehir ({cityStats.length})</span>
                      <CaretDown size={12} weight="bold" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick search input inside expanded city panel */}
            {isCitiesExpanded && (
              <div className="relative max-w-xs">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Şehir Ara... (Örn: Bursa)"
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 pl-8 pr-3 py-1.5 rounded-xl text-xs border border-gray-200/80 dark:border-zinc-700 focus:outline-none"
                />
              </div>
            )}

            {/* City Tag Pills Grid */}
            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
              {displayedCityStats.map((cs) => {
                const isSelected = selectedCities.includes(cs.name);
                return (
                  <button
                    key={cs.name}
                    onClick={() => toggleCity(cs.name)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs transition-all border ${isSelected
                        ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-gray-900 dark:border-zinc-100 font-bold shadow-xs"
                        : "bg-gray-50 dark:bg-zinc-800/90 text-gray-700 dark:text-zinc-300 border-gray-200/80 dark:border-zinc-700/80 hover:bg-gray-100 dark:hover:bg-zinc-750 font-medium"
                      }`}
                  >
                    <span>{cs.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${isSelected
                          ? "bg-white/20 dark:bg-black/20 text-white dark:text-zinc-900"
                          : "bg-gray-200/80 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400"
                        }`}
                    >
                      {cs.count.toLocaleString("tr-TR")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Count Summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 px-1">
          <span>
            Toplam <strong className="text-gray-900 dark:text-white font-bold">{filteredPrograms.length.toLocaleString("tr-TR")}</strong> program listelendi
          </span>
          {candidateRankStr && (
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
              Sıralama robotu filtresi aktif
            </span>
          )}
        </div>

        {/* Expandable Program Table View */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 dark:text-zinc-500 text-xs">
            Programlar yükleniyor...
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center border border-gray-200/80 dark:border-zinc-800">
            <GraduationCap size={40} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">Uygun program bulunamadı</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
              Filtreleri genişleterek veya farklı bir şehir/kelime seçerek tekrar deneyin.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 font-bold border-b border-gray-200/80 dark:border-zinc-800 align-middle">
                    <th className="py-3 px-2 text-center w-9 align-middle"></th>
                    <th className="py-3 px-3 min-w-[140px] align-middle">Üniversiteler</th>
                    <th className="py-3 px-3 min-w-[180px] align-middle">Bölümler</th>
                    <th className="py-3 px-2 text-center align-middle">Yıllar</th>
                    <th className="py-3 px-2 text-center align-middle">Puan Türü</th>
                    <th className="py-3 px-2 text-right align-middle">Kontenjan</th>
                    <th className="py-3 px-3 text-right align-middle">Taban Puan</th>
                    <th className="py-3 px-3 text-right align-middle">Başarı Sırası</th>
                    <th className="py-3 px-2 text-center align-middle">Ekle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 align-middle">
                  {filteredPrograms.slice(0, displayLimit).map((prog) => {
                    const isSaved = savedProgramIds.includes(prog.id);
                    const isExpanded = expandedIds.includes(prog.id);
                    const latest = prog.history.find((h) => h.rank !== null || h.score !== null) || prog.history[0];
                    const previousYears = prog.history.filter((h) => h.year !== latest?.year);
                    const hasMoreYears = previousYears.length > 0;

                    return (
                      <React.Fragment key={prog.id}>
                        {/* Primary Row (En Son Yıl) */}
                        <tr 
                          onClick={() => {
                            if (hasMoreYears) toggleExpand(prog.id);
                          }}
                          className={`hover:bg-blue-50/40 dark:hover:bg-zinc-800/40 transition-colors align-middle ${hasMoreYears ? "cursor-pointer" : ""}`}
                        >
                          {/* Genişletme Butonu */}
                          <td className="py-3 px-2 text-center align-middle">
                            {hasMoreYears ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(prog.id);
                                }}
                                className="w-6 h-6 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-all mx-auto"
                                title={isExpanded ? "Geçmiş Yılları Gizle" : "Geçmiş Yılları Göster"}
                              >
                                {isExpanded ? (
                                  <CaretDown size={12} weight="bold" />
                                ) : (
                                  <CaretRight size={12} weight="bold" />
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300 dark:text-zinc-700">•</span>
                            )}
                          </td>

                          {/* Üniversite */}
                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white align-middle">
                            <div>{prog.universityName}</div>
                            <div className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 mt-0.5">
                              {prog.city} • {prog.universityType}
                            </div>
                          </td>

                          {/* Bölüm */}
                          <td className="py-3 px-3 font-semibold text-gray-800 dark:text-zinc-200 align-middle">
                            <div>
                              {prog.departmentName}
                              {prog.language && (
                                <span className="text-[11px] font-normal text-gray-500 dark:text-zinc-400">
                                  {" "}({prog.language})
                                </span>
                              )}
                              <span className="text-[10px] font-normal text-gray-400 block">
                                ({prog.durationYears} Yıllık) ({prog.scholarshipType})
                              </span>
                            </div>
                          </td>

                          {/* Yıl (En Son Yıl) */}
                          <td className="py-3 px-2 text-center font-bold text-gray-800 dark:text-zinc-200 align-middle">
                            {latest?.year || "—"}
                          </td>

                          {/* Puan Türü */}
                          <td className="py-3 px-2 text-center align-middle">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${getScoreTypeBadge(
                                prog.scoreType
                              )}`}
                            >
                              {prog.scoreType}
                            </span>
                          </td>

                          {/* Kontenjan */}
                          <td className="py-3 px-2 text-right font-medium text-gray-700 dark:text-zinc-300 align-middle">
                            {latest?.quota || "—"}
                          </td>

                          {/* Taban Puan */}
                          <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-zinc-100 align-middle">
                            {latest?.score ? latest.score.toFixed(5).replace(".", ",") : "—"}
                          </td>

                          {/* Başarı Sırası */}
                          <td className="py-3 px-3 text-right font-black text-blue-600 dark:text-blue-400 align-middle">
                            {latest?.rank ? latest.rank.toLocaleString("tr-TR") : "—"}
                          </td>

                          {/* Tercih Ekle / Çıkar */}
                          <td className="py-3 px-2 text-center align-middle">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveChoice(prog.id);
                              }}
                              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${isSaved
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200"
                                }`}
                              title={isSaved ? "Çıkar" : "Ekle"}
                            >
                              {isSaved ? <Check size={14} weight="bold" /> : <BookmarkSimple size={14} weight="bold" />}
                            </button>
                          </td>
                        </tr>

                        {/* Sub-rows for previous years when expanded */}
                        {isExpanded &&
                          previousYears.map((prevH) => (
                            <tr
                              key={`${prog.id}-${prevH.year}`}
                              className="bg-blue-50/20 dark:bg-zinc-800/30 text-gray-600 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800/40 text-[11px] align-middle"
                            >
                              <td className="align-middle"></td>
                              <td colSpan={2} className="py-2 px-3 italic text-gray-400 dark:text-zinc-500 text-[10px] align-middle">
                                └ Geçmiş Yıl Verisi ({prog.universityName})
                              </td>
                              <td className="py-2 px-2 text-center font-bold align-middle">{prevH.year}</td>
                              <td className="py-2 px-2 text-center font-semibold text-gray-500 align-middle">{prog.scoreType}</td>
                              <td className="py-2 px-2 text-right align-middle">{prevH.quota || "—"}</td>
                              <td className="py-2 px-3 text-right font-semibold align-middle">{prevH.score ? prevH.score.toFixed(5).replace(".", ",") : "—"}</td>
                              <td className="py-2 px-3 text-right font-bold text-blue-500 align-middle">{prevH.rank ? prevH.rank.toLocaleString("tr-TR") : "—"}</td>
                              <td className="align-middle"></td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPrograms.length > displayLimit && (
              <div className="p-3 text-center border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 100)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Daha Fazla Program Göster ({displayLimit} / {filteredPrograms.length.toLocaleString("tr-TR")})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Program Multi-Year History Modal */}
        {selectedProgram && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-5 border border-gray-200 dark:border-zinc-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {selectedProgram.universityName}
                  </span>
                  <h2 className="text-base font-black text-gray-900 dark:text-white">
                    {selectedProgram.departmentName}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {selectedProgram.facultyName} • {selectedProgram.city}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* History Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Son Yılların Değişim Tablosu
                </h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Yıl</th>
                        <th className="p-2.5">Başarı Sırası</th>
                        <th className="p-2.5">Taban Puan</th>
                        <th className="p-2.5">Kontenjan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-gray-800 dark:text-zinc-200 font-medium">
                      {selectedProgram.history.map((h) => (
                        <tr key={h.year} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                          <td className="p-2.5 font-bold">{h.year}</td>
                          <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                            {h.rank ? h.rank.toLocaleString("tr-TR") : "—"}
                          </td>
                          <td className="p-2.5">{h.score ? h.score.toFixed(5).replace(".", ",") : "—"}</td>
                          <td className="p-2.5">{h.quota}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    toggleSaveChoice(selectedProgram.id);
                    setSelectedProgram(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${savedProgramIds.includes(selectedProgram.id)
                      ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    }`}
                >
                  {savedProgramIds.includes(selectedProgram.id) ? (
                    <>
                      <X size={16} weight="bold" /> Tercihlerimden Çıkar
                    </>
                  ) : (
                    <>
                      <BookmarkSimple size={16} weight="bold" /> Tercih Listeme Ekle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </YKSShell>
  );
}
