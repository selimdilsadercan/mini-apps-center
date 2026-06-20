"use client";

import React, { useState, use, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useDragControls, Reorder } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Footprints, 
  ForkKnife, 
  Lightbulb, 
  WarningCircle,
  MapPin,
  CaretDown,
  CaretUp,
  NavigationArrow,
  CheckCircle,
  Info,
  FastForward,
  Timer,
  ArrowsClockwise,
  Check,
  Play,
  X,
  Gear,
  Flag,
  MapTrifold,
  Bus,
  DotsSixVertical
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { CITY_GUIDES, Stop, Tour, RouteVariant, ACCESS_MODE_LABELS, WALKING_LEVEL_LABELS } from "../data";

type StopStatus = 'completed' | 'current' | 'upcoming' | 'skipped' | 'optional' | 'closed';
type AppMode = 'planning' | 'active';

// Sub-component for Reorder Item to use drag controls
function ReorderItem({ 
  stop, 
  isExcluded, 
  onToggleExclusion, 
  calculatedTime, 
  locale 
}: { 
  stop: Stop, 
  isExcluded: boolean, 
  onToggleExclusion: (id: string) => void, 
  calculatedTime: string, 
  locale: 'tr' | 'en' 
}) {
  const controls = useDragControls();
  const title = (locale === 'tr' ? stop.titleTr : stop.titleEn) || (stop as any).title;
  const area = (locale === 'tr' ? stop.areaTr : stop.areaEn) || (stop as any).area;

  return (
    <Reorder.Item 
      value={stop}
      dragListener={false}
      dragControls={controls}
      className={`bg-white p-4 rounded-2xl border flex items-center gap-4 select-none touch-none
        ${isExcluded ? 'border-slate-100 opacity-50' : 'border-slate-200 shadow-sm'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isExcluded ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", zIndex: 50 }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button 
          onClick={() => onToggleExclusion(stop.id)}
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0
            ${isExcluded ? 'border-slate-300 bg-white' : 'border-teal-600 bg-teal-600 text-white'}`}
        >
          {!isExcluded && <Check size={14} weight="bold" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-bold text-sm truncate ${isExcluded ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {title}
            </h4>
            {stop.priority === 'must-see' && (
              <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">MUST</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400">{area} • {calculatedTime}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-bold text-slate-500">{stop.estimatedDurationMinutes} {locale === 'tr' ? 'dk' : 'min'}</span>
        {!isExcluded && (
          <div 
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-slate-400 transition-colors"
          >
            <DotsSixVertical size={20} weight="bold" />
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

export default function CityDetailClient({ cityId }: { cityId: string }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useTranslations("oneDayCityGuide");
  const guide = CITY_GUIDES[cityId];

  // State
  const [mode, setMode] = useState<AppMode>('planning');
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [currentStopId, setCurrentStopId] = useState<string | null>(null);
  const [stopStatuses, setStopStatuses] = useState<Record<string, StopStatus>>({});
  const [excludedStopIds, setExcludedStopIds] = useState<Set<string>>(new Set());
  const [orderedStops, setOrderedStops] = useState<Stop[]>([]);
  const [timeOffset, setTimeOffset] = useState(0); // in minutes
  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const STORAGE_KEY = `oneday-guide-state-${cityId}`;

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !guide) return;

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setMode(parsed.mode || 'planning');
        const variantId = parsed.selectedVariantId || guide.routeVariants[0].id;
        setSelectedVariantId(variantId);
        setCurrentStopId(parsed.currentStopId || null);
        setStopStatuses(parsed.stopStatuses || {});
        setExcludedStopIds(new Set(parsed.excludedStopIds || []));
        
        // Merge saved order with latest data from data.ts
        const tour = guide.tours.find(t => t.variantId === variantId) || guide.tours[0];
        const savedStops = parsed.orderedStops || [];
        const mergedStops = savedStops.map((savedStop: any) => {
          const latestStop = tour.stops.find(s => s.id === savedStop.id);
          return latestStop ? { ...latestStop } : savedStop;
        });
        
        setOrderedStops(mergedStops.length > 0 ? mergedStops : tour.stops);
        setTimeOffset(parsed.timeOffset || 0);
        setIsInitialized(true);
        return;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }

    // Default initialization if no saved state
    const firstVariant = guide.routeVariants[0];
    setSelectedVariantId(firstVariant.id);
    const tour = guide.tours.find(t => t.variantId === firstVariant.id) || guide.tours[0];
    setOrderedStops(tour.stops);
    setIsInitialized(true);
  }, [guide, cityId, STORAGE_KEY]);

  // Save state to localStorage
  useEffect(() => {
    if (!isInitialized) return;

    const stateToSave = {
      mode,
      selectedVariantId,
      currentStopId,
      stopStatuses,
      excludedStopIds: Array.from(excludedStopIds),
      orderedStops,
      timeOffset
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [mode, selectedVariantId, currentStopId, stopStatuses, excludedStopIds, orderedStops, timeOffset, isInitialized, STORAGE_KEY]);

  const currentTour = useMemo(() => {
    if (!guide) return null;
    return guide.tours.find(t => t.variantId === selectedVariantId) || guide.tours[0];
  }, [guide, selectedVariantId]);

  // Filtered stops for the active tour
  const activeStops = useMemo(() => {
    return orderedStops.filter(s => !excludedStopIds.has(s.id));
  }, [orderedStops, excludedStopIds]);

  if (!guide || !currentTour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">{locale === 'tr' ? 'Şehir Bulunamadı' : 'City Not Found'}</h1>
        <p className="text-slate-600 mb-6">{locale === 'tr' ? 'Aradığınız şehir rehberi henüz hazır değil veya mevcut değil.' : 'The city guide you are looking for is not ready yet or does not exist.'}</p>
        <button 
          onClick={() => router.push("/apps/one-day-city-guide")}
          className="bg-teal-600 text-white px-6 py-2 rounded-full font-bold"
        >
          {locale === 'tr' ? 'Geri Dön' : 'Go Back'}
        </button>
      </div>
    );
  }

  const toggleStopExpansion = (id: string) => {
    setExpandedStops(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const tour = guide.tours.find(t => t.variantId === variantId) || guide.tours[0];
    setOrderedStops(tour.stops);
    setExcludedStopIds(new Set());
    setExpandedStops({});
  };

  const toggleStopExclusion = (stopId: string) => {
    setExcludedStopIds(prev => {
      const next = new Set(prev);
      if (next.has(stopId)) next.delete(stopId);
      else next.add(stopId);
      return next;
    });
  };

  const resetTour = () => {
    if (confirm(locale === 'tr' ? "Tüm planı sıfırlamak istediğine emin misin?" : "Are you sure you want to reset the entire plan?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const startTour = () => {
    const initialStatuses: Record<string, StopStatus> = {};
    activeStops.forEach((stop, idx) => {
      initialStatuses[stop.id] = idx === 0 ? 'current' : 'upcoming';
    });
    setStopStatuses(initialStatuses);
    setCurrentStopId(activeStops[0]?.id || null);
    setTimeOffset(0);
    setMode('active');
    window.scrollTo(0, 0);
  };

  const markStopCompleted = (stopId: string) => {
    const newStatuses = { ...stopStatuses };
    newStatuses[stopId] = 'completed';
    
    // Find next upcoming stop in the original order
    const nextStop = activeStops.find(s => newStatuses[s.id] === 'upcoming');
    if (nextStop) {
      newStatuses[nextStop.id] = 'current';
      setCurrentStopId(nextStop.id);
    } else {
      setCurrentStopId(null);
    }
    
    setStopStatuses(newStatuses);
  };

  const skipStop = (stopId: string) => {
    const stop = activeStops.find(s => s.id === stopId);
    if (!stop) return;

    const newStatuses = { ...stopStatuses };
    newStatuses[stopId] = 'skipped';
    
    if (stop.skipEffect) {
      setTimeOffset(prev => prev - stop.skipEffect!.timeSavedMinutes);
    }

    // Find next upcoming stop
    const nextStop = activeStops.find(s => newStatuses[s.id] === 'upcoming');
    if (nextStop) {
      newStatuses[nextStop.id] = 'current';
      setCurrentStopId(nextStop.id);
    } else {
      setCurrentStopId(null);
    }
    
    setStopStatuses(newStatuses);
  };

  const addTimeDelay = (minutes: number) => {
    setTimeOffset(prev => prev + minutes);
  };

  const getStopCalculatedTime = (stopId: string) => {
    const stopIdx = orderedStops.findIndex(s => s.id === stopId);
    if (stopIdx === -1) return guide.city.recommendedStartTime;

    let totalMinutes = timeOffset;
    for (let i = 0; i < stopIdx; i++) {
      const stop = orderedStops[i];
      if (!excludedStopIds.has(stop.id)) {
        totalMinutes += stop.estimatedDurationMinutes;
      }
    }

    const [hours, mins] = guide.city.recommendedStartTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + totalMinutes, 0);
    return date.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const currentStop = activeStops.find(s => s.id === currentStopId);

  // ── PLANNING VIEW ─────────────────────────────────────────────────────────
  if (mode === 'planning') {
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/apps/one-day-city-guide")} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft size={20} weight="bold" />
              </button>
              <h1 className="text-lg font-bold text-slate-900">
                {locale === 'tr' ? 'Geziyi Planla' : 'Plan the Trip'}: {locale === 'tr' ? guide.city.nameTr : guide.city.nameEn}
              </h1>
            </div>
            <button 
              onClick={resetTour}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"
              title={locale === 'tr' ? 'Planı Sıfırla' : 'Reset Plan'}
            >
              <ArrowsClockwise size={22} weight="bold" />
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-6">
          {/* Variant Selection */}
          <section className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapTrifold size={18} weight="fill" /> {locale === 'tr' ? 'Rota Türü Seç' : 'Select Route Type'}
            </h3>
            <div className="grid gap-3">
              {guide.routeVariants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantChange(variant.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all
                    ${selectedVariantId === variant.id 
                      ? 'border-teal-600 bg-teal-50 shadow-sm' 
                      : 'border-white bg-white hover:border-slate-200 shadow-sm'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-bold ${selectedVariantId === variant.id ? 'text-teal-700' : 'text-slate-800'}`}>
                      {locale === 'tr' ? variant.titleTr : variant.titleEn}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full 
                      ${variant.walkingLevel === 'low' ? 'bg-green-100 text-green-700' : 
                        variant.walkingLevel === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {variant.walkingLevel.toUpperCase()} {locale === 'tr' ? 'YÜRÜYÜŞ' : 'WALKING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{locale === 'tr' ? variant.descriptionTr : variant.descriptionEn}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Stop Configuration */}
          <section className="mb-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle size={18} weight="fill" /> {locale === 'tr' ? 'Durakları Özelleştir & Sırala' : 'Customize & Sort Stops'}
            </h3>
            <Reorder.Group 
              axis="y" 
              values={orderedStops} 
              onReorder={setOrderedStops}
              className="space-y-3"
            >
              {orderedStops.map((stop) => (
                <ReorderItem 
                  key={stop.id} 
                  stop={stop} 
                  isExcluded={excludedStopIds.has(stop.id)} 
                  onToggleExclusion={toggleStopExclusion}
                  calculatedTime={getStopCalculatedTime(stop.id)}
                  locale={locale}
                />
              ))}
            </Reorder.Group>
          </section>
        </main>

        {/* Start Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-50">
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={startTour}
              disabled={activeStops.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-teal-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Play size={24} weight="fill" /> {locale === 'tr' ? 'Geziyi Başlat' : 'Start the Trip'} ({activeStops.length} {locale === 'tr' ? 'Durak' : 'Stops'})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE TOUR VIEW ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      {/* Active Header */}
      <header className="sticky top-0 z-40 bg-teal-700 text-white border-b border-teal-800 shadow-md">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('planning')} className="p-2 hover:bg-teal-600 rounded-full transition-colors">
              <X size={20} weight="bold" />
            </button>
            <div>
              <h1 className="text-sm font-bold leading-tight">
                {locale === 'tr' ? 'Canlı Gezi' : 'Live Trip'}: {locale === 'tr' ? guide.city.nameTr : guide.city.nameEn}
              </h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[10px] text-teal-100 font-bold uppercase tracking-wider">
                  {locale === 'tr' ? 'Tur Devam Ediyor' : 'Tour in Progress'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => setMode('planning')} className="text-[10px] font-bold bg-teal-600 px-3 py-1.5 rounded-lg border border-teal-500 hover:bg-teal-500 transition-colors">
            {locale === 'tr' ? 'PLANA DÖN' : 'BACK TO PLAN'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {/* Focused Route List */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{locale === 'tr' ? 'DURAKLAR' : 'STOPS'}</h3>
            {timeOffset !== 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${timeOffset > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {timeOffset > 0 
                  ? (locale === 'tr' ? `+${timeOffset} dk gecikme` : `+${timeOffset} min delay`)
                  : (locale === 'tr' ? `${timeOffset} dk kazanç` : `${timeOffset} min gain`)}
              </span>
            )}
          </div>
          <div className="relative space-y-4 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
            {activeStops.map((stop, index) => {
              const status = stopStatuses[stop.id] || 'upcoming';
              const isCurrent = status === 'current';
              const isCompleted = status === 'completed';
              const isSkipped = status === 'skipped';
              const isUpcoming = status === 'upcoming';

              const title = (locale === 'tr' ? stop.titleTr : stop.titleEn) || (stop as any).title;
              const description = (locale === 'tr' ? stop.descriptionTr : stop.descriptionEn) || (stop as any).description;
              const accessSummary = (locale === 'tr' ? stop.accessInfo?.summaryTr : stop.accessInfo?.summaryEn) || (stop.accessInfo as any)?.summary;
              const walkingLabel = locale === 'tr' 
                ? WALKING_LEVEL_LABELS[stop.accessInfo?.walkingRequired || 'low'].tr 
                : WALKING_LEVEL_LABELS[stop.accessInfo?.walkingRequired || 'low'].en;
              
              const whatToDo: string[] = (locale === 'tr' ? stop.whatToDoTr : stop.whatToDoEn) || (stop as any).whatToDo || [];
              const tips: string[] = (locale === 'tr' ? stop.tipsTr : stop.tipsEn) || (stop as any).tips || [];
              const whatToTry: string[] = (locale === 'tr' ? stop.whatToTryTr : stop.whatToTryEn) || (stop as any).whatToTry || [];

              return (
                <div key={stop.id} className={`relative pl-12 transition-all duration-300 ${isCompleted || isSkipped ? 'opacity-50' : 'opacity-100'}`}>
                  <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-slate-50 flex items-center justify-center z-10 shadow-sm transition-all
                    ${isCurrent ? 'bg-teal-600 text-white scale-110 ring-4 ring-teal-600/20' : 
                      isCompleted ? 'bg-green-500 text-white' : 
                      isSkipped ? 'bg-slate-300 text-slate-500' :
                      'bg-white text-slate-400 border-slate-200'}`}
                  >
                    {isCompleted ? <Check size={20} weight="bold" /> : <span className="text-sm font-bold">{index + 1}</span>}
                  </div>

                  <div className={`bg-white rounded-2xl border transition-all overflow-hidden
                    ${isCurrent ? 'border-teal-500 shadow-lg' : 'border-slate-200 shadow-sm hover:border-teal-200'}`}
                  >
                    <div className="w-full text-left flex flex-col">
                      <button 
                        onClick={() => toggleStopExpansion(stop.id)}
                        className="w-full text-left p-4 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase
                              ${isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {getStopCalculatedTime(stop.id)}
                            </span>
                            {isCurrent && <span className="text-[9px] font-black text-teal-600 animate-pulse">{locale === 'tr' ? 'AKTİF' : 'ACTIVE'}</span>}
                            {isUpcoming && <span className="text-[9px] font-bold text-slate-400">{locale === 'tr' ? 'SIRADAKİ' : 'NEXT'}</span>}
                          </div>
                          <h4 className={`font-bold text-sm ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {title}
                          </h4>
                        </div>
                        <CaretDown size={16} className={`text-slate-400 transition-transform ${expandedStops[stop.id] || isCurrent ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {(isCurrent || expandedStops[stop.id]) && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-50 overflow-hidden">
                            <div className="p-4 space-y-4">
                              <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
                              
                              <div className="grid grid-cols-1 gap-3">
                                  <div className="bg-slate-50 p-3 rounded-xl">
                                    <h5 className="text-[9px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                      <Bus size={14} weight="fill" className="text-teal-50" /> {locale === 'tr' ? 'Buraya Nasıl Gidilir?' : 'How to Get Here?'}
                                    </h5>
                                    <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 uppercase tracking-tight">
                                      {stop.accessInfo?.recommendedModes?.map(m => ACCESS_MODE_LABELS[m][locale]).join(" / ") || (locale === 'tr' ? 'Bilinmiyor' : 'Unknown')}
                                    </span>
                                      <span className="text-[10px] font-medium text-slate-500">•</span>
                                      <span className="text-[10px] font-medium text-slate-500 capitalize">{walkingLabel}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-tight">{accessSummary}</p>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                      <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                        <CheckCircle size={16} weight="fill" className="text-teal-500" /> {locale === 'tr' ? 'Neler Yapılır?' : 'What to Do?'}
                                      </h5>
                                      <ul className="space-y-2">
                                        {whatToDo.map((t, i) => (
                                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                            {t}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {tips && tips.length > 0 && (
                                      <div className="bg-yellow-50/30 p-4 rounded-2xl border border-yellow-100/50">
                                        <h5 className="text-[10px] font-bold text-yellow-600/70 uppercase mb-3 flex items-center gap-2">
                                          <Lightbulb size={16} weight="fill" className="text-yellow-500" /> {locale === 'tr' ? 'İpuçları' : 'Tips'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {tips.map((tip, i) => (
                                            <li key={i} className="text-xs text-slate-600 italic leading-relaxed">
                                              "{tip}"
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {whatToTry && whatToTry.length > 0 && (
                                      <div className="bg-orange-50/30 p-4 rounded-2xl border border-orange-100/50">
                                        <h5 className="text-[10px] font-bold text-orange-600/70 uppercase mb-3 flex items-center gap-2">
                                          <ForkKnife size={16} weight="fill" className="text-orange-500" /> {locale === 'tr' ? 'Tadılacaklar' : 'What to Try'}
                                        </h5>
                                        <ul className="space-y-2">
                                          {whatToTry.map((t, i) => (
                                            <li key={i} className="text-xs text-orange-900 flex items-start gap-2 leading-relaxed">
                                              <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-200 shrink-0" />
                                              {t}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                              </div>

                              {isCurrent && (
                                <div className="flex gap-2 pt-2">
                                  <button onClick={() => markStopCompleted(stop.id)} className="flex-1 bg-teal-600 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2">
                                    <Check size={16} weight="bold" /> {locale === 'tr' ? 'Tamamladım' : 'Completed'}
                                  </button>
                                  <button onClick={() => skipStop(stop.id)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                    <FastForward size={16} weight="bold" /> {locale === 'tr' ? 'Atla' : 'Skip'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Active Bottom Action */}
      {currentStop && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                    <NavigationArrow size={24} weight="fill" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{locale === 'tr' ? 'Şu Anki Durak' : 'Current Stop'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-teal-600 text-white px-1.5 py-0.5 rounded uppercase">
                        {getStopCalculatedTime(currentStop.id)}
                      </span>
                      <span className="text-xs font-medium text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        {(locale === 'tr' ? currentStop.areaTr : currentStop.areaEn) || (currentStop as any).area}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => addTimeDelay(15)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-colors border border-slate-100" title={locale === 'tr' ? 'Gecikme' : 'Delay'}>
                    <Clock size={18} />
                  </button>
                  <button onClick={() => addTimeDelay(-15)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl transition-colors border border-slate-100" title={locale === 'tr' ? 'Hızlan' : 'Speed Up'}>
                    <FastForward size={18} />
                  </button>
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-900 mb-5 leading-tight">
                {(locale === 'tr' ? currentStop.titleTr : currentStop.titleEn) || (currentStop as any).title}
              </h4>

              <button 
                onClick={() => markStopCompleted(currentStop.id)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-teal-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {locale === 'tr' ? (
                  <>TAMAM, SIRADAKİ <NavigationArrow size={18} weight="fill" className="rotate-90" /></>
                ) : (
                  'OK, NEXT'
                )}
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {!currentStop && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button 
              onClick={() => setMode('planning')}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {locale === 'tr' ? 'GEZİYİ BİTİR VE PLANA DÖN' : 'FINISH TOUR & BACK TO PLAN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
