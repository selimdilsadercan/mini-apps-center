"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  MagnifyingGlass, 
  FadersHorizontal, 
  CircleNotch,
  CaretDown,
  Funnel,
  TrendUp
} from "@phosphor-icons/react";
import SeriesCard from "../components/SeriesCard";
import { fetchSeries } from "../lib/api";
import { CATEGORY_LABELS, type Category, type Series } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";

type SortOption = "popular" | "rating" | "newest" | "name";

export default function KesfetPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 font-black text-red-500 uppercase tracking-[0.3em] animate-pulse">YÜKLENIYOR...</div>}>
      <KesfetContent />
    </Suspense>
  );
}

function KesfetContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialStatus = searchParams.get("status") || "";

  const [allSeriesData, setAllSeriesData] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSeries();
        setAllSeriesData(data || []);
      } catch (err) {
        console.error("Yükleme hatası:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...allSeriesData];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.creator.toLowerCase().includes(q) ||
          (s.tags?.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (selectedTags.length > 0) {
      result = result.filter((s) => 
        selectedTags.every((t: string) => (s.tags || []).includes(t))
      );
    }

    switch (sortBy) {
      case "popular":
        result.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
        break;
      case "rating":
        result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case "newest":
        result.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title, "tr"));
        break;
    }

    return result;
  }, [allSeriesData, query, selectedCategory, sortBy, statusFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-950 gap-6">
        <CircleNotch size={48} className="animate-spin text-red-600" />
        <span className="text-xs font-black tracking-[0.4em] uppercase text-slate-500">Katalog Yükleniyor</span>
      </div>
    );
  }

  const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
       {/* Background Glow */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full" />
       </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-20">
        
        <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
               <TrendUp size={24} weight="fill" className="text-red-500" />
               <span className="text-xs font-black tracking-[0.3em] uppercase text-slate-500">KÜTİPHANE</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter uppercase mb-4">Keşfet</h1>
            <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">
               Zengin YouTube kataloğumuzda yolculuğa çıkın. En iyi serileri ve içerik üreticileri sizin için derledik.
            </p>
        </header>

        {/* Filter Section */}
        <section className="mb-12 space-y-8">
           <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Bar */}
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <MagnifyingGlass size={20} weight="bold" className="text-slate-500 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Seri, üretici veya etiket ara..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-6 text-white placeholder-slate-600 outline-none focus:bg-white/[0.05] focus:border-red-500/30 transition-all font-bold text-lg"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative group lg:w-64">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                   <FadersHorizontal size={20} weight="bold" className="text-slate-500" />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-2xl pl-16 pr-10 text-white outline-none appearance-none focus:border-red-500/30 transition-all font-black text-xs uppercase tracking-widest cursor-pointer"
                >
                  <option value="popular">POPÜLERLİK</option>
                  <option value="rating">PUAN SIRALAMASI</option>
                  <option value="newest">EN YENİLER</option>
                  <option value="name">İSİM (A-Z)</option>
                </select>
                <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                    <CaretDown weight="bold" size={16} className="text-slate-500" />
                </div>
              </div>
           </div>

           {/* Category & Status Chips */}
           <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 pr-4 border-r border-white/10 mr-1">
                 <Funnel weight="fill" size={18} className="text-slate-500" />
                 <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">FİLTRELE:</span>
              </div>

              <button
                onClick={() => { setSelectedCategory(""); setStatusFilter(""); }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  !selectedCategory && !statusFilter
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/40 translate-y-[-2px]"
                    : "bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                }`}
              >
                HEPSİ
              </button>

              {categories.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedCategory(selectedCategory === key ? "" : key); setStatusFilter(""); }}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                    selectedCategory === key
                      ? "bg-red-600 text-white shadow-lg shadow-red-900/40 translate-y-[-2px]"
                      : "bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {label.toUpperCase()}
                </button>
              ))}

              <div className="h-8 w-px bg-white/10 mx-2" />

              <button
                onClick={() => { setStatusFilter(statusFilter === "devam-ediyor" ? "" : "devam-ediyor"); }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  statusFilter === "devam-ediyor"
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/40 translate-y-[-2px]"
                    : "bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                }`}
              >
                YAYINDA
              </button>

              <button
                onClick={() => { setStatusFilter(statusFilter === "tamamlandi" ? "" : "tamamlandi"); }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                  statusFilter === "tamamlandi"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-y-[-2px]"
                    : "bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                }`}
              >
                TAMAMLANDI
              </button>
           </div>
        </section>

        {/* Results Grid */}
        <section>
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-8">
                 <MagnifyingGlass size={48} className="text-slate-700 font-bold" />
              </div>
              <p className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Eşleşme Bulunamadı</p>
              <p className="text-slate-500 font-medium">Farklı bir arama terimi veya filtre kullanmayı dene.</p>
              <button 
                 onClick={() => { setQuery(""); setSelectedCategory(""); setStatusFilter(""); }}
                 className="mt-8 text-red-500 font-black text-xs uppercase tracking-widest hover:underline"
              >
                 FİLTRELERİ SIFIRLA
              </button>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 opacity-50">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase">{filtered.length} SONUÇ GÖSTERİLİYOR</span>
              </div>
              
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((s) => (
                    <motion.div
                      layout
                      key={s.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                    >
                      <SeriesCard series={s} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
