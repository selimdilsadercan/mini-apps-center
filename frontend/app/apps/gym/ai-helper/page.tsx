"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { CaretLeft, Copy, Download, Upload, Sparkle, FileCode, CaretDown, CaretUp, Check, Warning, PencilSimple, X } from "@phosphor-icons/react";
import GymShell from "../components/GymShell";
import { getWorkoutsAction, saveWorkoutAction, createRoutineAction } from "../actions";
import type { Workout } from "../types";
import { toast } from "react-hot-toast";
import ExerciseThumbnail from "../components/ExerciseThumbnail";
import ExercisePicker from "../components/ExercisePicker";

interface PreviewExercise {
  name: string;
  slug: string;
  sets: Array<{ reps: number | null; weightKg: number | null; completed?: boolean }>;
  checked: boolean;
  matchedItem?: any;
  matchScore: number;
}

interface PreviewItem {
  name: string;
  checked: boolean;
  exercises: PreviewExercise[];
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
  totalVolumeKg?: number;
}

export default function AiHelperPage() {
  const { user, isLoaded } = useUser();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Imports state
  const [routineImportText, setRoutineImportText] = useState("");
  const [workoutImportText, setWorkoutImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Approval preview state
  const [previewData, setPreviewData] = useState<{ type: "routine" | "workout"; items: PreviewItem[] } | null>(null);
  
  // Active exercise picker target state
  const [pickerActiveFor, setPickerActiveFor] = useState<{ itemIdx: number; exIdx: number } | null>(null);

  // Collapsible & Copy States
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisCopied, setAnalysisCopied] = useState(false);
  
  const [routinePromptOpen, setRoutinePromptOpen] = useState(false);
  const [routinePromptCopied, setRoutinePromptCopied] = useState(false);
  
  const [workoutPromptOpen, setWorkoutPromptOpen] = useState(false);
  const [workoutPromptCopied, setWorkoutPromptCopied] = useState(false);

  const [activeCatalog, setActiveCatalog] = useState<any[]>([]);

  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [floatingBarText, setFloatingBarText] = useState("Prompt Panoya Kopyalandı!");
  const floatingBarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (floatingBarTimeoutRef.current) clearTimeout(floatingBarTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) {
      if (isLoaded) setLoading(false);
      return;
    }
    loadWorkouts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  async function loadWorkouts() {
    try {
      setLoading(true);
      const result = await getWorkoutsAction(user!.id);
      if (result.data) {
        setWorkouts(result.data);
      }
      
      const { loadExerciseCatalog } = await import("../exercises");
      const cat = await loadExerciseCatalog();
      setActiveCatalog(cat);
    } finally {
      setLoading(false);
    }
  }

  const getCleanWorkoutsJson = () => {
    const clean = workouts.map((w) => ({
      name: w.name,
      startedAt: w.startedAt,
      finishedAt: w.finishedAt,
      durationSeconds: w.durationSeconds,
      totalVolumeKg: w.totalVolumeKg,
      exercises: w.exercises.map((ex) => ({
        name: ex.name,
        slug: ex.slug,
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weightKg: s.weightKg,
          completed: s.completed,
        })),
      })),
    }));
    return JSON.stringify(clean, null, 2);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(getCleanWorkoutsJson());
    toast.success("JSON verisi panoya kopyalandı!");
  };

  const handleDownloadJson = () => {
    const blob = new Blob([getCleanWorkoutsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gym_antrenman_gecmisi_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON dosyası indirildi!");
  };

  // Prompts Generators
  const getAiPrompt = () => {
    const jsonStr = getCleanWorkoutsJson();
    return `Aşağıda Gym uygulamamdan aldığım son antrenman geçmişim (JSON formatında) yer almaktadır. 

Lütfen bu verileri analiz ederek şunları yap:
1. Yaptığım antrenmanların sıklığı, süreleri ve kaldırdığım toplam hacim (Volume) üzerinden genel kondisyonumu değerlendir.
2. Egzersizlerdeki set, tekrar ve ağırlık dağılımlarını inceleyip zayıf ve güçlü yanlarımı belirt.
3. İlerlememi maksimize etmek ve kas gelişimini (hipertrofi) desteklemek için bana özel gelişim tavsiyeleri ver.
4. Önümüzdeki haftalar için hedeflerime uygun 3 veya 4 günlük örnek bir antrenman rutini (set ve tekrar hedefleriyle birlikte) öner.

Antrenman Verilerim:
\`\`\`json
${jsonStr}
\`\`\``;
  };

  const getRoutineImportPrompt = () => {
    return `Lütfen bana haftalık uygulayabileceğim yeni bir antrenman programı/rutini tasarla. Oluşturacağın programı sadece ve sadece aşağıdaki JSON formatında üret. JSON yapısı dışında hiçbir açıklama, giriş veya çıkış metni ekleme. Doğrudan geçerli ve parse edilebilir bir JSON dizisi (Array) olarak çıktı ver.

KRİTİK UYARI (Eşleşme Sorunu): Egzersizlerin "slug" alanı, sistemdeki görsel ve detayların eşleşebilmesi için kesinlikle standart İngilizce isimlerinin küçük harfle yazılmış ve boşluk yerine tire konulmuş hali olmalıdır. 
Örnekler:
- Şınav -> "push-up"
- Barfiks -> "pull-up" veya "chin-up"
- Squat -> "squat"
- Bench Press -> "barbell-bench-press-medium-grip" veya "bench-press"
- Lateral Raise -> "dumbbell-lateral-raise" veya "lateral-raise"
- Biceps Curl -> "dumbbell-bicep-curl" or "bicep-curl"

\`\`\`json
[
  {
    "name": "Rutin/Gün Adı (örn. Chest & Triceps)",
    "exercises": [
      {
        "name": "Egzersiz Adı Türkçe (örn. Bench Press)",
        "slug": "ingilizce-karsiligi-slugify-edilmis (örn. barbell-bench-press-medium-grip)",
        "sets": [
          { "reps": 10, "weightKg": 60 }
        ]
      }
    ]
  }
]
\`\`\``;
  };

  const getWorkoutImportPrompt = () => {
    return `Lütfen yaptığım egzersiz seanslarını antrenman geçmişime ekleyebilmem için sadece ve sadece aşağıdaki JSON formatında dönüştür. JSON yapısı dışında hiçbir açıklama, giriş veya çıkış metni ekleme. Doğrudan geçerli ve parse edilebilir bir JSON dizisi (Array) olarak çıktı ver.

KRİTİK UYARI (Eşleşme Sorunu): Egzersizlerin "slug" alanı, sistemdeki görsel ve detayların eşleşebilmesi için kesinlikle standart İngilizce isimlerinin küçük harfle yazılmış ve boşluk yerine tire konulmuş hali olmalıdır. 
Örnekler:
- Şınav -> "push-up"
- Barfiks -> "pull-up" veya "chin-up"
- Squat -> "squat"
- Bench Press -> "barbell-bench-press-medium-grip" veya "bench-press"
- Lateral Raise -> "dumbbell-lateral-raise" veya "lateral-raise"
- Biceps Curl -> "dumbbell-bicep-curl" or "bicep-curl"

\`\`\`json
[
  {
    "name": "Antrenman Adı (örn. Push Day)",
    "startedAt": "ISO Zaman Damgası (örn. 2026-07-11T18:00:00.000Z)",
    "finishedAt": "ISO Zaman Damgası (örn. 2026-07-11T19:00:00.000Z)",
    "durationSeconds": 3600,
    "totalVolumeKg": 1500,
    "exercises": [
      {
        "name": "Egzersiz Adı Türkçe (örn. Şınav)",
        "slug": "ingilizce-karsiligi-slugify-edilmis (örn. push-up)",
        "sets": [
          { "reps": 12, "weightKg": 0, "completed": true }
        ]
      }
    ]
  }
]
\`\`\``;
  };

  // Copy Actions
  const triggerFloatingBar = (text: string) => {
    setFloatingBarText(text);
    if (floatingBarTimeoutRef.current) clearTimeout(floatingBarTimeoutRef.current);
    setShowFloatingBar(true);
    floatingBarTimeoutRef.current = setTimeout(() => {
      setShowFloatingBar(false);
    }, 3000);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getAiPrompt());
      setAnalysisCopied(true);
      triggerFloatingBar("Analiz Promptu Panoya Kopyalandı!");
      setTimeout(() => setAnalysisCopied(false), 2000);
    } catch {
      toast.error("Panoya kopyalanamadı.");
    }
  };

  const handleCopyRoutineImportPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getRoutineImportPrompt());
      setRoutinePromptCopied(true);
      triggerFloatingBar("Rutin Oluşturma Promptu Kopyalandı!");
      setTimeout(() => setRoutinePromptCopied(false), 2000);
    } catch {
      toast.error("Panoya kopyalanamadı.");
    }
  };

  const handleCopyWorkoutImportPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getWorkoutImportPrompt());
      setWorkoutPromptCopied(true);
      triggerFloatingBar("Geçmiş Antrenman Promptu Kopyalandı!");
      setTimeout(() => setWorkoutPromptCopied(false), 2000);
    } catch {
      toast.error("Panoya kopyalanamadı.");
    }
  };

  // Resolver helper inside preview builder
  const resolveMatchQuality = (ex: any) => {
    const slug = ex.slug || "";
    if (!slug) return { matched: undefined, score: 0 };

    const directMatch = activeCatalog.find((e) => e.slug === slug);
    if (directMatch) return { matched: directMatch, score: 1.0 };

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const exactSlugMatch = activeCatalog.find((e) => {
      const slugEn = e.nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const slugTr = e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return slugEn === cleanSlug || slugTr === cleanSlug;
    });
    if (exactSlugMatch) return { matched: exactSlugMatch, score: 1.0 };

    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9\s-]/g, "")
        .split(/[\s-]+/)
        .filter(Boolean);
    };

    const queryTokens = normalize(slug);
    if (queryTokens.length === 0) return { matched: undefined, score: 0 };

    let bestMatch = undefined;
    let bestScore = 0;

    for (const item of activeCatalog) {
      const itemTokens = [
        ...normalize(item.name),
        ...normalize(item.nameEn ?? ""),
      ];

      let matches = 0;
      for (const token of queryTokens) {
        if (itemTokens.includes(token)) {
          matches++;
        }
      }

      const score = matches / queryTokens.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (bestScore >= 0.4) {
      return { matched: bestMatch, score: bestScore };
    }

    return { matched: undefined, score: 0 };
  };

  const handlePrepareRoutineImport = () => {
    if (!routineImportText.trim()) return;
    try {
      const parsed = JSON.parse(routineImportText);
      if (!Array.isArray(parsed)) {
        throw new Error("Veri en dışta bir JSON dizisi (Array) olmalıdır.");
      }

      const items: PreviewItem[] = parsed.map((item: any) => ({
        name: item.name || "İsimsiz Rutin",
        checked: true,
        exercises: (item.exercises || []).map((ex: any) => {
          const { matched, score } = resolveMatchQuality(ex);
          return {
            name: ex.name || "İsimsiz Egzersiz",
            slug: ex.slug || "",
            sets: (ex.sets || []).map((s: any) => ({
              reps: s.reps === undefined ? null : Number(s.reps),
              weightKg: s.weightKg === undefined ? null : Number(s.weightKg),
            })),
            checked: true,
            matchedItem: matched,
            matchScore: score,
          };
        }),
      }));

      setPreviewData({ type: "routine", items });
    } catch (e: any) {
      toast.error(`Hatalı JSON: ${e.message}`);
    }
  };

  const handlePrepareWorkoutImport = () => {
    if (!workoutImportText.trim()) return;
    try {
      const parsed = JSON.parse(workoutImportText);
      if (!Array.isArray(parsed)) {
        throw new Error("Veri en dışta bir JSON dizisi (Array) olmalıdır.");
      }

      const items: PreviewItem[] = parsed.map((item: any) => ({
        name: item.name || "İsimsiz Antrenman",
        checked: true,
        startedAt: item.startedAt || new Date().toISOString(),
        finishedAt: item.finishedAt || new Date().toISOString(),
        durationSeconds: Number(item.durationSeconds) || 0,
        totalVolumeKg: Number(item.totalVolumeKg) || 0,
        exercises: (item.exercises || []).map((ex: any) => {
          const { matched, score } = resolveMatchQuality(ex);
          return {
            name: ex.name || "İsimsiz Egzersiz",
            slug: ex.slug || "",
            sets: (ex.sets || []).map((s: any) => ({
              reps: s.reps === undefined ? null : Number(s.reps),
              weightKg: s.weightKg === undefined ? null : Number(s.weightKg),
              completed: s.completed !== false,
            })),
            checked: true,
            matchedItem: matched,
            matchScore: score,
          };
        }),
      }));

      setPreviewData({ type: "workout", items });
    } catch (e: any) {
      toast.error(`Hatalı JSON: ${e.message}`);
    }
  };

  const handleApproveImport = async () => {
    if (!user || !previewData) return;
    try {
      setImporting(true);
      let count = 0;

      const activeItems = previewData.items.filter((i) => i.checked);
      if (activeItems.length === 0) {
        toast.error("İçe aktarılacak aktif bir eleman seçilmedi.");
        return;
      }

      if (previewData.type === "routine") {
        for (const item of activeItems) {
          const activeExs = item.exercises.filter((ex) => ex.checked);
          if (activeExs.length === 0) continue;

          await createRoutineAction(
            user.id,
            item.name,
            activeExs.map((ex) => ({
              name: ex.name,
              slug: ex.matchedItem ? ex.matchedItem.slug : ex.slug || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              sets: ex.sets.map((s) => ({
                reps: s.reps,
                weightKg: s.weightKg,
              })),
            }))
          );
          count++;
        }
        toast.success(`${count} yeni antrenman rutini başarıyla eklendi!`);
        setRoutineImportText("");
        setPreviewData(null);
        window.location.href = "/apps/gym";
      } else {
        for (const item of activeItems) {
          const activeExs = item.exercises.filter((ex) => ex.checked);
          if (activeExs.length === 0) continue;

          await saveWorkoutAction(user.id, {
            name: item.name,
            routineId: null,
            exercises: activeExs.map((ex) => ({
              name: ex.name,
              slug: ex.matchedItem ? ex.matchedItem.slug : ex.slug || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              sets: ex.sets.map((s) => ({
                reps: s.reps,
                weightKg: s.weightKg,
                completed: s.completed !== false,
              })),
            })),
            startedAt: item.startedAt || new Date().toISOString(),
            finishedAt: item.finishedAt || new Date().toISOString(),
            durationSeconds: item.durationSeconds || 0,
            totalVolumeKg: item.totalVolumeKg || 0,
          });
          count++;
        }
        toast.success(`${count} geçmiş antrenman başarıyla aktarıldı!`);
        setWorkoutImportText("");
        setPreviewData(null);
        loadWorkouts();
      }
    } catch (e: any) {
      toast.error(`Aktarma hatası: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleToggleItem = (idx: number) => {
    if (!previewData) return;
    const updated = [...previewData.items];
    updated[idx].checked = !updated[idx].checked;
    setPreviewData({ ...previewData, items: updated });
  };

  const handleToggleExercise = (itemIdx: number, exIdx: number) => {
    if (!previewData) return;
    const updated = [...previewData.items];
    updated[itemIdx].exercises[exIdx].checked = !updated[itemIdx].exercises[exIdx].checked;
    setPreviewData({ ...previewData, items: updated });
  };

  if (!isLoaded || loading) {
    return (
      <GymShell activeTab="none">
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </GymShell>
    );
  }

  return (
    <GymShell activeTab="none">
      <div className="space-y-5">
        {/* Back header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (previewData) {
                setPreviewData(null);
              } else {
                window.location.href = "/apps/gym/profile";
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/60 text-gray-500 hover:text-gray-700 active:scale-95 transition-all"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">
            {previewData ? "Veri Aktarma Onayı" : "AI Analiz & Veri Yönetimi"}
          </h2>
        </div>

        {/* --- 1. APPROVAL PREVIEW VIEW --- */}
        {previewData ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                {previewData.type === "routine" ? "Rutin Şablonu Onayı" : "Antrenman Geçmişi Onayı"}
              </h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Yapay zekanın ürettiği veriler ile uygulamanızdaki eşleşen hareketleri aşağıdan tek tek kontrol edin. İstemediklerinizi devredışı bırakabilir veya <b>Düzenle</b> butonuyla egzersizleri değiştirebilirsiniz.
              </p>
            </div>

            <div className="space-y-4">
              {previewData.items.map((item, itemIdx) => (
                <div key={itemIdx} className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                  {/* Item Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleItem(itemIdx)}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300 shrink-0"
                      />
                      <span className="text-sm font-black text-gray-900 truncate">{item.name}</span>
                    </div>
                    {previewData.type === "workout" && (
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {item.durationSeconds ? `${Math.round(item.durationSeconds / 60)} dk` : ""}
                      </span>
                    )}
                  </div>

                  {/* Exercises Checklist */}
                  <div className="space-y-3.5">
                    {item.exercises.map((ex, exIdx) => {
                      const isExactMatch = ex.matchScore === 1.0;
                      const hasMatch = !!ex.matchedItem;

                      const matchBgClass = !hasMatch
                        ? "border-red-200 bg-red-50/20"
                        : isExactMatch
                        ? "border-emerald-200 bg-emerald-50/10"
                        : "border-amber-200 bg-amber-50/10";

                      return (
                        <div
                          key={exIdx}
                          className={`flex flex-col gap-2 p-3 border rounded-2xl transition-all ${matchBgClass}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={ex.checked}
                              disabled={!item.checked}
                              onChange={() => handleToggleExercise(itemIdx, exIdx)}
                              className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-gray-300 mt-2 shrink-0 disabled:opacity-40"
                            />
                            
                            <div className="flex-1 min-w-0 flex items-start gap-3 justify-between">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                {ex.matchedItem ? (
                                  <ExerciseThumbnail exercise={ex.matchedItem} size="sm" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-xs text-red-500 shrink-0">
                                    <Warning size={16} weight="bold" />
                                  </div>
                                )}
                                
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
                                    Yazılan İsim: {ex.name}
                                  </p>
                                  
                                  {ex.matchedItem ? (
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                      <span className="text-xs font-black text-gray-900 truncate">
                                        {ex.matchedItem.name}
                                      </span>
                                      
                                      {isExactMatch ? (
                                        <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                          Tam Eşleşme
                                        </span>
                                      ) : (
                                        <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                          Öneri (Benzer)
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-block mt-0.5 text-[8px] bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                      Eşleşmedi (Yeni Eklenecek)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setPickerActiveFor({ itemIdx, exIdx })}
                                className="shrink-0 flex items-center gap-1 text-[10px] bg-white border border-gray-200/80 hover:bg-gray-50 active:scale-95 text-gray-600 px-2.5 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                              >
                                <PencilSimple size={12} weight="bold" />
                                Değiştir
                              </button>
                            </div>
                          </div>

                          <div className="pl-7 flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-100/40 mt-1">
                            {ex.sets.map((s, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold"
                              >
                                S{sIdx + 1}: {s.weightKg ? `${s.weightKg}kg × ` : ""}{s.reps || 0}t
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPreviewData(null)}
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs py-3.5 rounded-xl active:scale-95 transition-all shadow-sm"
              >
                Geri Dön & Düzenle
              </button>
              <button
                onClick={handleApproveImport}
                disabled={importing}
                className="flex-1 bg-violet-600 hover:bg-violet-75 disabled:opacity-50 active:scale-95 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-violet-500/10"
              >
                {importing ? "Kaydediliyor..." : "Seçilenleri İçe Aktar"}
              </button>
            </div>
          </div>
        ) : (
          /* --- 2. REGULAR INPUT & COPY VIEW --- */
          <>
            {/* AI Analysis & Export Card */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500 border border-violet-100/50 shrink-0">
                  <Sparkle size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">AI Analiz & Veri Dışı Aktarım</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verilerini yedekle ve yapay zekaya aktar</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Tüm antrenman verilerinizi kopyalayabilir, cihazınıza indirebilir veya aşağıdaki rehberi açarak yapay zekaya yollayacağınız promptu kopyalayabilirsiniz.
              </p>

              <div className="rounded-xl border border-violet-200/60 bg-violet-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisOpen(!analysisOpen)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <span className="text-[10px] font-bold text-violet-900 uppercase tracking-wide">Yapay Zeka Analiz Promptu</span>
                    {analysisOpen ? (
                      <CaretUp size={14} className="text-violet-700 shrink-0" />
                    ) : (
                      <CaretDown size={14} className="text-violet-700 shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-violet-200 text-[10px] font-bold text-violet-700 hover:bg-violet-100 transition-colors active:scale-95 shadow-sm"
                  >
                    {analysisCopied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                    {analysisCopied ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>

                {analysisOpen && (
                  <div className="px-3 pb-3 border-t border-violet-200/40">
                    <pre className="mt-2 max-h-48 overflow-y-auto text-[10px] leading-relaxed text-violet-950 whitespace-pre-wrap font-mono">
                      {getAiPrompt()}
                    </pre>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCopyJson}
                  className="bg-gray-50 hover:bg-gray-100 active:scale-[0.98] text-gray-700 border border-gray-200/60 rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} weight="bold" />
                  Veriyi JSON Olarak Kopyala
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="bg-gray-50 hover:bg-gray-100 active:scale-[0.98] text-gray-700 border border-gray-200/60 rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Download size={14} weight="bold" />
                  JSON Dosyasını İndir
                </button>
              </div>
            </div>

            {/* 1. Import Routine Templates Box (Blue Theme) */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/50 shrink-0">
                  <FileCode size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Rutin Şablonlarımı İçe Aktar</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Yeni antrenman rutin programları yükle</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Yapay zekanın hazırladığı haftalık program rutinlerini kopyalayıp buraya yapıştırarak yeni rutin şablonu olarak ekleyebilirsiniz.
              </p>

              <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setRoutinePromptOpen(!routinePromptOpen)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Yapay Zeka Format Yönergesi</span>
                    {routinePromptOpen ? (
                      <CaretUp size={14} className="text-blue-700 shrink-0" />
                    ) : (
                      <CaretDown size={14} className="text-blue-700 shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyRoutineImportPrompt}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors active:scale-95 shadow-sm"
                  >
                    {routinePromptCopied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                    {routinePromptCopied ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>

                {routinePromptOpen && (
                  <div className="px-3 pb-3 border-t border-blue-200/40">
                    <pre className="mt-2 max-h-48 overflow-y-auto text-[10px] leading-relaxed text-blue-950 whitespace-pre-wrap font-mono">
                      {getRoutineImportPrompt()}
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <textarea
                  value={routineImportText}
                  onChange={(e) => setRoutineImportText(e.target.value)}
                  placeholder='[{"name": "Upper Body", "exercises": [{"name": "Bench Press", "sets": [{"reps": 10, "weightKg": 60}]}]}]'
                  className="w-full h-28 bg-gray-50/50 border border-gray-200/80 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300"
                />

                <button
                  onClick={handlePrepareRoutineImport}
                  disabled={importing || !routineImportText.trim()}
                  className="w-full bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] text-gray-700 border border-gray-200/60 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Upload size={14} weight="bold" />
                  Rutinleri Önizle & İçe Aktar
                </button>
              </div>
            </div>

            {/* 2. Import Workout Logs Box (Teal Theme) */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 border border-teal-100/50 shrink-0">
                  <Upload size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Geçmiş Antrenmanlarımı İçe Aktar</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tamamlanmış antrenman kayıtları yükle</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Önceki tarihlerde yaptığınız antrenmanların kayıtlarını geçmiş loglarınıza eklemek için burayı kullanabilirsiniz.
              </p>

              <div className="rounded-xl border border-teal-200/60 bg-teal-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setWorkoutPromptOpen(!workoutPromptOpen)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wide">Yapay Zeka Format Yönergesi</span>
                    {workoutPromptOpen ? (
                      <CaretUp size={14} className="text-teal-700 shrink-0" />
                    ) : (
                      <CaretDown size={14} className="text-teal-700 shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyWorkoutImportPrompt}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-[10px] font-bold text-teal-700 hover:bg-teal-100 transition-colors active:scale-95 shadow-sm"
                  >
                    {workoutPromptCopied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                    {workoutPromptCopied ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>

                {workoutPromptOpen && (
                  <div className="px-3 pb-3 border-t border-teal-200/40">
                    <pre className="mt-2 max-h-48 overflow-y-auto text-[10px] leading-relaxed text-teal-950 whitespace-pre-wrap font-mono">
                      {getWorkoutImportPrompt()}
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <textarea
                  value={workoutImportText}
                  onChange={(e) => setWorkoutImportText(e.target.value)}
                  placeholder='[{"name": "Push Day", "startedAt": "2026-07-11T12:00:00Z", "exercises": [{"name": "Şınav", "sets": [{"reps": 12, "weightKg": 0, "completed": true}]}]}]'
                  className="w-full h-28 bg-gray-50/50 border border-gray-200/80 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 placeholder:text-gray-300"
                />

                <button
                  onClick={handlePrepareWorkoutImport}
                  disabled={importing || !workoutImportText.trim()}
                  className="w-full bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] text-gray-700 border border-gray-200/60 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Upload size={14} weight="bold" />
                  Antrenmanları Önizle & İçe Aktar
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- 3. EXERCISE SELECTOR MODAL OVERLAY --- */}
      {pickerActiveFor !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPickerActiveFor(null)} />
          <div className="bg-white rounded-3xl p-5 w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[80vh] border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3 shrink-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">Egzersiz Değiştir</h3>
              <button 
                onClick={() => setPickerActiveFor(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:text-gray-700 active:scale-90 transition-transform"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <ExercisePicker 
                catalog={activeCatalog} 
                onSelect={(selectedEx) => {
                  if (!previewData) return;
                  const updated = [...previewData.items];
                  const ex = updated[pickerActiveFor.itemIdx].exercises[pickerActiveFor.exIdx];
                  ex.matchedItem = selectedEx;
                  ex.matchScore = 1.0; // Mark as perfect/confirmed match
                  setPreviewData({ ...previewData, items: updated });
                  setPickerActiveFor(null);
                  toast.success("Egzersiz başarıyla güncellendi!");
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {showFloatingBar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-gray-900/95 text-white rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 z-50 border border-gray-800 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-300">{floatingBarText}</p>
            </div>
            <button 
              onClick={() => setShowFloatingBar(false)}
              className="text-[10px] text-gray-400 hover:text-white font-black uppercase tracking-wider transition-colors"
            >
              Kapat
            </button>
          </div>
          
          <div className="flex items-center justify-between bg-gray-800/40 border border-gray-700/30 rounded-xl px-3 py-2 gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hızlı Analiz Et:</span>
            <div className="flex items-center gap-1.5">
              <a 
                href="https://chatgpt.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg font-black transition-all flex items-center gap-0.5 active:scale-95"
              >
                ChatGPT ↗
              </a>
              <a 
                href="https://gemini.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg font-black transition-all flex items-center gap-0.5 active:scale-95"
              >
                Gemini ↗
              </a>
              <a 
                href="https://claude.ai" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg font-black transition-all flex items-center gap-0.5 active:scale-95"
              >
                Claude ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </GymShell>
  );
}
