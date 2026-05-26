"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import {
  Compass,
  CaretLeft,
  MagnifyingGlass,
  Funnel,
  Star,
  CurrencyDollar,
  Clock,
  Wrench,
  BookOpen,
  CheckCircle,
  FileText,
  CaretRight,
  ChartLineUp,
  FloppyDisk,
  Sparkle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Client, { Local, hobby_center } from "@/lib/client";
import { HOBBIES_DATA, Hobby } from "./hobbies_data";

// Initialize client
const client = new Client(Local);

export default function HobbyCenterPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { locale } = useLanguage();
  const t = useTranslations("hobbyCenter");
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState<"explore" | "dashboard">("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  
  // User database tracks
  const [userTracks, setUserTracks] = useState<hobby_center.UserHobbyTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  // Active hobby for drawer
  const [activeHobby, setActiveHobby] = useState<Hobby | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form states inside active hobby
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<hobby_center.HobbyStatus>("interested");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [savingProgress, setSavingProgress] = useState(false);

  // Load user progress
  useEffect(() => {
    if (isUserLoaded && user) {
      fetchUserTracks();
    } else if (isUserLoaded && !user) {
      setLoadingTracks(false);
    }
  }, [isUserLoaded, user]);

  const fetchUserTracks = async () => {
    if (!user) return;
    try {
      setLoadingTracks(true);
      const response = await client.hobby_center.getUserHobbies(user.id);
      setUserTracks(response.tracks || []);
    } catch (error) {
      console.error("Error fetching user tracks:", error);
    } finally {
      setLoadingTracks(false);
    }
  };

  // Open drawer helper
  const openHobbyDetail = (hobby: Hobby) => {
    setActiveHobby(hobby);
    
    // Find if user already has tracking data for this hobby
    const track = userTracks.find(t => t.hobby_id === hobby.id);
    if (track) {
      setStatus(track.status);
      setNotes(track.notes);
      setCompletedSteps(track.completed_steps || []);
    } else {
      setStatus("interested");
      setNotes("");
      setCompletedSteps([]);
    }
    setDrawerOpen(true);
  };

  // Handle step checkbox toggle
  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter(s => s !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  // Save hobby progress to database
  const handleSaveProgress = async () => {
    if (!user) {
      toast.error(locale === "tr" ? "Lütfen önce giriş yapın" : "Please sign in first");
      return;
    }
    if (!activeHobby) return;

    try {
      setSavingProgress(true);
      await client.hobby_center.updateUserHobby({
        userId: user.id,
        hobbyId: activeHobby.id,
        status: status,
        notes: notes,
        completedSteps: completedSteps
      });
      
      toast.success(t("toastSaved"));
      // Refresh tracks
      await fetchUserTracks();
    } catch (error) {
      console.error("Save progress error:", error);
      toast.error(t("toastError"));
    } finally {
      setSavingProgress(false);
    }
  };

  // Unique categories helper
  const categories = ["all", ...Array.from(new Set(HOBBIES_DATA.map(h => locale === "tr" ? h.categoryTr : h.categoryEn)))];

  // Filtering logic
  const filteredHobbies = HOBBIES_DATA.filter(hobby => {
    const title = locale === "tr" ? hobby.titleTr : hobby.titleEn;
    const desc = locale === "tr" ? hobby.descriptionTr : hobby.descriptionEn;
    const cat = locale === "tr" ? hobby.categoryTr : hobby.categoryEn;

    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || cat === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || hobby.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Tracked dashboard hobbies
  const trackedHobbies = HOBBIES_DATA.filter(h => userTracks.some(t => t.hobby_id === h.id)).map(hobby => {
    const track = userTracks.find(t => t.hobby_id === hobby.id);
    return {
      ...hobby,
      track
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden select-none pb-20">
      <Toaster position="top-center" />

      {/* Decorative Premium Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between z-10">
        <button 
          onClick={() => router.push("/home")}
          className="group flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors duration-200"
        >
          <CaretLeft size={20} />
          <span className="text-sm font-medium">{t("backToHome")}</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-full text-xs font-semibold text-amber-400 shadow-md">
          <Compass size={16} className="text-amber-500 animate-spin-slow" />
          <span>Hobby Explorer v1.0</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl mx-auto px-6 py-6 flex-1 z-10 flex flex-col">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 mb-3">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-900/40 p-1.5 rounded-full flex gap-1 border border-slate-800 max-w-sm mx-auto mb-10 w-full backdrop-blur-md">
          {(["explore", "dashboard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all relative overflow-hidden ${
                activeTab === tab ? "text-slate-950 font-black" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeHobbyTab"
                  className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 shadow-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {tab === "explore" ? <Compass size={15} /> : <ChartLineUp size={15} />}
                {tab === "explore" ? t("allHobbies") : t("myDashboard")}
              </span>
            </button>
          ))}
        </div>

        {/* Explore Mode */}
        {activeTab === "explore" && (
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Search & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative group md:col-span-1">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-amber-500 transition-colors">
                  <MagnifyingGlass size={18} />
                </span>
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none">
                  <Funnel size={16} />
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all cursor-pointer appearance-none text-slate-300"
                >
                  <option value="all">{t("allCategories")}</option>
                  {categories.filter(c => c !== "all").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 pointer-events-none">
                  <Star size={16} />
                </span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all cursor-pointer appearance-none text-slate-300"
                >
                  <option value="all">{t("allDifficulties")}</option>
                  <option value="easy">{t("easy")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="hard">{t("hard")}</option>
                </select>
              </div>
            </div>

            {/* Hobbies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <AnimatePresence>
                {filteredHobbies.map((hobby) => {
                  const isTracked = userTracks.find(t => t.hobby_id === hobby.id);
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, borderColor: "rgba(245,158,11,0.2)" }}
                      onClick={() => openHobbyDetail(hobby)}
                      key={hobby.id}
                      className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 relative group overflow-hidden"
                    >
                      {/* Tracking State Border Accent */}
                      {isTracked && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isTracked.status === "learned" ? "bg-green-500" :
                          isTracked.status === "in_progress" ? "bg-amber-500" : "bg-blue-400"
                        }`} />
                      )}

                      <div>
                        {/* Upper Badges */}
                        <div className="flex justify-between items-center mb-4 pl-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                            {locale === "tr" ? hobby.categoryTr : hobby.categoryEn}
                          </span>
                          
                          {/* Difficulty Indicators */}
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              hobby.difficulty === "easy" ? "bg-green-950/60 text-green-400 border border-green-900/40" :
                              hobby.difficulty === "medium" ? "bg-amber-950/60 text-amber-400 border border-amber-900/40" :
                              "bg-red-950/60 text-red-400 border border-red-900/40"
                            }`}>
                              {t(hobby.difficulty)}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors pl-1">
                          {locale === "tr" ? hobby.titleTr : hobby.titleEn}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-2 pl-1">
                          {locale === "tr" ? hobby.descriptionTr : hobby.descriptionEn}
                        </p>
                      </div>

                      {/* Footer Details */}
                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 pl-1">
                        {/* Cost rating */}
                        <div className="flex items-center gap-0.5 text-slate-500">
                          <CurrencyDollar size={15} className={hobby.cost === "low" || hobby.cost === "medium" || hobby.cost === "high" ? "text-amber-500" : ""} />
                          <CurrencyDollar size={15} className={hobby.cost === "medium" || hobby.cost === "high" ? "text-amber-500" : ""} />
                          <CurrencyDollar size={15} className={hobby.cost === "high" ? "text-amber-500" : ""} />
                        </div>

                        {/* Detail Link Prompt */}
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-500 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                          {isTracked ? (
                            <span className={
                              isTracked.status === "learned" ? "text-green-400" :
                              isTracked.status === "in_progress" ? "text-amber-400" : "text-blue-400"
                            }>
                              {t(isTracked.status)}
                            </span>
                          ) : t("explore")}
                          <CaretRight size={12} />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Dashboard Mode */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 flex-1 flex flex-col">
            {loadingTracks ? (
              <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                {locale === "tr" ? "İlerlemeler Yükleniyor..." : "Syncing Tracks..."}
              </div>
            ) : trackedHobbies.length === 0 ? (
              <div className="py-24 text-center bg-slate-900/20 border border-slate-800 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                  <Compass size={28} />
                </div>
                <p className="text-slate-400 text-xs font-semibold max-w-xs leading-relaxed">
                  {t("noTrackedHobbies")}
                </p>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="mt-6 text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-full transition-all"
                >
                  {t("allHobbies")}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "interested", color: "text-blue-400 bg-blue-500/5 border-blue-500/10" },
                    { id: "in_progress", color: "text-amber-400 bg-amber-500/5 border-amber-500/10" },
                    { id: "learned", color: "text-green-400 bg-green-500/5 border-green-500/10" }
                  ].map(stat => {
                    const count = trackedHobbies.filter(h => h.track?.status === stat.id).length;
                    return (
                      <div key={stat.id} className={`p-4 rounded-2xl border text-center ${stat.color}`}>
                        <div className="text-[9px] uppercase font-bold tracking-widest opacity-60 mb-1">{t(stat.id)}</div>
                        <div className="text-2xl font-black">{count}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Dashboard List */}
                <div className="space-y-4 pt-4">
                  {trackedHobbies.map(hobby => {
                    const track = hobby.track;
                    const completionRate = track ? Math.round((track.completed_steps.length / hobby.stepsTr.length) * 100) : 0;
                    
                    return (
                      <motion.div
                        whileHover={{ borderColor: "rgba(245,158,11,0.2)", y: -2 }}
                        onClick={() => openHobbyDetail(hobby)}
                        key={hobby.id}
                        className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-md flex items-center justify-between cursor-pointer transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">
                              {locale === "tr" ? hobby.categoryTr : hobby.categoryEn}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span className={`text-[8px] uppercase font-black tracking-wide ${
                              track?.status === "learned" ? "text-green-400" :
                              track?.status === "in_progress" ? "text-amber-400" : "text-blue-400"
                            }`}>
                              {t(track?.status || "interested")}
                            </span>
                          </div>

                          <h3 className="text-base font-bold truncate text-slate-100">
                            {locale === "tr" ? hobby.titleTr : hobby.titleEn}
                          </h3>

                          {/* Progress bar */}
                          {track?.status === "in_progress" && (
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex-1 bg-slate-950 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 rounded-full" 
                                  style={{ width: `${completionRate}%` }} 
                                />
                              </div>
                              <span className="text-[9px] font-bold text-slate-500">{completionRate}%</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {t("save")}
                          </span>
                          <CaretRight size={14} className="text-slate-600" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Vaul Drawer for Detail Dialog */}
      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-slate-900 border-t border-slate-800 text-slate-100 flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[110] max-w-lg mx-auto overflow-hidden">
            
            {/* Scroll Area */}
            {activeHobby && (
              <div className="flex-1 overflow-y-auto px-6 py-8 pb-12">
                <div className="mx-auto w-12 h-1 bg-slate-800 rounded-full mb-6" />

                {/* Main Details */}
                <div className="mb-6">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500">
                    {locale === "tr" ? activeHobby.categoryTr : activeHobby.categoryEn}
                  </span>
                  <Drawer.Title className="text-2xl font-extrabold text-slate-100 mt-1 mb-3">
                    {locale === "tr" ? activeHobby.titleTr : activeHobby.titleEn}
                  </Drawer.Title>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {locale === "tr" ? activeHobby.descriptionTr : activeHobby.descriptionEn}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8 bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
                  {/* Setup */}
                  <div className="flex flex-col items-center text-center">
                    <Clock size={16} className="text-slate-500 mb-1" />
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wide">{t("setupTime")}</span>
                    <span className="text-[10px] font-semibold text-slate-300 mt-0.5">{locale === "tr" ? activeHobby.setupTimeTr : activeHobby.setupTimeEn}</span>
                  </div>

                  {/* Difficulty */}
                  <div className="flex flex-col items-center text-center border-x border-slate-800/40">
                    <Star size={16} className="text-slate-500 mb-1" />
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wide">{t("difficulty")}</span>
                    <span className="text-[10px] font-semibold text-slate-300 mt-0.5">{t(activeHobby.difficulty)}</span>
                  </div>

                  {/* Cost */}
                  <div className="flex flex-col items-center text-center">
                    <CurrencyDollar size={16} className="text-slate-500 mb-1" />
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wide">{t("cost")}</span>
                    <span className="text-[10px] font-semibold text-slate-300 mt-0.5">{t(activeHobby.cost)}</span>
                  </div>
                </div>

                {/* Tools needed */}
                <div className="mb-8">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3 flex items-center gap-1.5">
                    <Wrench size={13} />
                    {t("toolsNeeded")}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(locale === "tr" ? activeHobby.toolsTr : activeHobby.toolsEn).map((tool, idx) => (
                      <span key={idx} className="text-[10px] font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/60">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Steps Section */}
                <div className="mb-8">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4 flex items-center gap-1.5">
                    <CheckCircle size={13} />
                    {t("howToStart")}
                  </h4>
                  
                  <div className="space-y-3">
                    {(locale === "tr" ? activeHobby.stepsTr : activeHobby.stepsEn).map((step, idx) => {
                      const isCompleted = completedSteps.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleStep(idx)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                            isCompleted 
                              ? "bg-amber-500/5 border-amber-500/20 text-slate-300"
                              : "bg-slate-950/20 border-slate-800/80 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-all ${
                            isCompleted 
                              ? "bg-amber-500 border-amber-400 text-slate-950" 
                              : "border-slate-700"
                          }`}>
                            {isCompleted && <Sparkle size={10} weight="fill" />}
                          </div>
                          <span className="text-xs leading-relaxed">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trusted Resources */}
                <div className="mb-8">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3 flex items-center gap-1.5">
                    <BookOpen size={13} />
                    {t("trustedResources")}
                  </h4>
                  <div className="space-y-2">
                    {activeHobby.resources.map((res, idx) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-amber-500/40 hover:bg-slate-950 transition-all text-xs text-amber-400 font-semibold group"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform">
                          {locale === "tr" ? res.labelTr : res.labelEn}
                        </span>
                        <CaretRight size={14} className="text-slate-600 group-hover:text-amber-500" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* User Personal Logs & Save Status */}
                {user && (
                  <div className="border-t border-slate-800 pt-6 mt-6 space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-1.5">
                      <FileText size={13} />
                      {t("personalNotes")}
                    </h4>

                    {/* Status Select */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "interested", color: "border-blue-500/20 active:bg-blue-500/10 text-blue-400" },
                        { id: "in_progress", color: "border-amber-500/20 active:bg-amber-500/10 text-amber-400" },
                        { id: "learned", color: "border-green-500/20 active:bg-green-500/10 text-green-400" }
                      ].map(s => {
                        const isSel = status === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setStatus(s.id as any)}
                            className={`py-3 px-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                              isSel 
                                ? s.id === "learned" ? "bg-green-500 text-slate-950 border-green-400" :
                                  s.id === "in_progress" ? "bg-amber-500 text-slate-950 border-amber-400" :
                                  "bg-blue-500 text-slate-950 border-blue-400"
                                : `bg-slate-950/40 ${s.color} hover:bg-slate-950`
                            }`}
                          >
                            {t(s.id)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Notes Textarea */}
                    <textarea
                      rows={3}
                      placeholder={t("notesPlaceholder")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs outline-none focus:border-amber-500/30 text-slate-300 font-medium placeholder:text-slate-600 resize-none"
                    />

                    {/* Save Button */}
                    <button
                      type="button"
                      disabled={savingProgress}
                      onClick={handleSaveProgress}
                      className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all"
                    >
                      {savingProgress ? (
                        <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                      ) : (
                        <>
                          <FloppyDisk size={16} weight="fill" />
                          <span>{t("save")}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
