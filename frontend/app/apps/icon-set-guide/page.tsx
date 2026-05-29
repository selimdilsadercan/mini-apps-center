"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Heart, 
  MagnifyingGlass, 
  Funnel, 
  Check, 
  Copy, 
  ArrowSquareOut,
  Code,
  Sparkle,
  BookmarkSimple
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { icon_set_guide } from "@/lib/client";

const client = createBrowserClient();

// List of categories, filters
const STYLES = ["outline", "solid", "filled", "rounded", "duotone"];
const BEST_FOR = ["SaaS dashboard", "mobile app", "landing page", "admin panel", "AI tool", "finance app", "e-commerce"];
const FRAMEWORKS = ["React", "Vue", "Svelte", "Figma", "SVG", "npm"];
const LICENSES = ["MIT", "Apache", "CC0", "Free"];
const VIBES = ["minimal", "playful", "corporate", "premium", "developer-ish", "friendly"];

// Mini component preview items mapping to target SVGs
const PREVIEW_COMPONENTS = [
  { label: "Home", icon: "home" },
  { label: "Pages", icon: "arrow-right" },
  { label: "Active stream", icon: "heart" },
  { label: "People", icon: "user" },
  { label: "Site settings", icon: "settings" },
  { label: "Notifications", icon: "bell" },
  { label: "My profile & preferences", icon: "user" },
  { label: "Help center", icon: "calendar" }
];

const STANDARD_ICONS = [
  "home", "search", "user", "settings", "bell",
  "plus", "calendar", "trash", "arrow-right", "heart"
];

export default function IconSetGuidePage() {
  const { user } = useUser();
  const [iconSets, setIconSets] = useState<icon_set_guide.IconSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedBestFor, setSelectedBestFor] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Active preview pack ID (defaults to 'lucide')
  const [activePreviewPack, setActivePreviewPack] = useState("lucide");
  const [activePreviewType, setActivePreviewType] = useState<"sidebar" | "mobile" | "chatbot">("sidebar");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchIconSets();
  }, [user]);

  const fetchIconSets = async () => {
    try {
      setLoading(true);
      const userId = user?.id || "anonymous";
      const response = await client.icon_set_guide.getIconSets(userId);
      setIconSets(response.icon_sets);
    } catch (err: any) {
      console.error(err);
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (iconSetId: string) => {
    if (!user) {
      alert("Favorilere eklemek için lütfen giriş yapın.");
      return;
    }
    try {
      const response = await client.icon_set_guide.toggleFavorite({
        userId: user.id,
        iconSetId
      });
      setIconSets(prev => prev.map(item => {
        if (item.id === iconSetId) {
          return { ...item, is_favorited: response.is_favorited };
        }
        return item;
      }));
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleCopyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logic
  const filteredSets = iconSets.filter(set => {
    const matchesSearch = set.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          set.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStyle = !selectedStyle || set.styles.includes(selectedStyle);
    const matchesBestFor = !selectedBestFor || set.best_for.includes(selectedBestFor);
    const matchesFramework = !selectedFramework || set.frameworks.includes(selectedFramework);
    const matchesLicense = !selectedLicense || set.license === selectedLicense;
    const matchesVibe = !selectedVibe || set.vibes.includes(selectedVibe);
    const matchesFavorite = !showFavoritesOnly || set.is_favorited;

    return matchesSearch && matchesStyle && matchesBestFor && matchesFramework && matchesLicense && matchesVibe && matchesFavorite;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/discover"
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-sm">UI</span>
              <span className="font-bold text-slate-900 tracking-tight">Icon Set Guide</span>
            </div>
          </div>
          {user && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                showFavoritesOnly 
                  ? "bg-rose-50 text-rose-600 border border-rose-100" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
              }`}
            >
              <Heart weight={showFavoritesOnly ? "fill" : "regular"} size={14} className={showFavoritesOnly ? "text-rose-500" : ""} />
              {showFavoritesOnly ? "Favorites Only" : "Show Favorites"}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Intro */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100/50 rounded-full text-indigo-700 text-xs font-medium mb-4"
          >
            <Sparkle size={14} className="animate-pulse" />
            Dev & Designer Comparison Hub
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4"
          >
            Find the perfect icon set for your next project.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-600 font-normal leading-relaxed"
          >
            A curated guide to compare icon libraries by style, license, framework support, and real UI previews.
          </motion.p>
        </div>

        {/* Global UI Live Comparison Workspace */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/30 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
          
          <div className="relative z-10 space-y-8">
            {/* 3 Previews Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* Web Sidebar Preview */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">Web Sidebar Preview</span>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner w-full mx-auto max-w-xs">
                  <div className="flex items-center gap-3 px-3 py-2.5 mb-4 border-b border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      S
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Acme Dashboard</div>
                      <div className="text-[10px] text-slate-450">Enterprise workspace</div>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    {PREVIEW_COMPONENTS.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          idx === 0 
                            ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                            : "text-slate-650 hover:bg-slate-100/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={`/icons/${activePreviewPack}/${item.icon}.svg`}
                            alt=""
                            className={`w-4.5 h-4.5 ${idx === 0 ? "text-indigo-600" : "text-slate-500"}`}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span>{item.label}</span>
                        </div>
                        {idx === 2 && (
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Live
                          </span>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Mobile App Navigation Preview */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">Mobile Navigation</span>
                <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-3 shadow-inner max-w-[270px] mx-auto w-full relative">
                  <div className="bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden flex flex-col justify-between aspect-[9/16] w-full">
                    {/* Mock Status Bar */}
                    <div className="h-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-4 text-[9px] text-slate-400 font-bold">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <div className="w-3.5 h-2 bg-slate-300 rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* Mock Feed View */}
                    <div className="flex-1 p-3 bg-slate-50 flex flex-col justify-between">
                      <div className="bg-white border border-slate-100 rounded-2xl p-2.5 shadow-sm">
                        <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-tr from-emerald-100 to-indigo-100 flex items-center justify-center relative overflow-hidden">
                          <span className="text-[10px] font-bold text-slate-500/70">Image Viewport</span>
                        </div>
                        {/* Feed Action Bar (heart, user/comment, arrow-right/share, settings/more) */}
                        <div className="flex items-center justify-between mt-3.5 text-[10px] text-slate-500 font-bold px-1.5">
                          <div className="flex items-center gap-1 hover:text-indigo-650 transition-colors">
                            <img src={`/icons/${activePreviewPack}/heart.svg`} className="w-4.5 h-4.5" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            <span>13.6k</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <img src={`/icons/${activePreviewPack}/user.svg`} className="w-4.5 h-4.5" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            <span>32</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <img src={`/icons/${activePreviewPack}/arrow-right.svg`} className="w-4.5 h-4.5" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            <span>51</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <img src={`/icons/${activePreviewPack}/settings.svg`} className="w-4.5 h-4.5" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            <span>14</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Tab Navbar */}
                    <div className="h-14 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-2">
                      <img src={`/icons/${activePreviewPack}/home.svg`} className="w-5 h-5 text-indigo-600" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <img src={`/icons/${activePreviewPack}/search.svg`} className="w-5 h-5 text-slate-400" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 relative">
                        <img src={`/icons/${activePreviewPack}/plus.svg`} className="w-4.5 h-4.5" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                      </div>
                      <img src={`/icons/${activePreviewPack}/bell.svg`} className="w-5 h-5 text-slate-400" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <img src={`/icons/${activePreviewPack}/user.svg`} className="w-5 h-5 text-slate-400" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chatbot AI Menu Dropdown Preview */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">AI Chatbot UI</span>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner max-w-xs mx-auto lg:mx-0 w-full space-y-4">
                  {/* Search Input Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2.5">
                    <div className="text-xs text-slate-400 font-medium">Ask anything</div>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold truncate">
                        Examples of UI using {activePreviewPack}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Action List */}
                  <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-md space-y-0.5">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <img src={`/icons/${activePreviewPack}/plus.svg`} className="w-4.5 h-4.5 text-slate-500" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <span>Create an image</span>
                    </div>
                    
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50 transition-colors">
                      <img src={`/icons/${activePreviewPack}/search.svg`} className="w-4.5 h-4.5 text-indigo-650" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <span>Search the web</span>
                    </div>

                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <img src={`/icons/${activePreviewPack}/settings.svg`} className="w-4.5 h-4.5 text-slate-500" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <span>Write code</span>
                    </div>

                    <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <img src={`/icons/${activePreviewPack}/arrow-right.svg`} className="w-4.5 h-4.5 text-slate-500" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        <span>Run deep research</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold">5 left</span>
                    </div>

                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <img src={`/icons/${activePreviewPack}/heart.svg`} className="w-4.5 h-4.5 text-slate-500" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <span>Think longer</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Pack Selector Bar at the Bottom */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Pack Previewer</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-48 overflow-y-auto pr-1">
                {iconSets.map((set) => {
                  const isActive = activePreviewPack === set.id;
                  return (
                    <button
                      key={set.id}
                      onClick={() => setActivePreviewPack(set.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        isActive 
                          ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                        isActive 
                          ? "bg-white border-indigo-200 text-indigo-600 shadow-sm" 
                          : "bg-slate-50 border-slate-100 text-slate-500"
                      }`}>
                        <img 
                          src={`/icons/${set.id}/home.svg`} 
                          alt=""
                          className="w-4.5 h-4.5"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold tracking-tight line-clamp-1">{set.name}</div>
                        <div className="text-[9px] text-slate-400 font-medium capitalize truncate">{set.styles[0] || "outline"} style</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

        {/* Filters and List view layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Funnel size={16} /> Filters
                </h3>
                {(selectedStyle || selectedBestFor || selectedFramework || selectedLicense || selectedVibe || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedStyle(null);
                      setSelectedBestFor(null);
                      setSelectedFramework(null);
                      setSelectedLicense(null);
                      setSelectedVibe(null);
                      setSearchQuery("");
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <MagnifyingGlass size={16} className="absolute left-3.5 top-3 text-slate-400" />
              </div>

              {/* Style */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(selectedStyle === style ? null : style)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        selectedStyle === style 
                          ? "bg-slate-800 text-white font-medium" 
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Best For */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Best For</label>
                <div className="flex flex-wrap gap-1.5">
                  {BEST_FOR.map(item => (
                    <button
                      key={item}
                      onClick={() => setSelectedBestFor(selectedBestFor === item ? null : item)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        selectedBestFor === item 
                          ? "bg-slate-800 text-white font-medium" 
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Framework Support */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Framework support</label>
                <div className="flex flex-wrap gap-1.5">
                  {FRAMEWORKS.map(fw => (
                    <button
                      key={fw}
                      onClick={() => setSelectedFramework(selectedFramework === fw ? null : fw)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        selectedFramework === fw 
                          ? "bg-slate-800 text-white font-medium" 
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>
              </div>

              {/* License */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">License</label>
                <div className="flex flex-wrap gap-1.5">
                  {LICENSES.map(lic => (
                    <button
                      key={lic}
                      onClick={() => setSelectedLicense(selectedLicense === lic ? null : lic)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        selectedLicense === lic 
                          ? "bg-slate-800 text-white font-medium" 
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {lic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibe */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Vibe</label>
                <div className="flex flex-wrap gap-1.5">
                  {VIBES.map(vb => (
                    <button
                      key={vb}
                      onClick={() => setSelectedVibe(selectedVibe === vb ? null : vb)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                        selectedVibe === vb 
                          ? "bg-slate-800 text-white font-medium" 
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {vb}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Cards List Grid */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm">Yükleniyor...</p>
              </div>
            ) : filteredSets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-slate-500 text-sm font-medium mb-2">No icon sets found matching the selected filters.</p>
                <button 
                  onClick={() => {
                    setSelectedStyle(null);
                    setSelectedBestFor(null);
                    setSelectedFramework(null);
                    setSelectedLicense(null);
                    setSelectedVibe(null);
                    setSearchQuery("");
                    setShowFavoritesOnly(false);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {filteredSets.map((set) => (
                    <motion.div
                      layout
                      key={set.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      {/* Top Meta info */}
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <h4 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {set.name}
                            </h4>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                              {set.license}
                            </span>
                          </div>

                          <button 
                            onClick={() => handleToggleFavorite(set.id)}
                            className="p-1.5 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-rose-500"
                          >
                            <Heart weight={set.is_favorited ? "fill" : "regular"} size={18} className={set.is_favorited ? "text-rose-500" : ""} />
                          </button>
                        </div>

                        <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-4">
                          {set.description}
                        </p>

                        {/* Interactive mini widget inside card */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200/50 pb-1.5">
                            <span>UI preview widget</span>
                            <span>{set.id}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* mini item 1 */}
                            <div className="flex items-center gap-1.5">
                              <img 
                                src={`/icons/${set.id}/home.svg`} 
                                alt=""
                                className="w-4 h-4 text-slate-700"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                              <span className="text-[10px] font-semibold text-slate-600">Home</span>
                            </div>
                            
                            {/* mini item 2 */}
                            <div className="flex items-center gap-1.5">
                              <img 
                                src={`/icons/${set.id}/settings.svg`} 
                                alt=""
                                className="w-4 h-4 text-slate-700"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                              <span className="text-[10px] font-semibold text-slate-600">Settings</span>
                            </div>
                          </div>
                        </div>

                        {/* Badges metadata */}
                        <div className="space-y-2 mb-6">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block w-full">Best For</span>
                            {set.best_for.map(bf => (
                              <span key={bf} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium capitalize">
                                {bf}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block w-full">Style</span>
                            {set.styles.map(st => (
                              <span key={st} className="text-[10px] bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded-md font-medium capitalize">
                                {st}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-col gap-2 mt-auto">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/apps/icon-set-guide/${set.id}`}
                            className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-xl transition-all"
                          >
                            View Details
                          </Link>
                          {set.website_url && (
                            <a 
                              href={set.website_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all flex items-center justify-center"
                              title="Visit Website"
                            >
                              <ArrowSquareOut size={16} />
                            </a>
                          )}
                        </div>
                        {set.npm_command && (
                          <button
                            onClick={() => handleCopyCommand(set.npm_command!, set.id)}
                            className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-850 text-slate-200 text-[10px] font-mono py-1.5 px-3 rounded-xl border border-slate-800"
                          >
                            <span className="truncate">{set.npm_command}</span>
                            {copiedId === set.id ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} className="text-slate-400 group-hover:text-white" />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
